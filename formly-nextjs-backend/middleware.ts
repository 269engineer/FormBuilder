
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGIN = "https://formbuilder-plum.vercel.app";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin");

 
  if (origin !== ALLOWED_ORIGIN) {
    if (request.method === "OPTIONS") {
      return new NextResponse(null, { status: 403 });
    }

    const response = NextResponse.next();
    return response;
  }

  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  const response = NextResponse.next();

  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  matcher: "/api/:path*",
};

