export interface ToastMessage {
	id: string;
	type: 'success' | 'error' | 'info';
	message: string;
}

class ToastManager {
	messages = $state<ToastMessage[]>([]);

	add(message: string, type: 'success' | 'error' | 'info' = 'info', durationMs = 4000) {
		const id = Math.random().toString(36).substring(2, 9);
		this.messages.push({ id, type, message });

		setTimeout(() => {
			this.remove(id);
		}, durationMs);
	}

	success(message: string, durationMs?: number) {
		this.add(message, 'success', durationMs);
	}

	error(message: string, durationMs?: number) {
		this.add(message, 'error', durationMs);
	}

	info(message: string, durationMs?: number) {
		this.add(message, 'info', durationMs);
	}

	remove(id: string) {
		this.messages = this.messages.filter((m) => m.id !== id);
	}
}

export const toast = new ToastManager();
