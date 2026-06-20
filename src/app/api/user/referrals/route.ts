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

    const settings = await prisma.settings.findUnique({ where: { id: "global" } });

    // Niveau 1 : filleuls directs
    const level1 = await prisma.user.findMany({
      where: { referredById: user.id },
      select: { id: true, username: true, firstName: true, createdAt: true },
    });

    const level1Ids = level1.map((u) => u.id);

    const level2 = level1Ids.length
      ? await prisma.user.findMany({
          where: { referredById: { in: level1Ids } },
          select: { id: true },
        })
      : [];

    const level2Ids = level2.map((u) => u.id);

    const level3 = level2Ids.length
      ? await prisma.user.findMany({
          where: { referredById: { in: level2Ids } },
          select: { id: true },
        })
      : [];

    // Total des commissions gagnées, groupées par niveau
    const commissionSums = await prisma.referralCommission.groupBy({
      by: ["level"],
      where: { receiverId: user.id },
      _sum: { amount: true },
    });

    const totalsByLevel: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
    commissionSums.forEach((c) => {
      totalsByLevel[c.level] = c._sum.amount || 0;
    });

    return NextResponse.json({
      telegramId: user.telegramId,
      counts: {
        level1: level1.length,
        level2: level2.length,
        level3: level3.length,
      },
      earnings: {
        level1: totalsByLevel[1],
        level2: totalsByLevel[2],
        level3: totalsByLevel[3],
        total: totalsByLevel[1] + totalsByLevel[2] + totalsByLevel[3],
      },
      percents: {
        level1: settings?.refLevel1Percent ?? 20,
        level2: settings?.refLevel2Percent ?? 10,
        level3: settings?.refLevel3Percent ?? 5,
      },
      directReferrals: level1,
    });
  } catch (err: any) {
    console.error("Erreur referral:", err.message);
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}