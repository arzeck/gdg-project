import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { registerSchema, getFieldErrors } from '$lib/validation';
import { db } from '$lib/server/db';
import { users } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import {
	hashPassword,
	createSession,
	setSessionCookie,
	checkRateLimit
} from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		throw redirect(303, '/');
	}
	return {};
};

export const actions: Actions = {
	default: async (event) => {
		const clientIp = event.getClientAddress() || 'unknown';
		const rateCheck = checkRateLimit(clientIp, 8, 60 * 1000);
		if (!rateCheck.allowed) {
			return fail(429, {
				message: `Too many attempts. Please try again in ${rateCheck.retryAfterSeconds} seconds.`,
				values: { name: '', email: '' }
			});
		}

		const formData = await event.request.formData();
		const name = formData.get('name')?.toString() || '';
		const email = formData.get('email')?.toString() || '';
		const password = formData.get('password')?.toString() || '';
		const redirectTo = event.url.searchParams.get('redirectTo');

		const validation = registerSchema.safeParse({ name, email, password });
		if (!validation.success) {
			return fail(400, {
				fieldErrors: getFieldErrors(validation.error),
				values: { name, email }
			});
		}

		// Check if user already exists
		const existingUser = await db
			.select()
			.from(users)
			.where(eq(users.email, validation.data.email));

		if (existingUser.length > 0) {
			return fail(400, {
				message: 'An account with this email address already exists.',
				values: { name, email }
			});
		}

		// Create user with hashed password
		const passwordHash = await hashPassword(validation.data.password);
		const [newUser] = await db
			.insert(users)
			.values({
				name: validation.data.name,
				email: validation.data.email,
				passwordHash
			})
			.returning();

		// Create authenticated session
		const { token, session } = await createSession(newUser.id);
		setSessionCookie(event.cookies, token, session.expiresAt);

		// Safe redirect
		if (redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')) {
			throw redirect(303, redirectTo);
		}
		throw redirect(303, '/');
	}
};

