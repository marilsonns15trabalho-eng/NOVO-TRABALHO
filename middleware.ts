import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // 🔓 ROTAS PÚBLICAS
  const publicRoutes = ["/", "/login", "/register", "/auth"];

  const isPublic = publicRoutes.some((route) =>
    path.startsWith(route)
  );

  // 🔒 NÃO LOGADO → LOGIN
  if (!user && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 🔥 USUÁRIO LOGADO
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;

    // 🚀 REDIRECIONAMENTO AUTOMÁTICO (se entrar na raiz)
    if (path === "/") {
      if (role === "admin") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      if (role === "personal") {
        return NextResponse.redirect(new URL("/personal", request.url));
      }
      return NextResponse.redirect(new URL("/aluna/dashboard", request.url));
    }

    // 🔐 PROTEÇÃO POR ROLE

    // ADMIN
    if (path.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // PERSONAL
    if (path.startsWith("/personal") && role !== "personal") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // ALUNA
    if (path.startsWith("/aluna") && role !== "student") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};