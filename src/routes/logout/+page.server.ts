import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	getSessionTokenFromCookies,
	invalidateSession,
	deleteSessionCookie
} from '$lib/server/auth';

export const load: PageServerLoad = async () => {
	throw redirect(303, '/');
};

export const actions: Actions = {
	default: async (event) => {
		const token = getSessionTokenFromCookies(event.cookies);
		if (token) {
			await invalidateSession(token);
			deleteSessionCookie(event.cookies);
		}
		throw redirect(303, '/login');
	}
};

