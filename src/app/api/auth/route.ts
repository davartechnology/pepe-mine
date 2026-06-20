import { NextRequest, NextResponse } from "next/server";
import { validateTelegramInitData } from "@/lib/telegram-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { initData, referralCode } = await req.json();

    if (!initData) {
      return NextResponse.json({ error: "initData manquant" }, { status: 400 });
    }

    const { user: tgUser } = validateTelegramInitData(initData);
    const telegramId = tgUser.id.toString();

    const settings = await prisma.settings.findUnique({ where: { id: "global" } });
    const cooldownMinutes = settings?.claimCooldownMinutes ?? 60;

    let user = await prisma.user.findUnique({ where: { telegramId } });

    if (!user) {
      let referredById: string | null = null;

      if (referralCode) {
        const referrer = await prisma.user.findUnique({
          where: { telegramId: referralCode },
        });
        if (referrer && !referrer.isBlocked && !referrer.isDeleted) {
          referredById = referrer.id;
        }
      }

      user = await prisma.user.create({
        data: {
          telegramId,
          username: tgUser.username,
          firstName: tgUser.first_name,
          lastName: tgUser.last_name,
          referredById,
        },
      });
    } else {
      if (user.isBlocked) {
        return NextResponse.json({ error: "Compte bloqué" }, { status: 403 });
      }
      if (user.isDeleted) {
        return NextResponse.json({ error: "Compte supprimé" }, { status: 403 });
      }

      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          username: tgUser.username,
          firstName: tgUser.first_name,
          lastName: tgUser.last_name,
        },
      });
    }

    // Calcul autoritaire du cooldown restant (en millisecondes), basé sur le serveur
    let remainingCooldownMs = 0;
    if (user.lastClaimAt) {
      const cooldownEnd = user.lastClaimAt.getTime() + cooldownMinutes * 60 * 1000;
      remainingCooldownMs = Math.max(0, cooldownEnd - Date.now());
    }

    return NextResponse.json({ user, remainingCooldownMs, claimAmount: settings?.claimAmount ?? 300 });
  } catch (err: any) {
    console.error("Erreur auth:", err.message);
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}