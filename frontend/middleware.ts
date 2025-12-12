import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Role-based route permissions
const roleRoutes: Record<string, string[]> = {
  admin: [
    "/dashboard",
    "/dashboard/sales",
    "/dashboard/pos",
    "/dashboard/inventory/products",
    "/dashboard/inventory",
    "/dashboard/office/outlets",
    "/dashboard/reports",
    "/dashboard/customers",
    "/dashboard/staff",
    "/dashboard/settings",
    "/dashboard/settings/notifications",
    "/dashboard/activity-log",
  ],
  cashier: [
    "/dashboard",
    "/dashboard/sales",
    "/dashboard/pos",
    "/dashboard/customers",
    "/dashboard/reports",
    "/dashboard/settings/notifications",
  ],
  staff: [
    "/dashboard",
    "/dashboard/sales",
    "/dashboard/pos",
    "/dashboard/inventory/products",
    "/dashboard/inventory",
    "/dashboard/settings/notifications",
  ],
  manager: [
    "/dashboard",
    "/dashboard/sales",
    "/dashboard/pos",
    "/dashboard/inventory/products",
    "/dashboard/inventory",
    "/dashboard/office/outlets",
    "/dashboard/reports",
    "/dashboard/customers",
    "/dashboard/settings/notifications",
    "/dashboard/activity-log",
  ],
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Decode URL-encoded pathname to handle spaces properly
  const decodedPathname = decodeURIComponent(pathname)

  // Redirect /dashboard/wholesale and retail (or URL-encoded versions) to /dashboard/retail
  // This handles legacy URLs or URLs with spaces
  if (pathname === "/dashboard/wholesale and retail" || 
      pathname === "/dashboard/wholesale and retail/" ||
      pathname.includes("wholesale%20and%20retail") || 
      pathname.includes("wholesale+and+retail")) {
    const url = request.nextUrl.clone()
    // Replace with /dashboard/retail
    url.pathname = pathname.replace(/\/dashboard\/wholesale(?:%20|\+)?and(?:%20|\+)?retail/g, "/dashboard/retail")
    return NextResponse.redirect(url)
  }

  // Skip middleware for public routes
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api") ||
    pathname === "/" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static")
  ) {
    return NextResponse.next()
  }

  // For dashboard routes, check role-based access
  if (pathname.startsWith("/dashboard")) {
    // In production, get role from session/cookie
    // For now, we'll allow access and handle it client-side
    // You can add server-side role checking here
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}

