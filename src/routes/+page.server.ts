import type { PageServerLoad } from './$types';
import { getListings } from '$lib/server/listings';

export const load: PageServerLoad = async ({ url, locals }) => {
	const q = url.searchParams.get('q') || undefined;
	const category = url.searchParams.get('category') || undefined;
	const minPriceStr = url.searchParams.get('minPrice');
	const maxPriceStr = url.searchParams.get('maxPrice');
	const showSold = url.searchParams.get('showSold') === 'true';
	const location = url.searchParams.get('location') || undefined;
	const sort = (url.searchParams.get('sort') as any) || 'newest';
	const page = parseInt(url.searchParams.get('page') || '1', 10);
	const limit = 12;

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

	return result;
};

