'use server'

// External imports
import { NextRequest, NextResponse } from "next/server";

// Internal imports
import { db } from '../../lib/cache';
import Store from '../../interfaces/StoreInterface';
import Access from "../../interfaces/AccessInterface";
import { getAccessToken } from "../../lib/authenticate";


/**
 * Server function stores elevated tokens
 * 
 * @param request The input HTTP request
 * 
 * @returns Confirmation of storage success
 */
export async function POST(request: NextRequest) {

  // Cookies
  const elevate: boolean = request.cookies.get("elevate")?.value === "true";

  // Response
  let response: NextResponse;

  try{

    // Get request body
    const data: Store = await request.json();

    // Get credentials
    const redirect_uri: string = (new URL('/reflector', request.nextUrl.origin)).toString();
    const access: Access | null = await getAccessToken(data.authCode, redirect_uri);

    console.log(elevate && access ? "Scenario 1: True": "Scenario 1: False")
    console.log(access ? "Scenario 2: True": "Scenario 2: False")

    // Store credentials
    if(elevate && access){

      console.log("Point 1");

      // Set higher level authorization
      await db.put("elevatedToken", access.access_token);
      await db.put("elevatedRefreshToken", access.refresh_token);

      console.log("Point 2");

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

      console.log("Point 3");

      // Delete unncessary cookies
      response.cookies.delete("elevate");
      response.cookies.delete("user-nonce");

      console.log("Point 4");

    }else if(access){

      console.log("Point 5");
      
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

      console.log("Point 6");

      // Create Cookies
      response.cookies.set("authToken", access.access_token, {
        path: "/",
        sameSite: "strict",
        httpOnly: true,
        secure: process.env.ENVIRONMENT?.toUpperCase() === "PRODUCTION",
        maxAge: 60 * 60 * 24 * 30
      });
      response.cookies.set("refreshToken", access.refresh_token, {
        path: "/",
        sameSite: "strict",
        httpOnly: true,
        secure: process.env.ENVIRONMENT?.toUpperCase() === "PRODUCTION",
        maxAge: 60 * 60 * 24 * 30
      });

      console.log("Point 7");

      // Delete unncessary cookies
      response.cookies.delete("elevate");
      response.cookies.delete("user-nonce");

      console.log("Point 8");
    
    }else{

       // Negatory response
      response = new NextResponse(
        null,
        {
          status: 500
        }
      );

      console.log("Unsuccessful store");

    }

  }catch(err){

    // Return confirming response
    response = new NextResponse(
      null,
      {
        status: 500
      }
    );

    console.log("Unsuccessful store");

  }

  console.log()

  return response;  
}
