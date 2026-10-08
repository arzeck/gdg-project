import { db } from './db';
import { listings, users, favourites, type Listing, type Category, type Status } from './schema';
import { eq, and, or, ilike, gte, lte, desc, asc, count } from 'drizzle-orm';
import { deleteImage } from './cloudinary';

export interface ListingFilterOptions {
	q?: string;
	category?: string;
	minPrice?: number;
	maxPrice?: number;
	showSold?: boolean;
	location?: string;
	sort?: 'newest' | 'price_asc' | 'price_desc';
	userId?: string; // filter by owner (for my-listings)
	page?: number;
	limit?: number;
}

export interface ListingWithSeller extends Listing {
	seller: {
		id: string;
		name: string;
		email: string;
	};
	isFavourite?: boolean;
}

/**
 * Retrieves listings with dynamic filtering, pagination, and seller details
 */
export async function getListings(
	options: ListingFilterOptions = {},
	currentUserId?: string
): Promise<{
	listings: ListingWithSeller[];
	total: number;
	page: number;
	totalPages: number;
	limit: number;
}> {
	const page = Math.max(1, options.page || 1);
	const limit = Math.min(50, Math.max(1, options.limit || 12));
	const offset = (page - 1) * limit;

	const conditions = [];

	// Search by title or description (case-insensitive)
	if (options.q && options.q.trim().length > 0) {
		const term = `%${options.q.trim()}%`;
		conditions.push(or(ilike(listings.title, term), ilike(listings.description, term)));
	}

	// Filter by category
	if (options.category && options.category !== 'all') {
		conditions.push(eq(listings.category, options.category as Category));
	}

	// Price range
	if (options.minPrice !== undefined && options.minPrice > 0) {
		conditions.push(gte(listings.price, options.minPrice));
	}
	if (options.maxPrice !== undefined && options.maxPrice > 0) {
		conditions.push(lte(listings.price, options.maxPrice));
	}

	// Location filter
	if (options.location && options.location.trim().length > 0) {
		const locTerm = `%${options.location.trim()}%`;
		conditions.push(ilike(listings.location, locTerm));
	}

	// Filter by user (e.g. My Listings)
	if (options.userId) {
		conditions.push(eq(listings.userId, options.userId));
	}

	// Show/hide sold items: by default, show only available unless showSold is true or searching user's own listings
	if (!options.showSold && !options.userId) {
		conditions.push(eq(listings.status, 'available'));
	}

	// Sort order
	let orderByClause;
	if (options.sort === 'price_asc') {
		orderByClause = [asc(listings.price), desc(listings.createdAt)];
	} else if (options.sort === 'price_desc') {
		orderByClause = [desc(listings.price), desc(listings.createdAt)];
	} else {
		// Default: newest first
		orderByClause = [desc(listings.createdAt)];
	}

	// Execute queries with where clause
	const whereClause = conditions.length ? (conditions.length === 1 ? conditions[0] : and(...conditions)) : undefined;

	const [countResult] = await db
		.select({ total: count() })
		.from(listings)
		.where(whereClause);
	const total = countResult?.total || 0;

	const rows = await db
		.select({
			listing: listings,
			seller: {
				id: users.id,
				name: users.name,
				email: users.email
			}
		})
		.from(listings)
		.innerJoin(users, eq(listings.userId, users.id))
		.where(whereClause)
		.orderBy(...orderByClause)
		.limit(limit)
		.offset(offset);

	const totalPages = Math.ceil(total / limit) || 1;

	// Fetch favourites if user is authenticated
	let userFavSet = new Set<string>();
	if (currentUserId && rows.length > 0) {
		const userFavs = await db
			.select({ listingId: favourites.listingId })
			.from(favourites)
			.where(eq(favourites.userId, currentUserId));
		userFavSet = new Set(userFavs.map((f) => f.listingId));
	}

	const resultListings: ListingWithSeller[] = rows.map(({ listing, seller }) => ({
		...listing,
		seller,
		isFavourite: userFavSet.has(listing.id)
	}));

	return {
		listings: resultListings,
		total,
		page,
		totalPages,
		limit
	};
}

/**
 * Retrieves a single listing by ID with seller details
 */
export async function getListingById(
	id: string,
	currentUserId?: string
): Promise<ListingWithSeller | null> {
	const [row] = await db
		.select({
			listing: listings,
			seller: {
				id: users.id,
				name: users.name,
				email: users.email
			}
		})
		.from(listings)
		.innerJoin(users, eq(listings.userId, users.id))
		.where(eq(listings.id, id));

	if (!row) return null;

	let isFavourite = false;
	if (currentUserId) {
		const [fav] = await db
			.select()
			.from(favourites)
			.where(and(eq(favourites.userId, currentUserId), eq(favourites.listingId, id)));
		isFavourite = Boolean(fav);
	}

	return {
		...row.listing,
		seller: row.seller,
		isFavourite
	};
}

/**
 * Deletes a listing and its corresponding Cloudinary asset
 */
export async function deleteListingWithAsset(listing: Listing): Promise<void> {
	if (listing.imagePublicId) {
		await deleteImage(listing.imagePublicId);
	}
	await db.delete(listings).where(eq(listings.id, listing.id));
}

