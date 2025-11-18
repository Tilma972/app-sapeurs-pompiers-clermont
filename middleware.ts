import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // Redirect /dashboard/admin/* to /admin/*
  if (request.nextUrl.pathname.startsWith('/dashboard/admin')) {
    const newPath = request.nextUrl.pathname.replace('/dashboard/admin', '/admin');
    return NextResponse.redirect(new URL(newPath, request.url));
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * - /don/* (public donation pages) ← AJOUTÉ
     * - /api/* (API routes) ← AJOUTÉ
     */
    "/((?!_next/static|_next/image|favicon.ico|don|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
