import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { prisma } from "./prisma";

interface AdminSession {
  adminId: string;
  telegramId: string;
  role: "SUPER_ADMIN" | "CO_ADMIN";
}

const COOKIE_NAME = "admin_session";

export function signAdminSession(payload: AdminSession): string {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) throw new Error("ADMIN_JWT_SECRET manquant");
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

export function verifyAdminToken(token: string): AdminSession {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) throw new Error("ADMIN_JWT_SECRET manquant");
  return jwt.verify(token, secret) as AdminSession;
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;

/**
 * Récupère et vérifie la session admin depuis les cookies d'une requête API.
 * Lance une erreur si non authentifié.
 */
export async function requireAdmin(req: NextRequest): Promise<AdminSession> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) throw new Error("Non authentifié");

  const session = verifyAdminToken(token);

  // Vérifie que l'admin existe toujours en base (au cas où il aurait été retiré entre temps)
  const admin = await prisma.admin.findUnique({ where: { id: session.adminId } });
  if (!admin) throw new Error("Session invalide");

  return session;
}

export function requireSuperAdmin(session: AdminSession) {
  if (session.role !== "SUPER_ADMIN") {
    throw new Error("Action réservée au super-admin");
  }
}