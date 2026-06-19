import { NextRequest, NextResponse } from "next/server";
import { validateTelegramInitData } from "@/lib/telegram-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { initData } = await req.json();
    if (!initData) {
      return NextResponse.json({ error: "initData manquant" }, { status: 400 });
    }

    const { user: tgUser } = validateTelegramInitData(initData);
    const user = await prisma.user.findUnique({
      where: { telegramId: tgUser.id.toString() },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const [claims, withdrawals, commissions] = await Promise.all([
      prisma.claim.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.withdrawal.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.referralCommission.findMany({
        where: { receiverId: user.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    return NextResponse.json({ claims, withdrawals, commissions });
  } catch (err: any) {
    console.error("Erreur history:", err.message);
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}