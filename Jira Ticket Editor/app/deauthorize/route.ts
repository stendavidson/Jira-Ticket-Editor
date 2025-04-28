'use server'

// External imports
import { NextRequest, NextResponse } from "next/server";

// Internal imports
import { db } from '../../lib/cache';
import { refreshAccessToken, validate } from "../../lib/authenticate";
import Access from "../../interfaces/AccessInterface";


/**
 * Server function clears all authentication cookies and redirects the user
 * back to login.
 * 
 * @param request The input HTTP request
 * 
 * @returns A redirect to login
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {

  // Cookies
  const authToken = request.cookies.get("authToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  // Response
  let response: NextResponse | undefined;

  // User must be already be authorized to elevate permissions
  if(!authToken || !(await validate(authToken))){

    if(refreshToken){

      const access: Access | null = await refreshAccessToken(refreshToken);

      if(!access || !(await validate(access.access_token))){
        response = new NextResponse(
          null,
          {
            status: 401
          }
        )
      }
    }  
  }

  // Remove elevated permissions
  if(!response){

    // Delete higher level authorization
    await db.remove("elevatedToken");
    await db.remove("elevatedRefreshToken");

    // Return confirming response
    response = new NextResponse(
      null,
      {
        status: 204
      }
    );
  }

  return response;
}
