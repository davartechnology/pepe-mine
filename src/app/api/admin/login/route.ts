import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signAdminSession } from "@/lib/admin-auth";

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

    // On retourne le token directement — stocké en localStorage côté client
    return NextResponse.json({ success: true, role: admin.role, token });
  } catch (err: any) {
    console.error("Erreur admin login:", err.message);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}