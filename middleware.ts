import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Run middleware on the Node.js runtime (stable in Next 15.5). The Supabase
  // SSR client pulls in dependencies that use dynamic code evaluation, which
  // the Edge runtime forbids — Node.js avoids that "Code generation from
  // strings disallowed" error.
  runtime: "nodejs",
  matcher: [
    /*
     * Match all request paths except static assets and images so the auth
     * session is refreshed for every real page/route.
     */
    "/((?!_next/static|_next/image|favicon.ico|thumbnails/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
