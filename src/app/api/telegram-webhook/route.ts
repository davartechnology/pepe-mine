import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Import dynamique pour éviter les problèmes de résolution de module
    const { bot } = await import("../../../../bot/bot");
    await bot.handleUpdate(body);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Erreur webhook:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "Webhook PEPE MINE actif ✅" });
}