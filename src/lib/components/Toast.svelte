<script lang="ts">
	import { toast } from '$lib/toast';
	import { CheckCircle2, AlertCircle, Info, X } from 'lucide-svelte';
</script>

{#if $toast.length > 0}
	<div
		class="fixed right-4 bottom-4 z-50 flex max-w-sm flex-col gap-2 pointer-events-none"
		aria-live="polite"
	>
		{#each $toast as msg (msg.id)}
			<div
				class="pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 shadow-2xl backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 {msg.type === 'success'
					? 'border-emerald-500/30 bg-zinc-900/95 text-emerald-300'
					: msg.type === 'error'
						? 'border-red-500/30 bg-zinc-900/95 text-red-300'
						: 'border-zinc-700 bg-zinc-900/95 text-zinc-200'}"
				role="alert"
			>
				<div class="mt-0.5 shrink-0">
					{#if msg.type === 'success'}
						<CheckCircle2 class="h-4 w-4 text-emerald-400" />
					{:else if msg.type === 'error'}
						<AlertCircle class="h-4 w-4 text-red-400" />
					{:else}
						<Info class="h-4 w-4 text-zinc-400" />
					{/if}
				</div>
				<p class="flex-1 text-xs font-medium leading-relaxed">{msg.message}</p>
				<button
					type="button"
					onclick={() => toast.remove(msg.id)}
					class="shrink-0 text-zinc-400 hover:text-zinc-200"
					aria-label="Close notification"
				>
					<X class="h-3.5 w-3.5" />
				</button>
			</div>
		{/each}
	</div>
{/if}

