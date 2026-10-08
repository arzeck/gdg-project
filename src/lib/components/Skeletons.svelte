<script lang="ts">
	let { count = 8 }: { count?: number } = $props();
</script>

<div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
	{#each Array(count) as _, i (i)}
		<div class="flex flex-col overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-3 animate-pulse">
			<!-- Image skeleton -->
			<div class="aspect-4/3 w-full rounded-xl bg-zinc-800/60"></div>

			<!-- Content skeleton -->
			<div class="mt-3.5 space-y-2.5 px-1">
				<div class="flex items-center justify-between">
					<div class="h-4 w-1/3 rounded-lg bg-zinc-800/70"></div>
					<div class="h-3 w-16 rounded-full bg-zinc-800/50"></div>
				</div>
				<div class="h-4 w-4/5 rounded-lg bg-zinc-800/70"></div>
				<div class="flex items-center justify-between pt-1">
					<div class="h-3 w-20 rounded-md bg-zinc-800/50"></div>
					<div class="h-3 w-14 rounded-md bg-zinc-800/50"></div>
				</div>
			</div>
		</div>
	{/each}
</div>
