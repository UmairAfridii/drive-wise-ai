export const AUTH_ROUTES = ['/login', '/signup'] as const

export type AuthRoute = (typeof AUTH_ROUTES)[number]

export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}
