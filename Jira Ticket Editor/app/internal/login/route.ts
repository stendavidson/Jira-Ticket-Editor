'use server'

// External imports
import { NextRequest, NextResponse } from "next/server";
import { generateHMAC, generateRandomData } from "../../../lib/keyed_hash";

// Internal imports
import { refreshAccessToken, validate } from "../../../lib/authenticate";
import { sha512_key } from "../../../keys";
import Access from "../../../interfaces/AccessInterface";


/**
 * Server function redirects this route to the Atlassian login
 * 
 * @param request The input HTTP request
 * 
 * @returns A redirect to the Atlassian login
 */
export async function GET(request: NextRequest): Promise<NextResponse> {

  // Cookies
  const authToken: string | undefined = request.cookies.get("authToken")?.value;
  const refreshToken: string | undefined = request.cookies.get("refreshToken")?.value;

  // URL Parameters
  const source: string | null = request.nextUrl.searchParams.get("source");

  // Response
  let response: NextResponse | undefined;

  // Redirect if already logged in
  if(authToken && (await validate(authToken))){

    // Redirect
    const url = new URL(request.url);
    url.pathname = source ? source: "/authenticated/projects";
    url.search = "";
    response = NextResponse.redirect(url);
    
  }else if(refreshToken){
    const access: Access | null = await refreshAccessToken(refreshToken);
    if(access && (await validate(access.access_token))){

      const url = new URL(request.url);
      url.pathname = source ? source: "/authenticated/projects";
      url.search = "";
      response = NextResponse.redirect(url);
      
      // Set cookies
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
    }
  }
  
  // Login in user if not already logged in.
  if(!response){

    // sub redirect uri
    const redirect_uri = new URL('/reflector', request.nextUrl.origin);
    
    // Set the user nonce
    const urlNonce: string = generateRandomData(32); 
    const userNonce = await generateHMAC(sha512_key, urlNonce);

    // Redirect URL
    const REDIRECT_URL = new URL('https://auth.atlassian.com/authorize');
    REDIRECT_URL.searchParams.append('audience', 'api.atlassian.com');
    REDIRECT_URL.searchParams.append('client_id', process.env.CLIENT_ID ? process.env.CLIENT_ID : "");
    REDIRECT_URL.searchParams.append('scope', 'read:me read:account read:jira-work manage:jira-project manage:jira-configuration read:jira-user write:jira-work manage:jira-webhook manage:jira-data-provider read:servicedesk-request manage:servicedesk-customer write:servicedesk-request read:servicemanagement-insight-objects offline_access');
    REDIRECT_URL.searchParams.append('redirect_uri', redirect_uri.toString());
    REDIRECT_URL.searchParams.append('state', urlNonce);
    REDIRECT_URL.searchParams.append('response_type', 'code');
    REDIRECT_URL.searchParams.append('prompt', 'login');

    // Redirect
    response = NextResponse.redirect(REDIRECT_URL);

    // Create a cookie
    response.cookies.set("user-nonce", userNonce, {
      path: "/",
      sameSite: "lax",
      httpOnly: true,
      secure: false,
      maxAge: 60 * 60 * 24 * 30
    });

    // Create a cookie
    response.cookies.set("elevate", "false", {
      path: "/",
      sameSite: "lax",
      httpOnly: true,
      secure: false,
      maxAge: 60 * 60 * 24 * 30
    });

    // Create a source cookie
    response.cookies.set("source", source ? source: "/authenticated/projects", {
      path: "/",
      sameSite: "lax",
      httpOnly: true,
      secure: false,
      maxAge: 60 * 60 * 24 * 30
    });
  }

  return response;
}
