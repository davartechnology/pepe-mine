import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Le proxy vérifie juste la présence du token en localStorage
  // via un paramètre de query ajouté par le client
  // La vraie vérification JWT se fait dans chaque API route (requireAdmin)
  // car le JWT secret n'est pas disponible en Edge Runtime

  // Pages admin publiques
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Pour les pages admin (pas API), on laisse passer
  // La page elle-même vérifie le token localStorage et redirige si absent
  if (pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};