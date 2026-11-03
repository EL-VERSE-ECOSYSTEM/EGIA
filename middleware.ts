import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";
import { handleReadOnlyGuard } from "@/lib/read-only-guard";

export async function middleware(request: NextRequest) {
  // Check read-only / maintenance mode guard first for mutation requests
  const readOnlyResponse = await handleReadOnlyGuard(request);
  if (readOnlyResponse) {
    return readOnlyResponse;
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
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
