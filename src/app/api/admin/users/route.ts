import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = 30;

    const where = search
      ? {
          OR: [
            { telegramId: { contains: search } },
            { username: { contains: search, mode: "insensitive" as const } },
            { firstName: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({ users, total, page, pageSize });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

// Ajout manuel d'un utilisateur (cas rare, ex: pré-créer un compte)
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const { telegramId, username, firstName, balance } = await req.json();

    if (!telegramId) {
      return NextResponse.json({ error: "telegramId requis" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { telegramId } });
    if (existing) {
      return NextResponse.json({ error: "Cet utilisateur existe déjà" }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        telegramId,
        username: username || null,
        firstName: firstName || null,
        balance: balance ? Number(balance) : 0,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (err: any) {
    console.error("Erreur création user admin:", err.message);
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}