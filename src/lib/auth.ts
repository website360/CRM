import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'crm-lp-jwt-secret-change-in-production';
const TOKEN_EXPIRY = '7d';

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  role: string;
  orgId: number | null;
  avatar: string | null;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(user: AuthUser): string {
  return jwt.sign({ id: user.id, email: user.email, orgId: user.orgId, role: user.role }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): { id: number; email: string; orgId: number | null; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: number; email: string; orgId: number | null; role: string };
  } catch { return null; }
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { id: true, email: true, name: true, role: true, orgId: true, avatar: true },
  });

  return user;
}

// Get orgId from a NextRequest (for route handlers)
export function getOrgIdFromRequest(request: { cookies: { get: (name: string) => { value: string } | undefined } }): number | null {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.orgId || null;
}

export async function getAuthOrg() {
  const user = await getAuthUser();
  if (!user?.orgId) return null;
  return prisma.organization.findUnique({
    where: { id: user.orgId },
    include: { plan: true },
  });
}
