import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabasePublishableKey, getSupabaseUrl, normalizeSupabaseCookieOptions } from "./config";

const supabaseUrl = getSupabaseUrl();
const supabaseKey = getSupabasePublishableKey();

function applyRuntimeHeaders(response: NextResponse, request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isPrivateRoute =
    pathname.startsWith("/api/") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/setup-role") ||
    pathname.startsWith("/payment/return") ||
    pathname.startsWith("/todos");

  if (isPrivateRoute) {
    response.headers.set("Cache-Control", "private, no-store, max-age=0, must-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    response.headers.append("Vary", "Cookie");
  }

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}

export const createClient = (request: NextRequest) => {
  let supabaseResponse = applyRuntimeHeaders(NextResponse.next({
    request: {
      headers: request.headers,
    },
  }), request);

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = applyRuntimeHeaders(NextResponse.next({
            request,
          }), request)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, normalizeSupabaseCookieOptions(options))
          )
        },
      },
    },
  );

  return { supabase, response: supabaseResponse };
};

export async function updateSession(request: NextRequest) {
  const { supabase, response } = createClient(request);
  await supabase.auth.getUser();
  return applyRuntimeHeaders(response, request);
}
