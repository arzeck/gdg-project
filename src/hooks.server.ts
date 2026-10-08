import { redirect, json } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';
import {
	getSessionTokenFromCookies,
	validateSessionToken,
	setSessionCookie,
	deleteSessionCookie
} from '$lib/server/auth';

const PROTECTED_PAGE_PREFIXES = ['/listings/new', '/my-listings', '/favourites'];
const AUTH_PAGE_PATHS = ['/login', '/register'];

export const handle: Handle = async ({ event, resolve }) => {
	const token = getSessionTokenFromCookies(event.cookies);

	if (token) {
		const { session, user } = await validateSessionToken(token);
		if (session && user) {
			event.locals.user = user;
			event.locals.session = session;
			setSessionCookie(event.cookies, token, session.expiresAt);
		} else {
			event.locals.user = null;
			event.locals.session = null;
			deleteSessionCookie(event.cookies);
		}
	} else {
		event.locals.user = null;
		event.locals.session = null;
	}

	const pathname = event.url.pathname;

	// Check if this is an edit page: /listings/[id]/edit
	const isEditPage = /^\/listings\/[^/]+\/edit\/?$/.test(pathname);
	const isProtectedPage =
		PROTECTED_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix)) || isEditPage;

	// Guard protected web pages
	if (isProtectedPage && !event.locals.user) {
		const redirectTo = encodeURIComponent(event.url.pathname + event.url.search);
		throw redirect(303, `/login?redirectTo=${redirectTo}`);
	}

	// Redirect authenticated users away from auth pages
	if (AUTH_PAGE_PATHS.includes(pathname) && event.locals.user) {
		const redirectTo = event.url.searchParams.get('redirectTo');
		if (redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')) {
			throw redirect(303, redirectTo);
		}
		throw redirect(303, '/');
	}

	// Guard mutating API routes
	if (pathname.startsWith('/api/') && !event.locals.user) {
		const mutatingMethods = ['POST', 'PATCH', 'PUT', 'DELETE'];
		if (mutatingMethods.includes(event.request.method)) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}
	}

	return resolve(event);
};

