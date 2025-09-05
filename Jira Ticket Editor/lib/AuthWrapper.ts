
import { OAuth2AccessInterface } from "@/interfaces/AccessInterface";
import UserInterface from "@/interfaces/UserInterface";
import AuthTokensInterface from "@/interfaces/AuthTokensInterface";
import { NextRequest, NextResponse } from "next/server";
import { refreshAccessToken, validate } from "./AuthenticateLib";
import getUser from "./UserLib";
import { db } from "./BackendCache";
import { decrypt } from "./CryptoLib";


/**
 * This wrapper function manages HTTP request authentication validation, renewal, etc,
 * ensuring the request is only ever handled once it has been validated.
 * 
 * @param request The HTTP request object
 * 
 * @param requestHandler A request handler function
 * 
 * @returns A HTTP response as provided by the handler function
 */
export default async function AuthWrapper(request: NextRequest, requestHandler: (request: NextRequest, authTokens: AuthTokensInterface, requestingAccountID: string | undefined, authorizedAccountID: string | undefined) => Promise<NextResponse>): Promise<NextResponse>{

  // Auth tokens
  const authTokens: AuthTokensInterface = {
    authToken: request.cookies.get("authToken")?.value,
    refreshToken: request.cookies.get("refreshToken")?.value,
    serviceAccountToken: undefined,
    serviceAccountEmail: undefined
  };

  // Response
  let response: NextResponse | undefined;

  // Update Credentials Toggle
  let updateCredentials: boolean = false;

  // OAuth2AccessInterface objects
  let primaryAccess: OAuth2AccessInterface | null = null;

  // Admin Account ID
  let authorizedAccountID : string | undefined;

  // User data
  let requestingUser: UserInterface | null = null;

  // Retrieve elevated tokens
  try{

    authTokens.serviceAccountToken = await db.get("serviceAccountToken");
    authTokens.serviceAccountToken = authTokens.serviceAccountToken ? decrypt(authTokens.serviceAccountToken, process.env.SALT!) : undefined;
    authTokens.serviceAccountEmail = await db.get("serviceAccountEmail");
    authorizedAccountID = await db.get("authorizedAccountID");

  }catch{

    response = new NextResponse(
      JSON.stringify(
        {
          msg: "The server experienced an unexpected error."
        }
      ),
      {
        status: 500
      }
    );

  }

  // Check user's standard auth tokens - and attempt to refresh the USER'S tokens
  if(response === undefined && (authTokens.authToken === undefined || !(await validate(authTokens.authToken)))){

    if(authTokens.refreshToken){

      primaryAccess = await refreshAccessToken(authTokens.refreshToken);

      if(!primaryAccess || !(await validate(primaryAccess.access_token))){

        response = new NextResponse(
          JSON.stringify(
            {
              msg: "The user is not authorized to perform this operation."
            }
          ),
          {
            status: 401
          }
        )

      }else{

        updateCredentials = (primaryAccess !== null);

      }

    }else{

      response = new NextResponse(
        JSON.stringify(
          {
            msg: "The user is not authorized to perform this operation."
          }
        ),
        {
          status: 401
        }
      );

    }  
  }


  // If the user is authorized then make sure all credentials are updated as needed
  if(response === undefined){

    // Update standard credentials
    if(updateCredentials){
      authTokens.authToken = primaryAccess!.access_token;
      authTokens.refreshToken = primaryAccess!.refresh_token;
    }

    requestingUser = await getUser(authTokens.authToken!);
    response = await requestHandler(request, authTokens, requestingUser?.accountId, authorizedAccountID);
  }


  // Set Cookies as needed
  if(updateCredentials){

    response.cookies.set("authToken", authTokens.authToken!, {
      path: "/",
      sameSite: "strict",
      httpOnly: true,
      secure: process.env.ENVIRONMENT?.toUpperCase() === "PRODUCTION",
      maxAge: 60 * 60 * 24 * 30
    });

    response.cookies.set("refreshToken", authTokens.refreshToken!, {
      path: "/",
      sameSite: "strict",
      httpOnly: true,
      secure: process.env.ENVIRONMENT?.toUpperCase() === "PRODUCTION",
      maxAge: 60 * 60 * 24 * 30
    });

  }

  return response
}