
import Access from "@/interfaces/AccessInterface";
import AtlassianUser from "@/interfaces/AtlassianUserInterface";
import AuthTokensInterface from "@/interfaces/AuthTokensInterface";
import { NextRequest, NextResponse } from "next/server";
import { refreshAccessToken, validate } from "./authenticate";
import getUser from "./user";
import { db } from "./cache";


export default async function AuthWrapper(request: NextRequest, requestHandler: (request: NextRequest, authTokens: AuthTokensInterface, requestingAccountID: string | undefined, authorizedAccountID: string | undefined) => Promise<NextResponse>): Promise<NextResponse>{

  // Elevated status
  const searchParams = (new URL(request.url)).searchParams;
  const elevate: boolean = searchParams.get('elevate') === "true";

  // authTokens
  const authTokens: AuthTokensInterface = {
    authToken: request.cookies.get("authToken")?.value,
    refreshToken: request.cookies.get("refreshToken")?.value,
    elevatedToken: undefined,
    elevatedRefreshToken: undefined
  };

  // Response
  let response: NextResponse | undefined;

  // Updated Credentials Toggle
  let updatedCredentials: boolean = false;
  let updatedElevatedCredentials: boolean = false;

  // Access objects
  let primaryAccess: Access | null = null;
  let secondaryAccess: Access | null = null;

  // Elevated tokens
  let accountID : string | undefined;

  // User data
  let requestingUser: AtlassianUser | null = null;

  // Retrieve elevated tokens
  try{

    authTokens.elevatedToken = await db.get("elevatedToken");
    authTokens.elevatedRefreshToken = await db.get("elevatedRefreshToken");
    accountID = await db.get("accountID");

  }catch(err){

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

  // Check user's standard auth tokens
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

        updatedCredentials = (primaryAccess !== null);

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


  // If the request is "elevated" validate and/or refresh stored credentials
  if(response === undefined && elevate && (authTokens.elevatedToken === undefined || !(await validate(authTokens.elevatedToken)))){

    if(authTokens.elevatedRefreshToken !== undefined){

      secondaryAccess = await refreshAccessToken(authTokens.elevatedRefreshToken);

      if(!secondaryAccess || !(await validate(secondaryAccess.access_token))){

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

        updatedElevatedCredentials = (secondaryAccess !== null);

      }
      
    }else{

      // In the fail case, both elevated tokens are undefined
      authTokens.elevatedToken = undefined;

    }
  }


  // If the user is authorized then make sure all credentials are updated as needed
  if(response === undefined){

    // Update standard credentials
    if(updatedCredentials){
      authTokens.authToken = primaryAccess!.access_token;
      authTokens.refreshToken = primaryAccess!.refresh_token;
    }

    requestingUser = await getUser(authTokens.authToken!);

    try{
      
      // Updated elevated credentials only if the requesting user is an authorized user
      if(updatedCredentials && accountID !== undefined && accountID === requestingUser?.accountId){

        authTokens.elevatedToken = primaryAccess!.access_token;
        authTokens.elevatedRefreshToken = primaryAccess!.refresh_token;
        await db.put("elevatedToken", authTokens.elevatedToken);
        await db.put("elevatedRefreshToken", authTokens.elevatedRefreshToken);

      // Updated elevated credentials if the request is elevated
      }else if(updatedElevatedCredentials){
        
        authTokens.elevatedToken = secondaryAccess!.access_token;
        authTokens.elevatedRefreshToken = secondaryAccess!.refresh_token;
        await db.put("elevatedToken", authTokens.elevatedToken);
        await db.put("elevatedRefreshToken", authTokens.elevatedRefreshToken);

      }

    }catch(err){

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
  }


  // If an exception hasn't been thrown
  if(!response){
    response = await requestHandler(request, authTokens, requestingUser?.accountId, accountID);
  }


  // Set Cookies as needed
  if(updatedCredentials){

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