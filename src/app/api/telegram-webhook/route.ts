import { NextRequest, NextResponse } from "next/server";
import { bot } from "@/bot/bot";

// Désactive le body parser par défaut de Next.js (Telegraf gère ça lui-même)
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Passe l'update Telegram à Telegraf pour traitement
    await bot.handleUpdate(body);
    
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Erreur webhook:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET pour vérifier que le webhook est actif (utile pour le debug)
export async function GET() {
  return NextResponse.json({ status: "Webhook PEPE MINE actif ✅" });
}