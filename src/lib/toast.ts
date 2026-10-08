import { writable } from 'svelte/store';

export interface ToastMessage {
	id: string;
	type: 'success' | 'error' | 'info';
	message: string;
}

const store = writable<ToastMessage[]>([]);

export const toast = {
	subscribe: store.subscribe,

	add(message: string, type: 'success' | 'error' | 'info' = 'info', durationMs = 4000) {
		const id = Math.random().toString(36).substring(2, 9);
		store.update((messages) => [...messages, { id, type, message }]);

		setTimeout(() => {
			this.remove(id);
		}, durationMs);
	},

	success(message: string, durationMs?: number) {
		this.add(message, 'success', durationMs);
	},

	error(message: string, durationMs?: number) {
		this.add(message, 'error', durationMs);
	},

	info(message: string, durationMs?: number) {
		this.add(message, 'info', durationMs);
	},

	remove(id: string) {
		store.update((messages) => messages.filter((m) => m.id !== id));
	}
};
