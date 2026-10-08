<script lang="ts">
	import { CheckCircle2, Check } from 'lucide-svelte';

	let { status, size = 'sm' }: { status: 'available' | 'sold'; size?: 'sm' | 'md' } = $props();
</script>

{#if status === 'available'}
	<span
		class="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 font-medium text-emerald-400 {size === 'md'
			? 'px-3 py-1 text-xs'
			: 'px-2.5 py-0.5 text-[11px]'}"
	>
		<span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
		Available
	</span>
{:else}
	<span
		class="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800/80 font-medium text-zinc-300 {size === 'md'
			? 'px-3 py-1 text-xs'
			: 'px-2.5 py-0.5 text-[11px]'}"
	>
		<Check class="h-3 w-3 text-zinc-400" />
		Sold
	</span>
{/if}
