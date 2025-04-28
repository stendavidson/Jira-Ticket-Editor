'use server'

// Internal imports
import Access from '../../interfaces/AccessInterface';
import { refreshAccessToken, validate } from '../../lib/authenticate';
import { db } from '../../lib/cache';

// External imports
import { NextRequest, NextResponse } from 'next/server';



/**
 * This method proxies GET requests to the Jira REST API
 * 
 * @param request A authenticated GET request
 * 
 * @returns In a valid scenario the Jira API's response is forwarded on.
 */
export async function GET(request: NextRequest): Promise<NextResponse>{

  // Cookies
  const authToken: string | undefined = request.cookies.get('authToken')?.value;
  const refreshToken: string | undefined = request.cookies.get('refreshToken')?.value;
  let response: NextResponse;

  // Validate the proxied pathname
  const searchParams = (new URL(request.url)).searchParams;
  const pathname = searchParams.get('pathname');
  const elevate = searchParams.get('elevate');

  // Elevated tokens
  let elevatedToken: string | undefined;
  let elevatedRefreshToken: string | undefined;
  if(elevate === "true"){
    elevatedToken = await db.get("elevatedToken");
    elevatedRefreshToken = await db.get("elevatedRefreshToken");
  }

  // Validate presence of authentication token
  if(!authToken && !refreshToken){

    response = new NextResponse(null, 
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

  // Validate the presence of a pathname
  }else if(!pathname){

    response = new NextResponse(
      JSON.stringify({
        error: 'Malformed Request',
        msg: 'The pathname parameter is required.'
      }), 
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

  // Proxy request with fail over authentication - refresh token
  }else{

    let access_token = elevatedToken ? elevatedToken: authToken;
    let refresh_token = elevatedRefreshToken ? elevatedRefreshToken: refreshToken;

    // Build target URL
    const formattedPathname = pathname.startsWith('/') ? pathname: `/${pathname}`;
    const targetURL: URL = new URL('https://api.atlassian.com/ex/jira/68e39a30-a1b8-4b14-8d88-6363789cef33/rest/api/3' + formattedPathname);

    // Add search parameters
    searchParams.forEach((value, key) => {
      if (key !== 'pathname') {
        targetURL.searchParams.append(key, value);
      }
    });
    
    // Proxy request & response
    try {
      
      // Attempt proxy request
      let jiraResponse = await fetch(targetURL.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json'
        },
      });

      // Retry after refresh token has been used
      if(jiraResponse.status === 401 && refreshToken){

        const access: Access | null = await refreshAccessToken(refreshToken);
        
        if(access && (await validate(access.access_token))){

          jiraResponse = await fetch(targetURL.toString(), {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${access.access_token}`,
              'Accept': 'application/json'
            },
          });

          access_token = access.access_token;
          refresh_token = access.refresh_token;
        }
        
      }

      // You can stream, text, or json the response depending on what it returns
      const contentType = jiraResponse.headers.get('content-type') || 'text/plain';
      const responseBody = await jiraResponse.text();
      
      // Create Response
      response = new NextResponse(
        responseBody,
        {
          status: jiraResponse.status,
          headers: {
            'Content-Type': contentType,
          }
        }
      );

      // Set cookies as needed
      if(access_token){
        response.cookies.set("authToken", access_token , {
          path: "/",
          sameSite: "strict",
          httpOnly: true,
          secure: process.env.ENVIRONMENT?.toUpperCase() === "PRODUCTION",
          maxAge: 60 * 60 * 24 * 30
        });
      }
      if(refresh_token){
        response.cookies.set("refreshToken", refresh_token, {
          path: "/",
          sameSite: "strict",
          httpOnly: true,
          secure: process.env.ENVIRONMENT?.toUpperCase() === "PRODUCTION",
          maxAge: 60 * 60 * 24 * 30
        });
      }      

    } catch (err) {

      // Remove in production
      console.error(err);

      return new NextResponse(
        JSON.stringify({
          error: 'Bad Gateway',
          msg: 'Failed to proxy the api endpoint.'
        }), 
        {
          status: 502,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

    }

  }

  return response;
}





/**
 * This method proxies POST requests to the Jira REST API
 * 
 * @param request A authenticated POST request
 * 
 * @returns In a valid scenario the Jira API's response is forwarded on.
 */
export async function POST(request: NextRequest): Promise<NextResponse>{

  // Cookies
  const authToken: string | undefined = request.cookies.get('authToken')?.value;
  const refreshToken: string | undefined = request.cookies.get('refreshToken')?.value;
  let response: NextResponse;

  // Validate the proxied pathname
  const searchParams = (new URL(request.url)).searchParams;
  const pathname = searchParams.get('pathname');
  const elevate = searchParams.get('elevate');

  // Elevated tokens
  let elevatedToken: string | undefined;
  let elevatedRefreshToken: string | undefined;
  if(elevate === "true"){
    elevatedToken = await db.get("elevatedToken");
    elevatedRefreshToken = await db.get("elevatedRefreshToken");
  }

  // Validate presence of authentication token
  if(!authToken && !refreshToken){

    response = new NextResponse(null, 
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

  // Validate the presence of a pathname
  }else if(!pathname){

    response = new NextResponse(
      JSON.stringify({
        error: 'Malformed Request',
        msg: 'The pathname parameter is required.'
      }), 
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

  // Proxy request with fail over authentication - refresh token
  }else{

    let access_token = elevatedToken ? elevatedToken: authToken;
    let refresh_token = elevatedRefreshToken ? elevatedRefreshToken: refreshToken;

    // Build target URL
    const formattedPathname = pathname.startsWith('/') ? pathname: `/${pathname}`;
    const targetURL: URL = new URL('https://api.atlassian.com/ex/jira/68e39a30-a1b8-4b14-8d88-6363789cef33/rest/api/3' + formattedPathname);

    // Add search parameters
    searchParams.forEach((value, key) => {
      if (key !== 'pathname') {
        targetURL.searchParams.append(key, value);
      }
    });
    
    // Proxy request & response
    try {
      
      // Attempt proxy request
      let jiraResponse = await fetch(targetURL.toString(), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json'
        },
        body: await request.json()
      });

      // Retry after refresh token has been used
      if(jiraResponse.status === 401 && refreshToken){

        const access: Access | null = await refreshAccessToken(refreshToken);
        
        if(access && (await validate(access.access_token))){

          jiraResponse = await fetch(targetURL.toString(), {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${access.access_token}`,
              'Accept': 'application/json'
            },
            body: await request.json()
          });

          access_token = access.access_token;
          refresh_token = access.refresh_token;
        }
        
      }

      // You can stream, text, or json the response depending on what it returns
      const contentType = jiraResponse.headers.get('content-type') || 'text/plain';
      const responseBody = contentType.includes('application/json') ? JSON.stringify(await jiraResponse.json()): await jiraResponse.text();

      // Create Response
      response = new NextResponse(
        responseBody,
        {
          status: jiraResponse.status,
          headers: {
            'Content-Type': contentType,
          }
        }
      );

      // Set cookies as needed
      if(access_token){
        response.cookies.set("authToken", access_token , {
          path: "/",
          sameSite: "strict",
          httpOnly: true,
          secure: process.env.ENVIRONMENT?.toUpperCase() === "PRODUCTION",
          maxAge: 60 * 60 * 24 * 30
        });
      }
      if(refresh_token){
        response.cookies.set("refreshToken", refresh_token, {
          path: "/",
          sameSite: "strict",
          httpOnly: true,
          secure: process.env.ENVIRONMENT?.toUpperCase() === "PRODUCTION",
          maxAge: 60 * 60 * 24 * 30
        });
      }        

    } catch (err) {

      // Remove in production
      console.error(err);

      return new NextResponse(
        JSON.stringify({
          error: 'Bad Gateway',
          msg: 'Failed to proxy the api endpoint.'
        }), 
        {
          status: 502,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

    }

  }

  return response;
}





/**
 * This method proxies PUT requests to the Jira REST API
 * 
 * @param request A authenticated PUT request
 * 
 * @returns In a valid scenario the Jira API's response is forwarded on.
 */
export async function PUT(request: NextRequest): Promise<NextResponse>{

  // Cookies
  const authToken: string | undefined = request.cookies.get('authToken')?.value;
  const refreshToken: string | undefined = request.cookies.get('refreshToken')?.value;
  let response: NextResponse;

  // Validate the proxied pathname
  const searchParams = (new URL(request.url)).searchParams;
  const pathname = searchParams.get('pathname');
  const elevate = searchParams.get('elevate');

  // Elevated tokens
  let elevatedToken: string | undefined;
  let elevatedRefreshToken: string | undefined;
  if(elevate === "true"){
    elevatedToken = await db.get("elevatedToken");
    elevatedRefreshToken = await db.get("elevatedRefreshToken");
  }

  // Validate presence of authentication token
  if(!authToken && !refreshToken){

    response = new NextResponse(null, 
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

  // Validate the presence of a pathname
  }else if(!pathname){

    response = new NextResponse(
      JSON.stringify({
        error: 'Malformed Request',
        msg: 'The pathname parameter is required.'
      }), 
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

  // Proxy request with fail over authentication - refresh token
  }else{

    let access_token = elevatedToken ? elevatedToken: authToken;
    let refresh_token = elevatedRefreshToken ? elevatedRefreshToken: refreshToken;

    // Build target URL
    const formattedPathname = pathname.startsWith('/') ? pathname: `/${pathname}`;
    const targetURL: URL = new URL('https://api.atlassian.com/ex/jira/68e39a30-a1b8-4b14-8d88-6363789cef33/rest/api/3' + formattedPathname);

    // Add search parameters
    searchParams.forEach((value, key) => {
      if (key !== 'pathname') {
        targetURL.searchParams.append(key, value);
      }
    });
    
    // Proxy request & response
    try {
      
      // Attempt proxy request
      let jiraResponse = await fetch(targetURL.toString(), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json'
        },
        body: await request.json()
      });

      // Retry after refresh token has been used
      if(jiraResponse.status === 401 && refreshToken){

        const access: Access | null = await refreshAccessToken(refreshToken);
        
        if(access && (await validate(access.access_token))){

          jiraResponse = await fetch(targetURL.toString(), {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${access.access_token}`,
              'Accept': 'application/json'
            },
            body: await request.json()
          });

          access_token = access.access_token;
          refresh_token = access.refresh_token;
        }
        
      }

      // You can stream, text, or json the response depending on what it returns
      const contentType = jiraResponse.headers.get('content-type') || 'text/plain';
      const responseBody = contentType.includes('application/json') ? JSON.stringify(await jiraResponse.json()): await jiraResponse.text();

      // Create Response
      response = new NextResponse(
        responseBody,
        {
          status: jiraResponse.status,
          headers: {
            'Content-Type': contentType,
          }
        }
      );

      // Set cookies as needed
      if(access_token){
        response.cookies.set("authToken", access_token , {
          path: "/",
          sameSite: "strict",
          httpOnly: true,
          secure: process.env.ENVIRONMENT?.toUpperCase() === "PRODUCTION",
          maxAge: 60 * 60 * 24 * 30
        });
      }
      if(refresh_token){
        response.cookies.set("refreshToken", refresh_token, {
          path: "/",
          sameSite: "strict",
          httpOnly: true,
          secure: process.env.ENVIRONMENT?.toUpperCase() === "PRODUCTION",
          maxAge: 60 * 60 * 24 * 30
        });
      }        

    } catch (err) {

      // Remove in production
      console.error(err);

      return new NextResponse(
        JSON.stringify({
          error: 'Bad Gateway',
          msg: 'Failed to proxy the api endpoint.'
        }), 
        {
          status: 502,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

    }

  }

  return response;
}





/**
 * This method proxies DELETE requests to the Jira REST API
 * 
 * @param request A authenticated DELETE request
 * 
 * @returns In a valid scenario the Jira API's response is forwarded on.
 */
export async function DELETE(request: NextRequest): Promise<NextResponse>{

  // Cookies
  const authToken: string | undefined = request.cookies.get('authToken')?.value;
  const refreshToken: string | undefined = request.cookies.get('refreshToken')?.value;
  let response: NextResponse;

  // Validate the proxied pathname
  const searchParams = (new URL(request.url)).searchParams;
  const pathname = searchParams.get('pathname');
  const elevate = searchParams.get('elevate');

  // Elevated tokens
  let elevatedToken: string | undefined;
  let elevatedRefreshToken: string | undefined;
  if(elevate === "true"){
    elevatedToken = await db.get("elevatedToken");
    elevatedRefreshToken = await db.get("elevatedRefreshToken");
  }

  // Validate presence of authentication token
  if(!authToken && !refreshToken){

    response = new NextResponse(null, 
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

  // Validate the presence of a pathname
  }else if(!pathname){

    response = new NextResponse(
      JSON.stringify({
        error: 'Malformed Request',
        msg: 'The pathname parameter is required.'
      }), 
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

  // Proxy request with fail over authentication - refresh token
  }else{

    let access_token = elevatedToken ? elevatedToken: authToken;
    let refresh_token = elevatedRefreshToken ? elevatedRefreshToken: refreshToken;

    // Build target URL
    const formattedPathname = pathname.startsWith('/') ? pathname: `/${pathname}`;
    const targetURL: URL = new URL('https://api.atlassian.com/ex/jira/68e39a30-a1b8-4b14-8d88-6363789cef33/rest/api/3' + formattedPathname);

    // Add search parameters
    searchParams.forEach((value, key) => {
      if (key !== 'pathname') {
        targetURL.searchParams.append(key, value);
      }
    });
    
    // Proxy request & response
    try {
      
      // Attempt proxy request
      let jiraResponse = await fetch(targetURL.toString(), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json'
        },
      });

      // Retry after refresh token has been used
      if(jiraResponse.status === 401 && refreshToken){

        const access: Access | null = await refreshAccessToken(refreshToken);
        
        if(access && (await validate(access.access_token))){

          jiraResponse = await fetch(targetURL.toString(), {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Accept': 'application/json'
            },
          });

          access_token = access.access_token;
          refresh_token = access.refresh_token;
        }
        
      }

      // You can stream, text, or json the response depending on what it returns
      const contentType = jiraResponse.headers.get('content-type') || 'text/plain';
      const responseBody = contentType.includes('application/json') ? JSON.stringify(await jiraResponse.json()): await jiraResponse.text();

      // Create Response
      response = new NextResponse(
        responseBody,
        {
          status: jiraResponse.status,
          headers: {
            'Content-Type': contentType,
          }
        }
      );

      // Set cookies as needed
      if(access_token){
        response.cookies.set("authToken", access_token , {
          path: "/",
          sameSite: "strict",
          httpOnly: true,
          secure: process.env.ENVIRONMENT?.toUpperCase() === "PRODUCTION",
          maxAge: 60 * 60 * 24 * 30
        });
      }
      if(refresh_token){
        response.cookies.set("refreshToken", refresh_token, {
          path: "/",
          sameSite: "strict",
          httpOnly: true,
          secure: process.env.ENVIRONMENT?.toUpperCase() === "PRODUCTION",
          maxAge: 60 * 60 * 24 * 30
        });
      }          

    } catch (err) {

      // Remove in production
      console.error(err);

      return new NextResponse(
        JSON.stringify({
          error: 'Bad Gateway',
          msg: 'Failed to proxy the api endpoint.'
        }), 
        {
          status: 502,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

    }

  }

  return response;
}