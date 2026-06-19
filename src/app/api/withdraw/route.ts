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

    if (user.balance < settings.minWithdrawal) {
      return NextResponse.json(
        {
          error: `Solde insuffisant. Minimum : ${settings.minWithdrawal} PEPE`,
        },
        { status: 400 }
      );
    }

    const amountToWithdraw = user.balance; // retrait du solde total disponible

    // 1. Créer la demande de retrait en PENDING + débiter immédiatement
    //    (évite qu'un utilisateur claim/double-clique pendant le traitement)
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

    // 2. Appel réel à FaucetPay
    try {
      const result = await sendFaucetPayPayout(faucetpayEmail, amountToWithdraw);

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
        // Échec FaucetPay : on rembourse l'utilisateur
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
            data: {
              status: "FAILED",
              errorMessage: result.message,
            },
          }),
        ]);

        return NextResponse.json(
          { error: `Échec FaucetPay : ${result.message}` },
          { status: 400 }
        );
      }
    } catch (faucetErr: any) {
      // Erreur réseau/API : on rembourse aussi, et on marque PENDING pour vérif manuelle admin
      await prisma.withdrawal.update({
        where: { id: withdrawal.id },
        data: {
          status: "FAILED",
          errorMessage: faucetErr.message,
        },
      });
      await prisma.user.update({
        where: { id: user.id },
        data: {
          balance: { increment: amountToWithdraw },
          totalWithdrawn: { decrement: amountToWithdraw },
        },
      });

      return NextResponse.json(
        { error: "Erreur lors du paiement, ton solde a été restauré. Réessaie." },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error("Erreur withdraw:", err.message);
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}