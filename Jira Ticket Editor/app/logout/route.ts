'use server'

// External imports
import { NextRequest, NextResponse } from "next/server";


/**
 * Server function clears all authentication cookies and redirects the user
 * back to login.
 * 
 * @param request The input HTTP request
 * 
 * @returns A redirect to login
 */
export async function GET(request: NextRequest): Promise<NextResponse> {

  // Redirect
  const url: URL = new URL(request.url);
  url.pathname = "/login";
  const response = NextResponse.redirect(url);

  // Clear Cookies
  request.cookies.getAll().forEach((cookie) => {
    response.cookies.delete(cookie.name);
  })

  return response;
}
