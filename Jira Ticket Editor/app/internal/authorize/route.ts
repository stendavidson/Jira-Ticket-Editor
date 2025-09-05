'use server'

// External imports
import { NextRequest, NextResponse } from "next/server";

// Internal imports
import { validate } from "../../../lib/AuthenticateLib";
import { BasicAuthAccessInterface } from "@/interfaces/AccessInterface";
import { db } from "@/lib/BackendCache";
import UserInterface from "@/interfaces/UserInterface";
import getUser from "@/lib/UserLib";
import { encrypt } from "../../../lib/CryptoLib";


/**
 * Server function redirects this route to the Atlassian login
 * 
 * @param request The input HTTP request
 * 
 * @returns A redirect to the Atlassian login
 */
export async function POST(request: NextRequest): Promise<NextResponse> {

  // Cookies
  const authToken = request.cookies.get("authToken")?.value;

  // URL Parameters
  const source: string | null = request.nextUrl.searchParams.get("source");
  
  // Handle request
  const access: BasicAuthAccessInterface = (await request.json()) as BasicAuthAccessInterface;

  // The requesting user
  let requestingUser: UserInterface | null = null;

  // Response
  let response: NextResponse | undefined;

  // User must be already be authorized to elevate permissions
  if(!authToken || !(await validate(authToken))){
    response = NextResponse.redirect(new URL(source ? source: '/internal/login', request.nextUrl.origin));
    response.cookies.delete("source");
  }

  // Retrieve the requesting user
  if(!response){

    requestingUser = authToken ? await getUser(authToken) : null;
    
    if(requestingUser === null){

      response = new NextResponse(
        JSON.stringify(
          {
            msg: "The server experienced an unexpected error."
          }
        ),
        { status: 500 }
      );

    }
  }

  // Store credentials
  if(!response){

    try{

      await db.put("serviceAccountToken", encrypt(access.access_token, process.env.SALT!));
      await db.put("serviceAccountEmail", access.emailAddress);
      await db.put("authorizedAccountID", requestingUser!.accountId);

      response = new NextResponse(
        null,
        { status: 204 }
      );
      
    }catch{

      response = new NextResponse(
        JSON.stringify(
          {
            msg: "The server experienced an unexpected error."
          }
        ),
        { status: 500 }
      );

    }
  }

  return response;
}
