'use server'

// External imports
import { NextRequest, NextResponse } from "next/server";

// Internal imports
import AuthTokensInterface from "@/interfaces/AuthTokensInterface";
import AuthWrapper from "@/lib/AuthWrapper";


/**
 * Endpoint returns the application's elevated status
 * 
 * @param request The input HTTP request
 * 
 * @returns The application's elevated status
 */
export async function GET(request: NextRequest): Promise<NextResponse> {

  async function requestHandler(request: NextRequest, authTokens: AuthTokensInterface, requestingAccountID: string | undefined, authorizedAccountID: string | undefined): Promise<NextResponse> {
      
    let response: NextResponse;
    
    response = new NextResponse(
      null,
      {
        status: authTokens.elevatedToken !== undefined && authTokens.elevatedRefreshToken !== undefined ? 204: 401
      }
    );

    return response;
  }  
  
  return (await AuthWrapper(request, requestHandler));
}
