import { json, type RequestHandler } from '@sveltejs/kit';

/**
 * Nominatim (OpenStreetMap) location autocomplete proxy
 * Adheres to Nominatim usage policy (User-Agent header, caching)
 */
export const GET: RequestHandler = async ({ url }) => {
	const query = url.searchParams.get('q')?.trim();
	if (!query || query.length < 2) {
		return json([]);
	}

	try {
		const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
			query
		)}&limit=5&addressdetails=1`;

		const response = await fetch(nominatimUrl, {
			headers: {
				'User-Agent': 'CampusMarketplace-StudentApp/1.0 (contact: student-market@campus.edu)',
				Accept: 'application/json'
			}
		});

		if (!response.ok) {
			return json([]);
		}

		const data = await response.json();
		const results = data.map((item: any) => ({
			display_name: item.display_name,
			name: item.name || item.display_name.split(',')[0],
			type: item.type
		}));

		return json(results, {
			headers: {
				'Cache-Control': 'public, max-age=3600' // Cache suggestions for 1 hour
			}
		});
	} catch (err) {
		console.error('Nominatim API error:', err);
		return json([]);
	}
};
