import { json, type RequestHandler } from '@sveltejs/kit';
import { getListingById, deleteListingWithAsset } from '$lib/server/listings';
import { db } from '$lib/server/db';
import { listings, type Category } from '$lib/server/schema';
import { listingSchema } from '$lib/validation';
import { uploadImage, deleteImage } from '$lib/server/cloudinary';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, locals }) => {
	const id = params.id;
	if (!id) return json({ error: 'Missing listing ID' }, { status: 400 });

	const listing = await getListingById(id, locals.user?.id);
	if (!listing) {
		return json({ error: 'Listing not found' }, { status: 404 });
	}

	return json(listing);
};

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
			{ error: 'Forbidden: You do not have permission to edit this listing' },
			{ status: 403 }
		);
	}

	let title = listing.title;
	let description = listing.description;
	let price = listing.price;
	let category = listing.category;
	let location = listing.location || '';
	let newImageFile: File | null = null;

	const contentType = request.headers.get('content-type') || '';

	if (contentType.includes('multipart/form-data')) {
		const formData = await request.formData();
		if (formData.has('title')) title = formData.get('title')?.toString() || '';
		if (formData.has('description')) description = formData.get('description')?.toString() || '';
		if (formData.has('price')) price = parseInt(formData.get('price')?.toString() || '0', 10);
		if (formData.has('category')) category = formData.get('category')?.toString() as Category;
		if (formData.has('location')) location = formData.get('location')?.toString() || '';

		const file = formData.get('image');
		if (file instanceof File && file.size > 0) {
			newImageFile = file;
		}
	} else {
		const body = await request.json().catch(() => ({}));
		if (body.title !== undefined) title = body.title;
		if (body.description !== undefined) description = body.description;
		if (body.price !== undefined) price = body.price;
		if (body.category !== undefined) category = body.category;
		if (body.location !== undefined) location = body.location;
	}

	// 4. Validate updated fields
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

	let imageUrl = listing.imageUrl;
	let imagePublicId = listing.imagePublicId;

	// 5. Handle image replacement
	if (newImageFile) {
		try {
			const uploaded = await uploadImage(newImageFile);
			// Delete previous Cloudinary asset if it had one
			if (listing.imagePublicId) {
				await deleteImage(listing.imagePublicId);
			}
			imageUrl = uploaded.url;
			imagePublicId = uploaded.publicId;
		} catch (err: unknown) {
			const error = err as { message?: string };
			return json(
				{ error: 'Image upload failed', message: error?.message || 'Invalid image file' },
				{ status: 422 }
			);
		}
	}

	// 6. Update database record
	const [updatedListing] = await db
		.update(listings)
		.set({
			title: validation.data.title,
			description: validation.data.description,
			price: validation.data.price,
			category: validation.data.category as Category,
			location: validation.data.location || null,
			imageUrl,
			imagePublicId,
			updatedAt: new Date()
		})
		.where(eq(listings.id, id))
		.returning();

	return json(updatedListing);
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
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
			{ error: 'Forbidden: You do not have permission to delete this listing' },
			{ status: 403 }
		);
	}

	// 4. Delete listing and Cloudinary asset
	await deleteListingWithAsset(listing);

	return json({ success: true, message: 'Listing deleted successfully' });
};

