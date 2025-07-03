'use server'

// External imports
import { NextRequest, NextResponse } from "next/server";
import { generateHMAC, generateRandomData } from "../../../lib/keyed_hash";

// Internal imports
import { sha512_key } from "../../../keys";
import { validate } from "../../../lib/authenticate";


/**
 * Server function redirects this route to the Atlassian login
 * 
 * @param request The input HTTP request
 * 
 * @returns A redirect to the Atlassian login
 */
export async function GET(request: NextRequest): Promise<NextResponse> {

  // Cookies
  const authToken = request.cookies.get("authToken")?.value;

  // URL Parameters
  const source: string | null = request.nextUrl.searchParams.get("source");

  // Response
  let response: NextResponse | undefined;

  // User must be already be authorized to elevate permissions
  if(!authToken || !(await validate(authToken))){
    response = NextResponse.redirect(new URL(source ? source: '/internal/login', request.nextUrl.origin));
    response.cookies.delete("source");
  }

  // Elevate permissions
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
    REDIRECT_URL.searchParams.append('scope', 'read:me read:account read:jira-work manage:jira-project manage:jira-configuration read:jira-user write:jira-work manage:jira-webhook manage:jira-data-provider read:servicedesk-request manage:servicedesk-customer write:servicedesk-request read:servicemanagement-insight-objects write:board-scope.admin:jira-software delete:board-scope.admin:jira-software read:board-scope.admin:jira-software write:board-scope:jira-software read:board-scope:jira-software write:epic:jira-software read:epic:jira-software write:issue:jira-software read:issue:jira-software write:sprint:jira-software delete:sprint:jira-software read:sprint:jira-software read:project:jira read:issue-type-hierarchy:jira offline_access');
    REDIRECT_URL.searchParams.append('redirect_uri', redirect_uri.toString());
    REDIRECT_URL.searchParams.append('state', urlNonce);
    REDIRECT_URL.searchParams.append('response_type', 'code');
    REDIRECT_URL.searchParams.append('prompt', 'login');

    // Redirect
    response = NextResponse.redirect(REDIRECT_URL);

    // Create a user-nonce cookie
    response.cookies.set("user-nonce", userNonce, {
      path: "/",
      sameSite: "lax",
      httpOnly: true,
      secure: false,
      maxAge: 60 * 60 * 24 * 30
    });

    // Create a elevate cookie
    response.cookies.set("elevate", "true", {
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
