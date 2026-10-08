export interface RealtimeListingEvent {
	type: 'created' | 'updated' | 'sold' | 'deleted' | 'connected';
	listingId?: string;
	title?: string;
	timestamp?: number;
}

class RealtimeManager {
	hasNewListings = $state(false);
	latestEvent = $state<RealtimeListingEvent | null>(null);
	isConnected = $state(false);
	private eventSource: EventSource | null = null;
	private pollInterval: ReturnType<typeof setInterval> | null = null;
	private lastETag: string | null = null;

	init() {
		if (typeof window === 'undefined') return;

		// 1. Try SSE first
		try {
			this.eventSource = new EventSource('/api/events');

			this.eventSource.onopen = () => {
				this.isConnected = true;
			};

			this.eventSource.onmessage = (e) => {
				try {
					const data = JSON.parse(e.data);
					if (data.type === 'connected') return;

					this.latestEvent = data;
					if (data.type === 'created') {
						this.hasNewListings = true;
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
		this.isConnected = false;
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
						this.hasNewListings = true;
					}
					this.lastETag = etag;
				}
			} catch {}
		}, 12000);
	}

	markSeen() {
		this.hasNewListings = false;
	}

	destroy() {
		this.disconnectSSE();
		if (this.pollInterval) {
			clearInterval(this.pollInterval);
			this.pollInterval = null;
		}
	}
}

export const realtime = new RealtimeManager();
