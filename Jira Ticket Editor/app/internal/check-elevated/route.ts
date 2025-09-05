'use server'

// External imports
import { NextRequest, NextResponse } from "next/server";

// Internal imports
import AuthTokensInterface from "@/interfaces/AuthTokensInterface";
import AuthWrapper from "@/lib/AuthWrapper";



/**
 * This function validates that a service account is registered with this application
 * 
 * @param request The underlying NextRequest object
 * 
 * @param authTokens The required authentication tokens
 * 
 * @param requestingAccountID The requesting account's ID
 * 
 * @param authorizedAccountID The service account's ID
 * 
 * @returns A HTTP response either 204 or 401 to confirm the existance of a service account.
 */
async function checkSeriveAccountRegistration(request: NextRequest, authTokens: AuthTokensInterface, requestingAccountID: string | undefined, authorizedAccountID: string | undefined): Promise<NextResponse> {
  
  const response: NextResponse = new NextResponse(
    null,
    {
      status: authTokens.serviceAccountToken !== undefined && authTokens.serviceAccountEmail !== undefined ? 204: 401
    }
  );

  return response;
}  



/**
 * Endpoint validates that a service account is registered with this application
 * 
 * @param request The input HTTP request
 * 
 * @returns The application's elevated status
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  return (await AuthWrapper(request, checkSeriveAccountRegistration));
}
