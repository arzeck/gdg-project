import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { listings } from '$lib/server/schema';
import { desc, count, sql } from 'drizzle-orm';

/**
 * Serverless-compatible ETag synchronization endpoint for real-time polling fallback.
 * Allows client to check for changes with 0 payload transferred if no changes occurred (HTTP 304).
 */
export const GET: RequestHandler = async ({ request }) => {
	const [stats] = await db
		.select({
			total: count(),
			latestUpdate: sql<string>`MAX(GREATEST(${listings.createdAt}, ${listings.updatedAt}))`
		})
		.from(listings);

	const total = stats?.total || 0;
	const latestUpdate = stats?.latestUpdate || '0';
	const etag = `W/"${total}-${new Date(latestUpdate).getTime()}"`;

	const ifNoneMatch = request.headers.get('if-none-match');
	if (ifNoneMatch === etag) {
		return new Response(null, {
			status: 304,
			headers: {
				ETag: etag,
				'Cache-Control': 'no-cache'
			}
		});
	}

	return json(
		{
			total,
			latestUpdate
		},
		{
			headers: {
				ETag: etag,
				'Cache-Control': 'no-cache'
			}
		}
	);
};

