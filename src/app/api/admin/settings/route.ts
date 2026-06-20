import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const settings = await prisma.settings.findUnique({ where: { id: "global" } });
    return NextResponse.json({ settings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();

    const allowedFields = [
      "claimAmount",
      "claimCooldownMinutes",
      "refLevel1Percent",
      "refLevel2Percent",
      "refLevel3Percent",
      "minWithdrawal",
    ];

    const data: Record<string, number> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        const num = Number(body[field]);
        if (isNaN(num) || num < 0) {
          return NextResponse.json(
            { error: `Valeur invalide pour ${field}` },
            { status: 400 }
          );
        }
        data[field] = num;
      }
    }

    const updated = await prisma.settings.upsert({
      where: { id: "global" },
      update: data,
      create: { id: "global", ...data },
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    console.error("Erreur update settings:", err.message);
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}