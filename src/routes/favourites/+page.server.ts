import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { listings, users, favourites } from '$lib/server/schema';
import { eq, desc } from 'drizzle-orm';
import type { ListingWithSeller } from '$lib/server/listings';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login?redirectTo=%2Ffavourites');
	}

	const rows = await db
		.select({
			listing: listings,
			seller: {
				id: users.id,
				name: users.name,
				email: users.email
			}
		})
		.from(favourites)
		.innerJoin(listings, eq(favourites.listingId, listings.id))
		.innerJoin(users, eq(listings.userId, users.id))
		.where(eq(favourites.userId, locals.user.id))
		.orderBy(desc(favourites.createdAt));

	const favListings: ListingWithSeller[] = rows.map(({ listing, seller }) => ({
		...listing,
		seller,
		isFavourite: true
	}));

	return {
		listings: favListings,
		total: favListings.length
	};
};
