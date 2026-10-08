import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { loginSchema } from '$lib/validation';
import { db } from '$lib/server/db';
import { users } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import {
	verifyPassword,
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
		const rateCheck = checkRateLimit(clientIp, 10, 60 * 1000);
		if (!rateCheck.allowed) {
			return fail(429, {
				message: `Too many attempts. Please try again in ${rateCheck.retryAfterSeconds} seconds.`,
				values: { email: '' }
			});
		}

		const formData = await event.request.formData();
		const email = formData.get('email')?.toString() || '';
		const password = formData.get('password')?.toString() || '';
		const redirectTo = event.url.searchParams.get('redirectTo');

		const validation = loginSchema.safeParse({ email, password });
		if (!validation.success) {
			const fieldErrors: Record<string, string> = {};
			for (const issue of validation.error.issues) {
				const path = issue.path[0]?.toString();
				if (path && !fieldErrors[path]) {
					fieldErrors[path] = issue.message;
				}
			}
			return fail(400, {
				fieldErrors,
				values: { email }
			});
		}

		// Look up user
		const [user] = await db
			.select()
			.from(users)
			.where(eq(users.email, validation.data.email));

		// Timing-safe check: Always use verifyPassword even if user not found to thwart timing attacks
		const dummyHash = '$2a$10$wT0X0h80j0Z9PjQ248yIue.e1R.rT5iS68xI5U2z03xW0Gj2oKjWy';
		const passwordMatch = user
			? await verifyPassword(validation.data.password, user.passwordHash)
			: await verifyPassword(validation.data.password, dummyHash).then(() => false);

		if (!user || !passwordMatch) {
			// Generic error prevents user enumeration
			return fail(400, {
				message: 'Invalid email or password.',
				values: { email }
			});
		}

		// Create authenticated session
		const { token, session } = await createSession(user.id);
		setSessionCookie(event.cookies, token, session.expiresAt);

		// Safe redirect
		if (redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')) {
			throw redirect(303, redirectTo);
		}
		throw redirect(303, '/');
	}
};

