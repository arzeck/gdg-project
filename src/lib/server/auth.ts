import { db } from './db';
import { users, sessions, type User, type Session } from './schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import type { Cookies } from '@sveltejs/kit';

const SESSION_COOKIE_NAME = 'session_token';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const SESSION_REFRESH_THRESHOLD_MS = 1000 * 60 * 60 * 24 * 15; // 15 days

// In-memory rate limiter for auth attempts (per IP)
interface RateLimitRecord {
	count: number;
	resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();

/**
 * Basic in-memory rate limiter.
 * Note: Resets on serverless cold starts. For persistent multi-instance production,
 * Upstash Redis / DB-backed rate limiting would be used.
 */
export function checkRateLimit(ip: string, maxAttempts = 6, windowMs = 60 * 1000): { allowed: boolean; retryAfterSeconds: number } {
	const now = Date.now();
	const record = rateLimitMap.get(ip);

	if (!record || now > record.resetAt) {
		rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
		return { allowed: true, retryAfterSeconds: 0 };
	}

	if (record.count >= maxAttempts) {
		const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
		return { allowed: false, retryAfterSeconds };
	}

	record.count += 1;
	return { allowed: true, retryAfterSeconds: 0 };
}

// Password helpers
export async function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
	return bcrypt.compare(password, hash);
}

// Session Token Generation & Hashing
export function generateSessionToken(): string {
	const bytes = new Uint8Array(32);
	crypto.getRandomValues(bytes);
	return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function hashToken(token: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(token);
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	return Array.from(new Uint8Array(hashBuffer), (b) => b.toString(16).padStart(2, '0')).join('');
}

export interface SessionValidationResult {
	session: Session | null;
	user: {
		id: string;
		name: string;
		email: string;
		createdAt: Date;
	} | null;
}

export async function createSession(userId: string): Promise<{ token: string; session: Session }> {
	const token = generateSessionToken();
	const sessionId = await hashToken(token);
	const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

	const [session] = await db
		.insert(sessions)
		.values({
			id: sessionId,
			userId,
			expiresAt
		})
		.returning();

	return { token, session };
}

export async function validateSessionToken(token: string): Promise<SessionValidationResult> {
	const sessionId = await hashToken(token);

	const [result] = await db
		.select({
			session: sessions,
			user: {
				id: users.id,
				name: users.name,
				email: users.email,
				createdAt: users.createdAt
			}
		})
		.from(sessions)
		.innerJoin(users, eq(sessions.userId, users.id))
		.where(eq(sessions.id, sessionId));

	if (!result) {
		return { session: null, user: null };
	}

	const { session, user } = result;

	// Check if session expired
	if (Date.now() >= session.expiresAt.getTime()) {
		await db.delete(sessions).where(eq(sessions.id, sessionId));
		return { session: null, user: null };
	}

	// Extend session if within 15 days of expiry
	if (Date.now() >= session.expiresAt.getTime() - SESSION_REFRESH_THRESHOLD_MS) {
		session.expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
		await db
			.update(sessions)
			.set({ expiresAt: session.expiresAt })
			.where(eq(sessions.id, sessionId));
	}

	return { session, user };
}

export async function invalidateSession(token: string): Promise<void> {
	const sessionId = await hashToken(token);
	await db.delete(sessions).where(eq(sessions.id, sessionId));
}

// Cookie helpers
export function setSessionCookie(cookies: Cookies, token: string, expiresAt: Date): void {
	cookies.set(SESSION_COOKIE_NAME, token, {
		httpOnly: true,
		path: '/',
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		expires: expiresAt
	});
}

export function deleteSessionCookie(cookies: Cookies): void {
	cookies.delete(SESSION_COOKIE_NAME, {
		path: '/'
	});
}

export function getSessionTokenFromCookies(cookies: Cookies): string | undefined {
	return cookies.get(SESSION_COOKIE_NAME);
}
