import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const admins = await prisma.admin.findMany({ orderBy: { createdAt: "asc" } });
    return NextResponse.json({ admins });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin(req);
    const { telegramId, username } = await req.json();

    if (!telegramId) {
      return NextResponse.json({ error: "telegramId requis" }, { status: 400 });
    }

    const existing = await prisma.admin.findUnique({ where: { telegramId } });
    if (existing) {
      return NextResponse.json({ error: "Déjà administrateur" }, { status: 409 });
    }

    const newAdmin = await prisma.admin.create({
      data: {
        telegramId,
        username: username || null,
        role: "CO_ADMIN", // un co-admin ne peut jamais créer un autre SUPER_ADMIN
        addedById: session.adminId,
      },
    });

    return NextResponse.json({ success: true, admin: newAdmin });
  } catch (err: any) {
    console.error("Erreur ajout admin:", err.message);
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}