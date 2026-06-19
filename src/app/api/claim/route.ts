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
    const telegramId = tgUser.id.toString();

    // Récupère les settings dynamiques (montant, cooldown, %)
    const settings = await prisma.settings.findUnique({
      where: { id: "global" },
    });

    if (!settings) {
      return NextResponse.json(
        { error: "Configuration serveur manquante" },
        { status: 500 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { telegramId },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    if (user.isBlocked) {
      return NextResponse.json({ error: "Compte bloqué" }, { status: 403 });
    }

    // Vérification du cooldown
    if (user.lastClaimAt) {
      const cooldownMs = settings.claimCooldownMinutes * 60 * 1000;
      const elapsedMs = Date.now() - user.lastClaimAt.getTime();

      if (elapsedMs < cooldownMs) {
        const remainingMs = cooldownMs - elapsedMs;
        const remainingMinutes = Math.ceil(remainingMs / 60000);
        return NextResponse.json(
          {
            error: "Cooldown actif",
            remainingMinutes,
            remainingMs,
          },
          { status: 429 }
        );
      }
    }

    const claimAmount = settings.claimAmount;

    // Transaction complète : claim + crédit user + commissions parrainage 3 niveaux
    const result = await prisma.$transaction(async (tx) => {
      // 1. Créer l'enregistrement du claim
      await tx.claim.create({
        data: {
          userId: user.id,
          amount: claimAmount,
        },
      });

      // 2. Créditer l'utilisateur + mettre à jour lastClaimAt
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          balance: { increment: claimAmount },
          totalMined: { increment: claimAmount },
          lastClaimAt: new Date(),
        },
      });

      // 3. Remonter la chaîne de parrainage sur 3 niveaux
      const levelPercents = [
        settings.refLevel1Percent,
        settings.refLevel2Percent,
        settings.refLevel3Percent,
      ];

      let currentUserId = user.referredById;
      let level = 1;

      while (currentUserId && level <= 3) {
        const referrer = await tx.user.findUnique({
          where: { id: currentUserId },
        });

        if (!referrer || referrer.isBlocked || referrer.isDeleted) {
          break; // on arrête de remonter la chaîne si un parrain est invalide
        }

        const commissionPercent = levelPercents[level - 1];
        const commissionAmount = (claimAmount * commissionPercent) / 100;

        if (commissionAmount > 0) {
          await tx.referralCommission.create({
            data: {
              receiverId: referrer.id,
              sourceUserId: user.id,
              level,
              amount: commissionAmount,
            },
          });

          await tx.user.update({
            where: { id: referrer.id },
            data: {
              balance: { increment: commissionAmount },
              totalMined: { increment: commissionAmount },
            },
          });
        }

        currentUserId = referrer.referredById;
        level++;
      }

      return updatedUser;
    });

    return NextResponse.json({
      success: true,
      newBalance: result.balance,
      claimedAmount: claimAmount,
      nextClaimAt: new Date(
        Date.now() + settings.claimCooldownMinutes * 60 * 1000
      ),
    });
  } catch (err: any) {
    console.error("Erreur claim:", err.message);
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}