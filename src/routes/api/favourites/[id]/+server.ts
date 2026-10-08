import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { favourites, listings } from '$lib/server/schema';
import { eq, and } from 'drizzle-orm';

export const POST: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized: You must be logged in to save favourites' }, { status: 401 });
	}

	const listingId = params.id;
	if (!listingId) {
		return json({ error: 'Missing listing ID' }, { status: 400 });
	}

	// Verify listing exists
	const [listing] = await db.select().from(listings).where(eq(listings.id, listingId));
	if (!listing) {
		return json({ error: 'Listing not found' }, { status: 404 });
	}

	// Upsert favourite
	await db
		.insert(favourites)
		.values({
			userId: locals.user.id,
			listingId
		})
		.onConflictDoNothing();

	return json({ success: true, isFavourite: true });
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized: You must be logged in' }, { status: 401 });
	}

	const listingId = params.id;
	if (!listingId) {
		return json({ error: 'Missing listing ID' }, { status: 400 });
	}

	await db
		.delete(favourites)
		.where(and(eq(favourites.userId, locals.user.id), eq(favourites.listingId, listingId)));

	return json({ success: true, isFavourite: false });
};

