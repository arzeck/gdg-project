import { json, type RequestHandler } from '@sveltejs/kit';
import { getListings } from '$lib/server/listings';
import { db } from '$lib/server/db';
import { listings, type Category } from '$lib/server/schema';
import { listingSchema } from '$lib/validation';
import { uploadImage } from '$lib/server/cloudinary';

export const GET: RequestHandler = async ({ url, locals }) => {
	const q = url.searchParams.get('q') || undefined;
	const category = url.searchParams.get('category') || undefined;
	const minPriceStr = url.searchParams.get('minPrice');
	const maxPriceStr = url.searchParams.get('maxPrice');
	const showSold = url.searchParams.get('showSold') === 'true';
	const location = url.searchParams.get('location') || undefined;
	const sort = (url.searchParams.get('sort') as any) || 'newest';
	const page = parseInt(url.searchParams.get('page') || '1', 10);
	const limit = parseInt(url.searchParams.get('limit') || '12', 10);

	const minPrice = minPriceStr ? parseInt(minPriceStr, 10) : undefined;
	const maxPrice = maxPriceStr ? parseInt(maxPriceStr, 10) : undefined;

	const result = await getListings(
		{
			q,
			category,
			minPrice,
			maxPrice,
			showSold,
			location,
			sort,
			page,
			limit
		},
		locals.user?.id
	);

	return json(result);
};

export const POST: RequestHandler = async ({ request, locals }) => {
	// 1. Strict Server-Side Authentication Guard
	if (!locals.user) {
		return json({ error: 'Unauthorized: You must be logged in to create a listing' }, { status: 401 });
	}

	let title = '';
	let description = '';
	let price = 0;
	let category = '';
	let location = '';
	let imageFile: File | null = null;
	let imageUrl = '';
	let imagePublicId: string | null = null;

	const contentType = request.headers.get('content-type') || '';

	if (contentType.includes('multipart/form-data')) {
		const formData = await request.formData();
		title = formData.get('title')?.toString() || '';
		description = formData.get('description')?.toString() || '';
		price = parseInt(formData.get('price')?.toString() || '0', 10);
		category = formData.get('category')?.toString() || '';
		location = formData.get('location')?.toString() || '';

		const file = formData.get('image');
		if (file instanceof File && file.size > 0) {
			imageFile = file;
		}
	} else {
		const body = await request.json().catch(() => ({}));
		title = body.title || '';
		description = body.description || '';
		price = body.price || 0;
		category = body.category || '';
		location = body.location || '';
		imageUrl = body.imageUrl || '';
		imagePublicId = body.imagePublicId || null;
	}

	// 2. Validate input fields using Zod
	const validation = listingSchema.safeParse({
		title,
		description,
		price,
		category,
		location
	});

	if (!validation.success) {
		const fieldErrors: Record<string, string> = {};
		for (const issue of validation.error.issues) {
			const path = issue.path[0]?.toString();
			if (path && !fieldErrors[path]) {
				fieldErrors[path] = issue.message;
			}
		}
		return json({ error: 'Validation failed', fieldErrors }, { status: 422 });
	}

	// 3. Image validation and upload
	if (imageFile) {
		try {
			const uploaded = await uploadImage(imageFile);
			imageUrl = uploaded.url;
			imagePublicId = uploaded.publicId;
		} catch (err: unknown) {
			const error = err as { message?: string };
			return json(
				{ error: 'Image upload failed', message: error?.message || 'Invalid image file' },
				{ status: 422 }
			);
		}
	} else if (!imageUrl) {
		return json(
			{ error: 'Validation failed', fieldErrors: { image: 'An item image is required' } },
			{ status: 422 }
		);
	}

	// 4. Insert into database with locals.user.id (NEVER trust client-sent user IDs)
	const [createdListing] = await db
		.insert(listings)
		.values({
			userId: locals.user.id,
			title: validation.data.title,
			description: validation.data.description,
			price: validation.data.price,
			category: validation.data.category as Category,
			location: validation.data.location || null,
			imageUrl,
			imagePublicId,
			status: 'available'
		})
		.returning();

	return json(createdListing, { status: 201 });
};
