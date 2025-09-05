'use server';

// External Imports
import { NextRequest, NextResponse } from 'next/server';

// Internal Imports
import AuthWrapper from '@/lib/AuthWrapper';
import AuthTokensInterface from '@/interfaces/AuthTokensInterface';


// The base JIRA API URL
const BASE_JIRA_URL = `https://api.atlassian.com/ex/jira/${process.env.CLOUD_ID}/rest/agile/1.0`;


/**
 * This function proxies the Jira API.
 * 
 * @param method The HTTP method
 * 
 * @param request The HTTP request object
 * 
 * @param authTokens The auth tokens
 * 
 * @returns A HTTP response object
 */
async function proxyRequest(method: 'GET' | 'POST' | 'PUT' | 'DELETE', request: NextRequest, authTokens: AuthTokensInterface): Promise<NextResponse> {

  // Retrieve URL Params
  const searchParams = new URL(request.url).searchParams;
  const pathname = searchParams.get('pathname');
  const elevate = searchParams.get('elevate');

  // Validate the presence of the pathname param
  if (!pathname) {
    return new NextResponse(
      JSON.stringify({ msg: 'The pathname parameter is required.' }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }

  // Determine auth type
  let authString: string;

  if(elevate && authTokens.serviceAccountToken && authTokens.serviceAccountEmail){
    authString = "Basic " + Buffer.from(`${authTokens.serviceAccountEmail}:${authTokens.serviceAccountToken}`);
  }else{
    authString = `Bearer ${authTokens.authToken}`;
  }

  // Create the base url
  const formattedPathname = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const targetURL = new URL(BASE_JIRA_URL + formattedPathname);

  // Recreate search parameters
  searchParams.forEach((value, key) => {
    if (key !== 'pathname' && key !== 'elevate') {
      targetURL.searchParams.append(key, value);
    }
  });

  try {

    // Pass-on/create headers
    const headers: Record<string, string> = {
      'Authorization': authString,
      'Accept': 'application/json'
    };

    const contentType = request.headers.get('Content-Type');

    if (contentType) {
      if (contentType.includes('application/json') || contentType.includes('text/plain')) {
        headers['Content-Type'] = 'application/json';
      } else {
        headers['Content-Type'] = contentType;
      }
    } else {
      headers['Content-Type'] = 'application/json';
    }

    if (contentType?.includes("multipart/form-data")) {
      headers['X-Atlassian-Token'] = 'nocheck';
    }

    // Perform proxied request
    const jiraResponse = await fetch(targetURL.toString(), {
      method,
      headers,
      body: method === 'GET' || method === 'DELETE' ? undefined : request.body,
      // @ts-expect-error: duplex not yet in TS
      duplex: method === 'GET' || method === 'DELETE' ? undefined : 'half',
    });

    // Create headers to return - only appropriate headers
    const responseHeaders = new Headers();
    jiraResponse.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (lowerKey !== 'content-encoding' && lowerKey !== 'content-length' && lowerKey !== 'transfer-encoding') {
        responseHeaders.set(key, value);
      }
    });

    // Add a origin-location header to track the final sender
    responseHeaders.set("origin-location", jiraResponse.url);

    // Proxy the response
    return new NextResponse(jiraResponse.body, {
      status: jiraResponse.status,
      headers: responseHeaders,
    });

  } catch (err) {

    // Return error case
    return new NextResponse(
      JSON.stringify({ msg: 'Failed to proxy the API endpoint.' }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

export async function GET(request: NextRequest) {
  return AuthWrapper(request, (req, tokens) => proxyRequest('GET', req, tokens));
}

export async function POST(request: NextRequest) {
  return AuthWrapper(request, (req, tokens) => proxyRequest('POST', req, tokens));
}

export async function PUT(request: NextRequest) {
  return AuthWrapper(request, (req, tokens) => proxyRequest('PUT', req, tokens));
}

export async function DELETE(request: NextRequest) {
  return AuthWrapper(request, (req, tokens) => proxyRequest('DELETE', req, tokens));
}
