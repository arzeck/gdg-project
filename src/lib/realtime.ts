import { writable } from 'svelte/store';
import { invalidateAll } from '$app/navigation';
import { toast } from '$lib/toast';

export interface RealtimeListingEvent {
	type: 'created' | 'updated' | 'sold' | 'deleted' | 'connected';
	listingId?: string;
	title?: string;
	timestamp?: number;
}

class RealtimeManager {
	hasNewListings = writable(false);
	latestEvent = writable<RealtimeListingEvent | null>(null);
	isConnected = writable(false);
	private eventSource: EventSource | null = null;
	private pollInterval: ReturnType<typeof setInterval> | null = null;
	private lastETag: string | null = null;
	private isInitialized = false;

	init() {
		if (typeof window === 'undefined' || this.isInitialized) return;
		this.isInitialized = true;

		// 1. Try SSE first
		try {
			this.eventSource = new EventSource('/api/events');

			this.eventSource.onopen = () => {
				this.isConnected.set(true);
			};

			this.eventSource.onmessage = (e) => {
				try {
					const data = JSON.parse(e.data) as RealtimeListingEvent;
					if (data.type === 'connected') return;

					this.latestEvent.set(data);

					if (data.type === 'created') {
						this.hasNewListings.set(true);
						if (data.title) {
							toast.info(`New item posted: "${data.title}"`);
						}
						invalidateAll();
					} else if (data.type === 'sold') {
						if (data.title) {
							toast.info(`"${data.title}" marked as SOLD`);
						}
						invalidateAll();
					} else if (data.type === 'updated' || data.type === 'deleted') {
						invalidateAll();
					}
				} catch {}
			};

			this.eventSource.onerror = () => {
				// If SSE fails (e.g. serverless disconnect), switch to ETag polling fallback
				this.disconnectSSE();
				this.startETagPolling();
			};
		} catch {
			this.startETagPolling();
		}
	}

	private disconnectSSE() {
		if (this.eventSource) {
			this.eventSource.close();
			this.eventSource = null;
		}
		this.isConnected.set(false);
	}

	private startETagPolling() {
		if (this.pollInterval) return;

		this.pollInterval = setInterval(async () => {
			try {
				const headers: Record<string, string> = {};
				if (this.lastETag) {
					headers['If-None-Match'] = this.lastETag;
				}

				const res = await fetch('/api/listings/latest', { headers });

				if (res.status === 200) {
					const etag = res.headers.get('ETag');
					if (this.lastETag && this.lastETag !== etag) {
						// Content changed!
						this.hasNewListings.set(true);
						invalidateAll();
					}
					this.lastETag = etag;
				}
			} catch {}
		}, 5000);
	}

	markSeen() {
		this.hasNewListings.set(false);
	}

	destroy() {
		this.isInitialized = false;
		this.disconnectSSE();
		if (this.pollInterval) {
			clearInterval(this.pollInterval);
			this.pollInterval = null;
		}
	}
}

export const realtime = new RealtimeManager();
