import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { prisma } from "./prisma";

export interface AdminSession {
  adminId: string;
  telegramId: string;
  role: "SUPER_ADMIN" | "CO_ADMIN";
}

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

export const ADMIN_COOKIE_NAME = "admin_session";

/**
 * Vérifie le token JWT depuis le header Authorization: Bearer <token>
 * ou depuis localStorage (passé dans X-Admin-Token)
 */
export async function requireAdmin(req: NextRequest): Promise<AdminSession> {
  // Cherche le token dans Authorization header ou X-Admin-Token header
  const authHeader = req.headers.get("Authorization");
  const xToken = req.headers.get("X-Admin-Token");

  const token = authHeader?.replace("Bearer ", "") || xToken;

  if (!token) throw new Error("Non authentifié");

  const session = verifyAdminToken(token);

  const admin = await prisma.admin.findUnique({ where: { id: session.adminId } });
  if (!admin) throw new Error("Session invalide");

  return session;
}

export function requireSuperAdmin(session: AdminSession) {
  if (session.role !== "SUPER_ADMIN") {
    throw new Error("Action réservée au super-admin");
  }
}