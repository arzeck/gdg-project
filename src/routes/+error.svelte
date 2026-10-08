<script lang="ts">
	import { page } from '$app/state';
	import { AlertTriangle, Home, RefreshCw } from 'lucide-svelte';

	const status = $derived(page.status);
	const message = $derived(page.error?.message || 'An unexpected error occurred');
</script>

<svelte:head>
	<title>{status} — Campus Marketplace</title>
</svelte:head>

<div class="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-16">
	<div class="w-full max-w-md text-center">
		<!-- Error Icon -->
		<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
			<AlertTriangle class="h-8 w-8" />
		</div>

		<!-- Status Code & Message -->
		<span class="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 font-mono text-xs text-zinc-400">
			HTTP {status}
		</span>

		<h1 class="mt-4 text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
			{#if status === 404}
				Listing or Page Not Found
			{:else if status === 403}
				Access Forbidden
			{:else if status === 401}
				Authentication Required
			{:else}
				Something Went Wrong
			{/if}
		</h1>

		<p class="mt-2 text-xs leading-relaxed text-zinc-400">
			{message}
		</p>

		<!-- Actions -->
		<div class="mt-8 flex items-center justify-center gap-3">
			<button
				type="button"
				onclick={() => window.location.reload()}
				class="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100"
			>
				<RefreshCw class="h-3.5 w-3.5" />
				<span>Try Again</span>
			</button>

			<a
				href="/"
				class="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-zinc-950 shadow-md shadow-emerald-950/40 transition-all hover:bg-emerald-400"
			>
				<Home class="h-3.5 w-3.5" />
				<span>Return Home</span>
			</a>
		</div>
	</div>
</div>
