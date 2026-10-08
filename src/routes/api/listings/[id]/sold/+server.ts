import { json, type RequestHandler } from '@sveltejs/kit';
import { getListingById } from '$lib/server/listings';
import { db } from '$lib/server/db';
import { listings } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { eventBus } from '$lib/server/events';

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	// 1. Authentication Check
	if (!locals.user) {
		return json({ error: 'Unauthorized: You must be logged in' }, { status: 401 });
	}

	const id = params.id;
	if (!id) return json({ error: 'Missing listing ID' }, { status: 400 });

	// 2. Load the listing
	const listing = await getListingById(id);
	if (!listing) {
		return json({ error: 'Listing not found' }, { status: 404 });
	}

	// 3. Ownership Check (Strict Server-Side Authz)
	if (listing.userId !== locals.user.id) {
		return json(
			{ error: 'Forbidden: You do not have permission to alter status for this listing' },
			{ status: 403 }
		);
	}

	// 4. Determine new status
	const body = await request.json().catch(() => ({}));
	let nextStatus: 'available' | 'sold';
	if (body.status === 'available' || body.status === 'sold') {
		nextStatus = body.status;
	} else {
		// Toggle
		nextStatus = listing.status === 'available' ? 'sold' : 'available';
	}

	// 5. Update status
	const [updatedListing] = await db
		.update(listings)
		.set({
			status: nextStatus,
			updatedAt: new Date()
		})
		.where(eq(listings.id, id))
		.returning();

	eventBus.broadcast({
		type: nextStatus === 'sold' ? 'sold' : 'updated',
		listingId: id,
		title: updatedListing.title
	});

	return json(updatedListing);
};

