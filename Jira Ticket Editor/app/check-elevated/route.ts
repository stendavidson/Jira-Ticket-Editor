'use server'

// External imports
import { NextRequest, NextResponse } from "next/server";

// Internal imports
import { db } from '../../lib/cache';


/**
 * Endpoint validates elevated auth status
 * 
 * @param request The input HTTP request
 * 
 * @returns A redirect to login
 */
export async function GET(request: NextRequest) {

  // Delete higher level authorization
  const elevatedToken: string | undefined = await db.get("elevatedToken");
  const elevatedRefreshToken: string | undefined = await db.get("elevatedRefreshToken");

  // Return confirming response
  return new NextResponse(
    null,
    {
      status: elevatedToken && elevatedRefreshToken ? 204: 401
    }
  );
}
