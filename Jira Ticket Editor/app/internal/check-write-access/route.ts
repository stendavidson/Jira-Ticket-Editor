'use server'

// External imports
import { NextRequest, NextResponse } from "next/server";

// Internal imports
import AuthWrapper from "@/lib/AuthWrapper";
import AuthTokensInterface from "@/interfaces/AuthTokensInterface";



/**
 * This function validates that the user has access to remove the service account credentials.
 * 
 * @param request The underlying NextRequest object
 * 
 * @param authTokens The required authentication tokens
 * 
 * @param requestingAccountID The requesting account's ID
 * 
 * @param authorizedAccountID The service account's ID
 * 
 * @returns A HTTP response either 204 
 */
async function checkServiceAccountEditAccess(request: NextRequest, authTokens: AuthTokensInterface, requestingAccountID: string | undefined, authorizedAccountID: string | undefined): Promise<NextResponse> {
  
  const response: NextResponse  = new NextResponse(
    null,
    {
      status: requestingAccountID !== undefined && requestingAccountID === authorizedAccountID ? 204 : 401
    }
  );

  return response;
}  



/**
 * Endpoint returns the requesting user's write access level
 * 
 * @param request The input HTTP request
 * 
 * @returns The requesting user's write access level
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  return (await AuthWrapper(request, checkServiceAccountEditAccess));
}
