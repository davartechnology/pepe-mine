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

    // Cherche si l'utilisateur existe déjà
    let user = await prisma.user.findUnique({
      where: { telegramId },
    });

    if (!user) {
      // Nouvel utilisateur : on gère le parrainage si un referralCode est fourni
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
      // Utilisateur existant : on bloque l'accès si banni/supprimé
      if (user.isBlocked) {
        return NextResponse.json({ error: "Compte bloqué" }, { status: 403 });
      }
      if (user.isDeleted) {
        return NextResponse.json({ error: "Compte supprimé" }, { status: 403 });
      }

      // Mise à jour des infos de profil au cas où elles ont changé
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          username: tgUser.username,
          firstName: tgUser.first_name,
          lastName: tgUser.last_name,
        },
      });
    }

    return NextResponse.json({ user });
  } catch (err: any) {
    console.error("Erreur auth:", err.message);
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}