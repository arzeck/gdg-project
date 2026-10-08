import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { listingSchema, getFieldErrors } from '$lib/validation';
import { db } from '$lib/server/db';
import { listings, type Category } from '$lib/server/schema';
import { uploadImage } from '$lib/server/cloudinary';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login?redirectTo=%2Flistings%2Fnew');
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		// Strict server-side auth guard
		if (!locals.user) {
			throw redirect(303, '/login?redirectTo=%2Flistings%2Fnew');
		}

		const formData = await request.formData();
		const title = formData.get('title')?.toString() || '';
		const description = formData.get('description')?.toString() || '';
		const priceStr = formData.get('price')?.toString() || '0';
		const category = formData.get('category')?.toString() || '';
		const location = formData.get('location')?.toString() || '';
		const imageFile = formData.get('image');

		const price = parseInt(priceStr, 10);

		// Zod validation
		const validation = listingSchema.safeParse({
			title,
			description,
			price,
			category,
			location
		});

		const fieldErrors = validation.success ? {} : getFieldErrors(validation.error);

		// Image file check
		if (!(imageFile instanceof File) || imageFile.size === 0) {
			fieldErrors.image = 'An image of the item is required';
		}

		if (Object.keys(fieldErrors).length > 0) {
			return fail(400, {
				fieldErrors,
				values: { title, description, price: priceStr, category, location }
			});
		}

		// Upload image to Cloudinary
		let imageUrl = '';
		let imagePublicId = '';

		try {
			const uploadResult = await uploadImage(imageFile as File);
			imageUrl = uploadResult.url;
			imagePublicId = uploadResult.publicId;
		} catch (err: unknown) {
			const error = err as { message?: string };
			return fail(400, {
				message: error?.message || 'Failed to upload image. Please try again.',
				values: { title, description, price: priceStr, category, location }
			});
		}

		// Insert listing with locals.user.id
		const [newListing] = await db
			.insert(listings)
			.values({
				userId: locals.user.id,
				title: validation.data!.title,
				description: validation.data!.description,
				price: validation.data!.price,
				category: validation.data!.category as Category,
				location: validation.data!.location || null,
				imageUrl,
				imagePublicId,
				status: 'available'
			})
			.returning();

		throw redirect(303, `/listings/${newListing.id}`);
	}
};

