import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { listingSchema } from '$lib/validation';
import { getListingById, verifyOwnership } from '$lib/server/listings';
import { db } from '$lib/server/db';
import { listings, type Category } from '$lib/server/schema';
import { uploadImage, deleteImage } from '$lib/server/cloudinary';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) {
		throw redirect(303, `/login?redirectTo=${encodeURIComponent(`/listings/${params.id}/edit`)}`);
	}

	const id = params.id;
	const listing = await getListingById(id);
	if (!listing) {
		throw error(404, 'Listing not found');
	}

	// Server-side authorization guard
	if (!verifyOwnership(listing, locals.user.id)) {
		throw error(403, 'Forbidden: You do not have permission to edit this listing');
	}

	return {
		listing
	};
};

export const actions: Actions = {
	default: async ({ params, request, locals }) => {
		if (!locals.user) {
			throw redirect(303, '/login');
		}

		const id = params.id;
		const listing = await getListingById(id);
		if (!listing) {
			throw error(404, 'Listing not found');
		}

		// Server-side ownership check
		if (!verifyOwnership(listing, locals.user.id)) {
			throw error(403, 'Forbidden: You do not have permission to edit this listing');
		}

		const formData = await request.formData();
		const title = formData.get('title')?.toString() || '';
		const description = formData.get('description')?.toString() || '';
		const priceStr = formData.get('price')?.toString() || '0';
		const category = formData.get('category')?.toString() || '';
		const location = formData.get('location')?.toString() || '';
		const newImageFile = formData.get('image');

		const price = parseInt(priceStr, 10);

		// Zod validation
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
			return fail(400, {
				fieldErrors,
				values: { title, description, price: priceStr, category, location }
			});
		}

		let imageUrl = listing.imageUrl;
		let imagePublicId = listing.imagePublicId;

		// Handle image replacement
		if (newImageFile instanceof File && newImageFile.size > 0) {
			try {
				const uploaded = await uploadImage(newImageFile);
				// Delete previous Cloudinary asset if one existed
				if (listing.imagePublicId) {
					await deleteImage(listing.imagePublicId);
				}
				imageUrl = uploaded.url;
				imagePublicId = uploaded.publicId;
			} catch (err: unknown) {
				const errObj = err as { message?: string };
				return fail(400, {
					message: errObj?.message || 'Failed to upload new image',
					values: { title, description, price: priceStr, category, location }
				});
			}
		}

		// Update database record
		await db
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
			.where(eq(listings.id, id));

		throw redirect(303, `/listings/${id}`);
	}
};

