export interface ListingEvent {
	type: 'created' | 'updated' | 'sold' | 'deleted';
	listingId: string;
	title?: string;
	timestamp: number;
}

type EventListener = (event: ListingEvent) => void;

class EventBus {
	private listeners = new Set<EventListener>();
	private latestEvent: ListingEvent | null = null;
	private eventCounter = 0;

	subscribe(listener: EventListener): () => void {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	}

	broadcast(event: Omit<ListingEvent, 'timestamp'>): void {
		this.eventCounter += 1;
		const fullEvent: ListingEvent = {
			...event,
			timestamp: Date.now()
		};
		this.latestEvent = fullEvent;

		for (const listener of this.listeners) {
			try {
				listener(fullEvent);
			} catch (err) {
				console.error('Error broadcasting to listener:', err);
			}
		}
	}

	getLatest(): { event: ListingEvent | null; counter: number } {
		return {
			event: this.latestEvent,
			counter: this.eventCounter
		};
	}
}

export const eventBus = new EventBus();
