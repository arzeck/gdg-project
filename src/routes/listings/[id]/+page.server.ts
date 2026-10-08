import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getListingById, deleteListingWithAsset } from '$lib/server/listings';
import { db } from '$lib/server/db';
import { listings } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { eventBus } from '$lib/server/events';

export const load: PageServerLoad = async ({ params, locals }) => {
	const id = params.id;
	if (!id) {
		throw error(404, 'Listing not found');
	}

	const listing = await getListingById(id, locals.user?.id);
	if (!listing) {
		throw error(404, 'Listing not found');
	}

	const isOwner = Boolean(locals.user && listing.userId === locals.user.id);

	return {
		listing,
		isOwner
	};
};

export const actions: Actions = {
	toggleSold: async ({ params, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'You must be logged in' });
		}

		const id = params.id;
		const listing = await getListingById(id);
		if (!listing) {
			return fail(404, { message: 'Listing not found' });
		}

		// Non-negotiable server-side ownership check
		if (listing.userId !== locals.user.id) {
			return fail(403, { message: 'Forbidden: You do not own this listing' });
		}

		const nextStatus = listing.status === 'available' ? 'sold' : 'available';

		await db
			.update(listings)
			.set({
				status: nextStatus,
				updatedAt: new Date()
			})
			.where(eq(listings.id, id));

		eventBus.broadcast({
			type: nextStatus === 'sold' ? 'sold' : 'updated',
			listingId: id,
			title: listing.title
		});

		return {
			success: true,
			message: nextStatus === 'sold' ? 'Item marked as sold' : 'Item marked as available'
		};
	},

	delete: async ({ params, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'You must be logged in' });
		}

		const id = params.id;
		const listing = await getListingById(id);
		if (!listing) {
			return fail(404, { message: 'Listing not found' });
		}

		// Non-negotiable server-side ownership check
		if (listing.userId !== locals.user.id) {
			return fail(403, { message: 'Forbidden: You do not own this listing' });
		}

		await deleteListingWithAsset(listing);

		eventBus.broadcast({
			type: 'deleted',
			listingId: id,
			title: listing.title
		});

		throw redirect(303, '/my-listings');
	}
};

