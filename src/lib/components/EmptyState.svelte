<script lang="ts">
	import type { Snippet } from 'svelte';
	import { PackageSearch } from 'lucide-svelte';

	let {
		title = 'No listings found',
		description = 'Try adjusting your search filters or check back later.',
		actionText,
		actionHref,
		onaction,
		icon
	}: {
		title?: string;
		description?: string;
		actionText?: string;
		actionHref?: string;
		onaction?: () => void;
		icon?: Snippet;
	} = $props();
</script>

<div class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 px-6 py-16 text-center">
	<div class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/60 text-zinc-400">
		{#if icon}
			{@render icon()}
		{:else}
			<PackageSearch class="h-7 w-7 text-zinc-500" />
		{/if}
	</div>

	<h3 class="text-base font-semibold text-zinc-200">{title}</h3>
	<p class="mt-1.5 max-w-sm text-xs leading-relaxed text-zinc-400">{description}</p>

	{#if actionText}
		<div class="mt-6">
			{#if actionHref}
				<a
					href={actionHref}
					class="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 shadow-sm transition-all hover:bg-emerald-400"
				>
					{actionText}
				</a>
			{:else if onaction}
				<button
					type="button"
					onclick={onaction}
					class="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-700"
				>
					{actionText}
				</button>
			{/if}
		</div>
	{/if}
</div>
