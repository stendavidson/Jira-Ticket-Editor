'use server'

// External imports
import { NextRequest, NextResponse } from "next/server";

// Internal imports
import AuthWrapper from "@/lib/AuthWrapper";
import AuthTokensInterface from "@/interfaces/AuthTokensInterface";


/**
 * Endpoint returns the requesting user's write access level
 * 
 * @param request The input HTTP request
 * 
 * @returns The requesting user's write access level
 */
export async function GET(request: NextRequest): Promise<NextResponse> {

  async function requestHandler(request: NextRequest, authTokens: AuthTokensInterface, requestingAccountID: string | undefined, authorizedAccountID: string | undefined): Promise<NextResponse> {
    
    let response: NextResponse;
    
    response = new NextResponse(
      null,
      {
        status: requestingAccountID !== undefined && requestingAccountID === authorizedAccountID ? 204 : 401
      }
    );

    return response;
  }  

  return (await AuthWrapper(request, requestHandler));
}
