'use server'

// External imports
import { NextRequest, NextResponse } from "next/server";

// Internal imports
import { db } from '../../../lib/cache';
import Store from '../../../interfaces/StoreInterface';
import Access from "../../../interfaces/AccessInterface";
import { getAccessToken, validate } from "../../../lib/authenticate";
import AtlassianUser from "../../../interfaces/AtlassianUserInterface";
import getUser from "../../../lib/user";


/**
 * Server function stores elevated tokens
 * 
 * @param request The input HTTP request
 * 
 * @returns Confirmation of storage success
 */
export async function POST(request: NextRequest) {

  // Get request body
  const data: Store = await request.json();

  // Cookies
  const elevate: boolean = request.cookies.get("elevate")?.value === "true";
  const authToken = request.cookies.get("authToken")?.value;
  
  // Check existing auth codes
  const loggedIn: boolean = (authToken !== undefined && (await validate(authToken)));

  // Get new auth codes
  const access: Access | null = await getAccessToken(
    data.authCode, 
    (new URL('/reflector', request.nextUrl.origin)).toString()
  );
  const newCredentials: boolean = (access !== null && (await validate(access.access_token)));

  // Response
  let response: NextResponse | undefined;

  // The request is elevated AND the requeting user is logged in AND there are new valid 
  // credentials - implying this is an authorization request
  if(elevate && loggedIn && newCredentials){

    ////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////// Request User Information /////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////

    let loggedInUser: AtlassianUser | null = await getUser(authToken!);
    let authorizingUser: AtlassianUser | null =  await getUser(access!.access_token);

    ////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////// Handle Credential Config Pathways ////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////

    if(loggedInUser && authorizingUser && loggedInUser.accountId === authorizingUser.accountId){

      try{

        // Set higher level authorization
        await db.put("elevatedToken", access!.access_token);
        await db.put("elevatedRefreshToken", access!.refresh_token);
        await db.put("accountID", authorizingUser.accountId);

      }catch(err){

        // Return confirming response
        response = new NextResponse(
          JSON.stringify(
            {
              msg: "Server experienced an unexpected error while authorizing."
            }
          ),
          {
            status: 500
          }
        );

      }

    }else{

      // Affirmative response
      response = new NextResponse(
        JSON.stringify(
          {
            msg: "Your authorizing account doesn't match your logged in account."
          }
        ),
        {
          status: 400
        }
      );

    }

    if(!response){

      // Affirmative response
      response = new NextResponse(
        JSON.stringify(
          {
            elevate: elevate
          }
        ),
        {
          status: 200
        }
      );

      // Update cookies to prevent the existing cookies from being invalidated
      response.cookies.set("authToken", access!.access_token, {
        path: "/",
        sameSite: "strict",
        httpOnly: true,
        secure: process.env.ENVIRONMENT?.toUpperCase() === "PRODUCTION",
        maxAge: 60 * 60 * 24 * 30
      });
      response.cookies.set("refreshToken", access!.refresh_token, {
        path: "/",
        sameSite: "strict",
        httpOnly: true,
        secure: process.env.ENVIRONMENT?.toUpperCase() === "PRODUCTION",
        maxAge: 60 * 60 * 24 * 30
      });

      // Delete unncessary cookies
      response.cookies.delete("elevate");
      response.cookies.delete("user-nonce");
      
    }

  // The request is not elevated AND the authenticating user is NOT logged in BUT new credentials
  // are valid - implying that this is a new login
  }else if(!elevate && !loggedIn && newCredentials){

    ////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////// Update Authorizing User Tokens //////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////

    let requestingUser: AtlassianUser | null = await getUser(access!.access_token);
    let accountID : string | undefined;

    try{

      accountID = await db.get("accountID");

      // If the authorizing user has logged in - update tokens
      if(accountID !== undefined && requestingUser?.accountId === accountID){
        await db.put("elevatedToken", access!.access_token);
        await db.put("elevatedRefreshToken", access!.refresh_token);
      }

    }catch(err){

      // Return confirming response
      response = new NextResponse(
        JSON.stringify(
          {
            msg: "Server experienced an unexpected error while logging in."
          }
        ),
        {
          status: 500
        }
      );

    }

    // Affirmative response
    if(!response){

      response = new NextResponse(
        JSON.stringify(
          {
            elevate: elevate
          }
        ),
        {
          status: 200
        }
      );

      // Update cookies to prevent the existing cookies from being invalidated
      response.cookies.set("authToken", access!.access_token, {
        path: "/",
        sameSite: "strict",
        httpOnly: true,
        secure: process.env.ENVIRONMENT?.toUpperCase() === "PRODUCTION",
        maxAge: 60 * 60 * 24 * 30
      });
      response.cookies.set("refreshToken", access!.refresh_token, {
        path: "/",
        sameSite: "strict",
        httpOnly: true,
        secure: process.env.ENVIRONMENT?.toUpperCase() === "PRODUCTION",
        maxAge: 60 * 60 * 24 * 30
      });

      // Delete unncessary cookies
      response.cookies.delete("elevate");
      response.cookies.delete("user-nonce");
    }

  }else{

    // Negatory response
    response = new NextResponse(
      JSON.stringify(
        {
          msg: "Malformed request."
        }
      ),
      {
        status: 400
      }
    );

  }

  return response;  
}
