import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(req);

    const target = await prisma.admin.findUnique({ where: { id: params.id } });
    if (!target) {
      return NextResponse.json({ error: "Admin introuvable" }, { status: 404 });
    }

    // RÈGLE DE SÉCURITÉ ABSOLUE : le SUPER_ADMIN ne peut jamais être retiré,
    // peu importe qui fait la demande (même un autre co-admin ou via API directe).
    if (target.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Le super-admin ne peut pas être retiré" },
        { status: 403 }
      );
    }

    await prisma.admin.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Erreur suppression admin:", err.message);
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}