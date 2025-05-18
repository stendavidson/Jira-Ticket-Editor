'use server'

// External imports
import { NextRequest, NextResponse } from "next/server";

// Internal imports
import { db } from '../../../lib/cache';
import AuthTokensInterface from "@/interfaces/AuthTokensInterface";
import AuthWrapper from "@/lib/AuthWrapper";


/**
 * Server function clears all authentication cookies and redirects the user
 * back to login.
 * 
 * @param request The input HTTP request
 * 
 * @returns A redirect to login
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {

  async function requestHandler(request: NextRequest, authTokens: AuthTokensInterface, requestingAccountID: string | undefined, authorizedAccountID: string | undefined): Promise<NextResponse> {
      
    let response: NextResponse | undefined;

    // Validate that the user has authority to de-authorize
    if(requestingAccountID === undefined || requestingAccountID !== authorizedAccountID){
      response = new NextResponse(
        JSON.stringify(
          {
            msg: "Unauthorized operation failed - only the authenticating user can deauthorize."
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

        await db.remove("elevatedToken");
        await db.remove("elevatedRefreshToken");
        await db.remove("accountID");

      }catch(err){
        
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
  
  return (await AuthWrapper(request, requestHandler));
}
