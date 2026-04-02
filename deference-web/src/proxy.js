import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * Next.js 16.2.0 Proxy Implementation (Clerk Auth Guard)
 * Replaces the deprecated middleware.js convention.
 */
export default clerkMiddleware();

export const config = {
  matcher: [
    // Ignore internal Next.js files and static assets
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API and TRPC routes
    '/(api|trpc)(.*)',
  ],
};
