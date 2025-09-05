'use server'

// External imports
import { NextRequest, NextResponse } from "next/server";

// Internal imports
import { db } from '../../../lib/BackendCache';
import AuthTokensInterface from "@/interfaces/AuthTokensInterface";
import AuthWrapper from "@/lib/AuthWrapper";



/**
 * This function clears the service account credentials.
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
async function clearServiceAccountCredentials(request: NextRequest, authTokens: AuthTokensInterface, requestingAccountID: string | undefined, authorizedAccountID: string | undefined): Promise<NextResponse> {
    
  let response: NextResponse | undefined;

  // Validate that the user has authority to de-authorize
  if(requestingAccountID === undefined || requestingAccountID !== authorizedAccountID){
    response = new NextResponse(
      JSON.stringify(
        {
          msg: "Unauthorized operation failed - only the authorizing user can deauthorize."
        }
      ),
      {
        status: 401
      }
    )
  }

  // Remove elevated permissions
  if(!response){

    try{

      await db.remove("serviceAccountToken");
      await db.remove("serviceAccountEmail");
      await db.remove("authorizedAccountID");

    }catch{
      
      response = new NextResponse(
        JSON.stringify(
          {
            msg: "The server experienced an unexpected error."
          }
        ),
        {
          status: 500
        }
      );

    }
    
  }

  // Return confirming response
  if(!response){
    response = new NextResponse(
      null,
      {
        status: 204
      }
    );
  }

  return response;
} 



/**
 * Server function clears all authentication cookies and redirects the user
 * back to login.
 * 
 * @param request The input HTTP request
 * 
 * @returns A redirect to login
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {  
  return (await AuthWrapper(request, clearServiceAccountCredentials));
}
