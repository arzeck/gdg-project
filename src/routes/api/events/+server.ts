import { eventBus, type ListingEvent } from '$lib/server/events';
import type { RequestHandler } from '@sveltejs/kit';

/**
 * Server-Sent Events (SSE) endpoint broadcasting marketplace events
 */
export const GET: RequestHandler = ({ request }) => {
	let unsubscribe: (() => void) | null = null;

	const stream = new ReadableStream({
		start(controller) {
			const encoder = new TextEncoder();

			// Initial connection ping
			controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));

			// Subscribe to real-time events
			unsubscribe = eventBus.subscribe((event: ListingEvent) => {
				try {
					controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
				} catch {
					// Stream closed
				}
			});

			// Heartbeat every 15s to keep connection alive
			const pingInterval = setInterval(() => {
				try {
					controller.enqueue(encoder.encode(': ping\n\n'));
				} catch {
					clearInterval(pingInterval);
				}
			}, 15000);

			request.signal.addEventListener('abort', () => {
				clearInterval(pingInterval);
				if (unsubscribe) unsubscribe();
				try {
					controller.close();
				} catch {}
			});
		},
		cancel() {
			if (unsubscribe) unsubscribe();
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache, no-transform',
			Connection: 'keep-alive'
		}
	});
};

