import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isLoginPage = pathname.startsWith("/login");
  const isRegisterPage = pathname.startsWith("/register");
  const isSharedPage = pathname.startsWith("/shared");
  const isPortalPage = pathname.startsWith("/portal");
  const isPortalLoginPage = pathname.startsWith("/portal/login");
  const isPortalCallback = pathname.startsWith("/portal/auth/callback");
  const isAuthPage = isLoginPage || isRegisterPage;

  // Route portale: /portal/login e /portal/auth/callback sempre accessibili
  if (isPortalLoginPage || isPortalCallback) {
    return supabaseResponse;
  }

  // Altre route portale: senza sessione → redirect a /portal/login
  if (isPortalPage && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/portal/login";
    return NextResponse.redirect(url);
  }

  // Route dashboard: senza sessione → redirect a /login
  if (!user && !isAuthPage && !isSharedPage && !isPortalPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Solo /login viene bloccata per utenti già autenticati.
  // /register resta accessibile: serve per completare il profilo Professional.
  if (user && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
