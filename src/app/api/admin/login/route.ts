import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signAdminSession, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  try {
    const { telegramId, password } = await req.json();

    if (!telegramId || !password) {
      return NextResponse.json({ error: "Identifiants manquants" }, { status: 400 });
    }

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
    }

    const admin = await prisma.admin.findUnique({
      where: { telegramId: telegramId.toString() },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Ce Telegram ID n'est pas administrateur" },
        { status: 403 }
      );
    }

    const token = signAdminSession({
      adminId: admin.id,
      telegramId: admin.telegramId,
      role: admin.role,
    });

    const isProduction = process.env.NODE_ENV === "production";

    const res = NextResponse.json({ success: true, role: admin.role });
    res.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return res;
  } catch (err: any) {
    console.error("Erreur admin login:", err.message);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}