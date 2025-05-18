// External imports
import { NextResponse, NextRequest } from 'next/server';


// Internal imports
import Access from './interfaces/AccessInterface';
import { validate, refreshAccessToken } from './lib/authenticate';
 

export async function middleware(request: NextRequest) {

  // Cookies
  const authToken: string | undefined = request.cookies.get("authToken")?.value;
  const refreshToken: string | undefined = request.cookies.get("refreshToken")?.value;
  const sourceCookie: string | undefined = request.cookies.get("source")?.value;

  // Response
  let response: NextResponse | undefined;

  ///////////////////////////////////////////////////////////
  //////////////// Handle Authenticated Path ////////////////
  ///////////////////////////////////////////////////////////
  
  // If the user is already logged in
  if(authToken && (await validate(authToken))){

    console.log("Position 1");

    // If the sourceCookie has been set
      // If the current path == sourceCookie set in '\login' and '\authorize'
        // Continue
      // Else
        // Redirect to source given by sourceCookie set in '\login' and '\authorize'
    // Else
      // Continue
    
    if(sourceCookie){
      if(request.nextUrl.pathname === sourceCookie){
        console.log("Position 1");
        response = NextResponse.next();
        response.cookies.delete("source");
      }else{
        console.log("Position 2");
        const url = new URL(request.url);
        url.pathname = sourceCookie;
        response = NextResponse.redirect(url);
      }
    }else{
      console.log("Position 3");
      response = NextResponse.next();
    }
  
  // OR if the user has a valid refresh token
  }else if(refreshToken){
    
    const access: Access | null = await refreshAccessToken(refreshToken);

    if(access && (await validate(access.access_token))){

      // If the source has been set
        // If the current path == sourceCookie set in '\login' and '\authorize'
          // Continue to intended path
        // Else
          // Redirect to source given by sourceCookie set in '\login' and '\authorize'
      // Else
        // Continue
      
      if(sourceCookie){
        if(request.nextUrl.pathname === sourceCookie){
          console.log("Position 4");
          response = NextResponse.next();
          response.cookies.delete("source");
        }else{
          console.log("Position 5");
          const url = new URL(request.url);
          url.pathname = sourceCookie;
          response = NextResponse.redirect(url);
        }
      }else{
        console.log("Position 6");
        response = NextResponse.next();
      }

      // Set cookies
      response.cookies.set("authToken", access.access_token, {
        path: "/",
        sameSite: "strict",
        httpOnly: true,
        secure: process.env.ENVIRONMENT?.toUpperCase() === "PRODUCTION",
        maxAge: 60 * 60 * 24 * 30
      });
      response.cookies.set("refreshToken", access.refresh_token, {
        path: "/",
        sameSite: "strict",
        httpOnly: true,
        secure: process.env.ENVIRONMENT?.toUpperCase() === "PRODUCTION",
        maxAge: 60 * 60 * 24 * 30
      });
      
    }
  }
  
  // Else
  if(!response){

    console.log("Position 7")

    const url = new URL(request.url);
    url.search = '';
    url.pathname = '/internal/login';
    response = NextResponse.redirect(url);

  }


  ///////////////////////////////////////////////////////////
  ////////////////// Handle Authorize Path //////////////////
  ///////////////////////////////////////////////////////////
  // NOT NEEDED: The 'lax' 'source' cookie is set in '/authorize'
  // using the url parameter 'source' else it defaults to
  // '/projects'


  ///////////////////////////////////////////////////////////
  //////////////////// Handle Login Path ////////////////////
  ///////////////////////////////////////////////////////////
  // NOT NEEDED: The 'lax' 'source' cookie is set in '\login'
  // using the url parameter 'source' else it defaults to
  // '/projects' and '/authenticated/*' handles redirects to
  // '/internal/login' and from '/reflector'

  return response;
}
 
// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/authenticated/projects', '/authenticated/my-work'],
}