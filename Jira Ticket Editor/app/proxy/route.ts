'use server'

// Internal imports
import AuthWrapper from '@/lib/AuthWrapper';
import AuthTokensInterface from '@/interfaces/AuthTokensInterface';


// External imports
import { NextRequest, NextResponse } from 'next/server';


/**
 * This method proxies GET requests to the Jira REST API
 * 
 * @param request A authenticated GET request
 * 
 * @returns In a valid scenario the Jira API's response is forwarded on.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {

  async function requestHandler(request: NextRequest, authTokens: AuthTokensInterface, requestingAccountID: string | undefined, authorizedAccountID: string | undefined): Promise<NextResponse> {
    
    // Cookies
    let response: NextResponse;

    // Validate the proxied pathname
    const searchParams = (new URL(request.url)).searchParams;
    const pathname = searchParams.get('pathname');
    const elevate = searchParams.get('elevate');
    
    // Validate the presence of a pathname
    if(!pathname){

      response = new NextResponse(
        JSON.stringify({
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

      let access_token = elevate && authTokens.elevatedToken ? authTokens.elevatedToken : authTokens.authToken;

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
            'Authorization': `Bearer ${access_token}`,
            'Accept': 'application/json'
          },
        });

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

      } catch (err) {

        response = new NextResponse(
          JSON.stringify({
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
  
  return (await AuthWrapper(request, requestHandler));
}





/**
 * This method proxies POST requests to the Jira REST API
 * 
 * @param request A authenticated POST request
 * 
 * @returns In a valid scenario the Jira API's response is forwarded on.
 */
export async function POST(request: NextRequest): Promise<NextResponse>{

  async function requestHandler(request: NextRequest, authTokens: AuthTokensInterface, requestingAccountID: string | undefined, authorizedAccountID: string | undefined): Promise<NextResponse> {
    
    // Cookies
    let response: NextResponse;

    // Validate the proxied pathname
    const searchParams = (new URL(request.url)).searchParams;
    const pathname = searchParams.get('pathname');
    const elevate = searchParams.get('elevate');
    
    // Validate the presence of a pathname
    if(!pathname){

      response = new NextResponse(
        JSON.stringify({
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

      let access_token = elevate && authTokens.elevatedToken ? authTokens.elevatedToken : authTokens.authToken;

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
            'Authorization': `Bearer ${access_token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: await request.text()
        });

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

      } catch (err) {

        response = new NextResponse(
          JSON.stringify({
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
  
  return (await AuthWrapper(request, requestHandler));
}





/**
 * This method proxies PUT requests to the Jira REST API
 * 
 * @param request A authenticated PUT request
 * 
 * @returns In a valid scenario the Jira API's response is forwarded on.
 */
export async function PUT(request: NextRequest): Promise<NextResponse>{

  async function requestHandler(request: NextRequest, authTokens: AuthTokensInterface, requestingAccountID: string | undefined, authorizedAccountID: string | undefined): Promise<NextResponse> {
    
    // Cookies
    let response: NextResponse;

    // Validate the proxied pathname
    const searchParams = (new URL(request.url)).searchParams;
    const pathname = searchParams.get('pathname');
    const elevate = searchParams.get('elevate');
    
    // Validate the presence of a pathname
    if(!pathname){

      response = new NextResponse(
        JSON.stringify({
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

      let access_token = elevate && authTokens.elevatedToken ? authTokens.elevatedToken : authTokens.authToken;

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
            'Authorization': `Bearer ${access_token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: await request.text()
        });

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

      } catch (err) {

        response = new NextResponse(
          JSON.stringify({
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
  
  return (await AuthWrapper(request, requestHandler));
}





/**
 * This method proxies DELETE requests to the Jira REST API
 * 
 * @param request A authenticated DELETE request
 * 
 * @returns In a valid scenario the Jira API's response is forwarded on.
 */
export async function DELETE(request: NextRequest): Promise<NextResponse>{

  async function requestHandler(request: NextRequest, authTokens: AuthTokensInterface, requestingAccountID: string | undefined, authorizedAccountID: string | undefined): Promise<NextResponse> {
    
    // Cookies
    let response: NextResponse;

    // Validate the proxied pathname
    const searchParams = (new URL(request.url)).searchParams;
    const pathname = searchParams.get('pathname');
    const elevate = searchParams.get('elevate');
    
    // Validate the presence of a pathname
    if(!pathname){

      response = new NextResponse(
        JSON.stringify({
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

      let access_token = elevate && authTokens.elevatedToken ? authTokens.elevatedToken : authTokens.authToken;

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
            'Authorization': `Bearer ${access_token}`,
            'Accept': 'application/json'
          }
        });

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

      } catch (err) {

        response = new NextResponse(
          JSON.stringify({
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
  
  return (await AuthWrapper(request, requestHandler));
}