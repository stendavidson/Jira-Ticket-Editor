'use server'

// External imports
import { NextRequest, NextResponse } from "next/server";

// Internal imports
import { OAuth2AccessInterface } from "@/interfaces/AccessInterface";
import { getAccessToken, validate, validateState } from "@/lib/AuthenticateLib";
import CredentialInterface from "@/interfaces/CredentialInterface";


/**
 * Server function stores elevated tokens
 * 
 * @param request The input HTTP request
 * 
 * @returns Confirmation of storage success
 */
export async function POST(request: NextRequest) {

  // Get request body
  const data: CredentialInterface = await request.json();

  // Cookies
  const userNonce = request.cookies.get("user-nonce")?.value;

  // Get new auth codes
  const access: OAuth2AccessInterface | null = data.authCode ? await getAccessToken(data.authCode, (new URL('/reflector', request.nextUrl.origin)).toString()) : null;
  const validState: boolean = (data.stateCode && userNonce) ? (await validateState(userNonce, data.stateCode, process.env.SALT!)) : false;
  const newCredentials: boolean = (access !== null && validState && (await validate(access.access_token)));

  // Response
  let response: NextResponse | undefined;

  // The request is not elevated AND the authenticating user is NOT logged in BUT new credentials
  // are valid - implying that this is a new login
  if(newCredentials){

    response = new NextResponse(
      null,
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
    for(const cookie of request.cookies.getAll()){
      if(cookie.name !== "authToken" && cookie.name !== "refreshToken"){
        response.cookies.delete(cookie.name);
      }
    }

  }else{

    // Negative response
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
