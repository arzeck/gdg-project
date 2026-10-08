import { json, type RequestHandler } from '@sveltejs/kit';
import { getListings } from '$lib/server/listings';
import { db } from '$lib/server/db';
import { listings, type Category } from '$lib/server/schema';
import { listingSchema, getFieldErrors } from '$lib/validation';
import { uploadImage } from '$lib/server/cloudinary';
import { eventBus } from '$lib/server/events';

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

	const formData = request.headers.get('content-type')?.includes('multipart/form-data') ? await request.formData() : null;
	const body = !formData ? await request.json().catch(() => ({})) : null;

	const title = (formData ? formData.get('title') : body?.title)?.toString() || '';
	const description = (formData ? formData.get('description') : body?.description)?.toString() || '';
	const price = parseInt((formData ? formData.get('price') : body?.price)?.toString() || '0', 10);
	const category = (formData ? formData.get('category') : body?.category)?.toString() || '';
	const location = (formData ? formData.get('location') : body?.location)?.toString() || '';
	const rawFile = formData?.get('image');
	const imageFile = rawFile instanceof File && rawFile.size > 0 ? rawFile : null;
	let imageUrl = body?.imageUrl || '';
	let imagePublicId = body?.imagePublicId || null;

	// 2. Validate input fields using Zod
	const validation = listingSchema.safeParse({ title, description, price, category, location });
	if (!validation.success) {
		return json({ error: 'Validation failed', fieldErrors: getFieldErrors(validation.error) }, { status: 422 });
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

	// Broadcast real-time created event
	eventBus.broadcast({
		type: 'created',
		listingId: createdListing.id,
		title: createdListing.title
	});

	return json(createdListing, { status: 201 });
};
