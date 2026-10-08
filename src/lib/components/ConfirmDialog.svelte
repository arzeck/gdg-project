<script lang="ts">
	import { AlertTriangle, Loader2 } from 'lucide-svelte';

	let {
		open = false,
		title = 'Are you sure?',
		message = 'This action cannot be undone.',
		confirmText = 'Confirm',
		cancelText = 'Cancel',
		danger = true,
		loading = false,
		onconfirm,
		oncancel
	}: {
		open: boolean;
		title?: string;
		message?: string;
		confirmText?: string;
		cancelText?: string;
		danger?: boolean;
		loading?: boolean;
		onconfirm: () => void;
		oncancel: () => void;
	} = $props();

	let dialog: HTMLDialogElement | undefined = $state();

	$effect(() => {
		if (open) {
			dialog?.showModal();
		} else {
			dialog?.close();
		}
	});
</script>

<dialog
	bind:this={dialog}
	onclose={oncancel}
	class="fixed inset-0 z-50 m-auto w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-100 shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm"
>
	<div class="flex items-start gap-4">
		<div
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl {danger
				? 'border border-red-500/20 bg-red-500/10 text-red-400'
				: 'border border-amber-500/20 bg-amber-500/10 text-amber-400'}"
		>
			<AlertTriangle class="h-5 w-5" />
		</div>
		<div>
			<h3 class="text-base font-semibold text-zinc-100">
				{title}
			</h3>
			<p class="mt-1.5 text-xs leading-relaxed text-zinc-400">
				{message}
			</p>
		</div>
	</div>

	<div class="mt-6 flex items-center justify-end gap-3">
		<button
			type="button"
			onclick={oncancel}
			disabled={loading}
			class="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus:outline-none disabled:opacity-50"
		>
			{cancelText}
		</button>
		<button
			type="button"
			onclick={onconfirm}
			disabled={loading}
			class="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold shadow-sm transition-all focus:outline-none disabled:opacity-50 {danger
				? 'bg-red-500 text-white hover:bg-red-600 focus:ring-2 focus:ring-red-400'
				: 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400 focus:ring-2 focus:ring-emerald-400'}"
		>
			{#if loading}
				<Loader2 class="h-3.5 w-3.5 animate-spin" />
			{/if}
			<span>{confirmText}</span>
		</button>
	</div>
</dialog>

