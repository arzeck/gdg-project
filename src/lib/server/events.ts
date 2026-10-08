export interface ListingEvent {
	type: 'created' | 'updated' | 'sold' | 'deleted';
	listingId: string;
	title?: string;
	timestamp: number;
}

type EventListener = (event: ListingEvent) => void;

class EventBus {
	private listeners = new Set<EventListener>();

	subscribe(listener: EventListener): () => void {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	}

	broadcast(event: Omit<ListingEvent, 'timestamp'>): void {
		const fullEvent: ListingEvent = {
			...event,
			timestamp: Date.now()
		};

		for (const listener of this.listeners) {
			try {
				listener(fullEvent);
			} catch (err) {
				console.error('Error broadcasting to listener:', err);
			}
		}
	}
}

export const eventBus = new EventBus();
