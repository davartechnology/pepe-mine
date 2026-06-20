import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(req);
    const body = await req.json();

    const data: Record<string, any> = {};
    if (typeof body.isBlocked === "boolean") data.isBlocked = body.isBlocked;
    if (typeof body.isDeleted === "boolean") data.isDeleted = body.isDeleted;
    if (typeof body.balance === "number") data.balance = body.balance;

    const user = await prisma.user.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({ success: true, user });
  } catch (err: any) {
    console.error("Erreur update user:", err.message);
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(req);

    // Soft delete : on garde l'historique financier intact pour la comptabilité
    const user = await prisma.user.update({
      where: { id: params.id },
      data: { isDeleted: true, isBlocked: true },
    });

    return NextResponse.json({ success: true, user });
  } catch (err: any) {
    console.error("Erreur delete user:", err.message);
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}