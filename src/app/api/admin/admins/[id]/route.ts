import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(req);
    const { id } = await context.params;

    const target = await prisma.admin.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ error: "Admin introuvable" }, { status: 404 });
    }

    if (target.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Le super-admin ne peut pas être retiré" },
        { status: 403 }
      );
    }

    await prisma.admin.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Erreur suppression admin:", err.message);
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}