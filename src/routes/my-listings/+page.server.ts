import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getListings, getListingById, deleteListingWithAsset } from '$lib/server/listings';
import { db } from '$lib/server/db';
import { listings } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { eventBus } from '$lib/server/events';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login?redirectTo=%2Fmy-listings');
	}

	const result = await getListings(
		{
			userId: locals.user.id,
			showSold: true,
			limit: 50
		},
		locals.user.id
	);

	return {
		listings: result.listings,
		total: result.total
	};
};

export const actions: Actions = {
	toggleSold: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'You must be logged in' });
		}

		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		if (!id) return fail(400, { message: 'Missing listing ID' });

		const listing = await getListingById(id);
		if (!listing) return fail(404, { message: 'Listing not found' });

		// Server-side ownership verification
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
			message: nextStatus === 'sold' ? 'Listing marked as sold' : 'Listing marked as available'
		};
	},

	delete: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'You must be logged in' });
		}

		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		if (!id) return fail(400, { message: 'Missing listing ID' });

		const listing = await getListingById(id);
		if (!listing) return fail(404, { message: 'Listing not found' });

		// Server-side ownership verification
		if (listing.userId !== locals.user.id) {
			return fail(403, { message: 'Forbidden: You do not own this listing' });
		}

		await deleteListingWithAsset(listing);

		eventBus.broadcast({
			type: 'deleted',
			listingId: id,
			title: listing.title
		});

		return {
			success: true,
			message: 'Listing deleted successfully'
		};
	}
};

