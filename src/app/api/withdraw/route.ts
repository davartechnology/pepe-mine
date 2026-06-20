import { NextRequest, NextResponse } from "next/server";
import { validateTelegramInitData } from "@/lib/telegram-auth";
import { prisma } from "@/lib/prisma";
import { sendFaucetPayPayout } from "@/lib/faucetpay";

export async function POST(req: NextRequest) {
  try {
    const { initData, faucetpayEmail } = await req.json();

    if (!initData || !faucetpayEmail) {
      return NextResponse.json(
        { error: "initData ou email FaucetPay manquant" },
        { status: 400 }
      );
    }

    const { user: tgUser } = validateTelegramInitData(initData);
    const telegramId = tgUser.id.toString();

    const settings = await prisma.settings.findUnique({ where: { id: "global" } });
    if (!settings) {
      return NextResponse.json({ error: "Configuration manquante" }, { status: 500 });
    }

    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }
    if (user.isBlocked) {
      return NextResponse.json({ error: "Compte bloqué" }, { status: 403 });
    }

    // Protection anti-double-soumission : si une demande est déjà en cours, on bloque
    const existingPending = await prisma.withdrawal.findFirst({
      where: { userId: user.id, status: "PENDING" },
    });
    if (existingPending) {
      return NextResponse.json(
        { error: "Un retrait est déjà en cours de traitement, patiente." },
        { status: 409 }
      );
    }

    if (user.balance < settings.minWithdrawal) {
      return NextResponse.json(
        { error: `Solde insuffisant. Minimum : ${settings.minWithdrawal} PEPE` },
        { status: 400 }
      );
    }

    const amountToWithdraw = user.balance;

    const withdrawal = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: user.id },
        data: {
          balance: { decrement: amountToWithdraw },
          totalWithdrawn: { increment: amountToWithdraw },
          faucetpayEmail,
        },
      });

      if (updated.balance < 0) {
        throw new Error("Erreur de solde, opération annulée");
      }

      return tx.withdrawal.create({
        data: {
          userId: user.id,
          amount: amountToWithdraw,
          faucetpayEmail,
          status: "PENDING",
        },
      });
    });

    try {
      const result = await sendFaucetPayPayout(faucetpayEmail, amountToWithdraw);
      console.log("Réponse FaucetPay:", JSON.stringify(result));

      if (result.status === 200) {
        await prisma.withdrawal.update({
          where: { id: withdrawal.id },
          data: {
            status: "COMPLETED",
            faucetpayTxId: result.payout_id,
            processedAt: new Date(),
          },
        });

        return NextResponse.json({
          success: true,
          message: "Retrait envoyé avec succès",
          amount: amountToWithdraw,
        });
      } else {
        await prisma.$transaction([
          prisma.user.update({
            where: { id: user.id },
            data: {
              balance: { increment: amountToWithdraw },
              totalWithdrawn: { decrement: amountToWithdraw },
            },
          }),
          prisma.withdrawal.update({
            where: { id: withdrawal.id },
            data: { status: "FAILED", errorMessage: result.message },
          }),
        ]);

        return NextResponse.json(
          { error: `Échec FaucetPay : ${result.message}` },
          { status: 400 }
        );
      }
    } catch (faucetErr: any) {
      console.error("Erreur appel FaucetPay:", faucetErr.message);

      // En cas d'erreur réseau/timeout, on NE SAIT PAS si le paiement est passé côté FaucetPay.
      // On laisse en PENDING pour vérification manuelle admin au lieu de rembourser automatiquement
      // (rembourser automatiquement ici pourrait permettre un double paiement si l'appel a en fait réussi).
      await prisma.withdrawal.update({
        where: { id: withdrawal.id },
        data: { errorMessage: `À vérifier manuellement: ${faucetErr.message}` },
      });

      return NextResponse.json(
        {
          error:
            "Ton retrait est en cours de vérification, contacte le support si tu ne reçois rien sous 24h.",
        },
        { status: 202 }
      );
    }
  } catch (err: any) {
    console.error("Erreur withdraw:", err.message);
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}