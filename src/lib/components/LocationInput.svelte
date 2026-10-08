<script lang="ts">
	import { MapPin, Loader2 } from 'lucide-svelte';

	let {
		value = $bindable(''),
		name = 'location',
		error = ''
	}: {
		value?: string;
		name?: string;
		error?: string;
	} = $props();

	let suggestions = $state<Array<{ name: string; display_name: string }>>([]);
	let loading = $state(false);
	let isOpen = $state(false);
	let debounceTimer: ReturnType<typeof setTimeout>;

	const commonCampusSpots = [
		'Hostel 1',
		'Hostel 7 Cycle Stand',
		'Hostel 12 Common Room',
		'Central Library Foyer',
		'Student Activity Center (SAC)',
		'Main Gate Cafe'
	];

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		value = target.value;

		clearTimeout(debounceTimer);
		if (value.trim().length < 2) {
			suggestions = [];
			isOpen = false;
			return;
		}

		debounceTimer = setTimeout(async () => {
			loading = true;
			try {
				const res = await fetch(`/api/locations?q=${encodeURIComponent(value.trim())}`);
				if (res.ok) {
					suggestions = await res.json();
					isOpen = suggestions.length > 0;
				}
			} catch {
				suggestions = [];
			} finally {
				loading = false;
			}
		}, 300);
	}

	function selectSpot(spot: string) {
		value = spot;
		isOpen = false;
		suggestions = [];
	}
</script>

<svelte:window onclick={(e) => {
	const target = e.target as HTMLElement | null;
	if (!target?.closest('#location-input-container')) {
		isOpen = false;
	}
}} />

<div id="location-input-container" class="relative">
	<label for="location" class="block text-xs font-medium uppercase tracking-wider text-zinc-400 mb-1.5">
		Campus Location / Hostel <span class="text-zinc-500 lowercase">(optional)</span>
	</label>

	<div class="relative">
		<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
			{#if loading}
				<Loader2 class="h-4 w-4 animate-spin text-emerald-400" />
			{:else}
				<MapPin class="h-4 w-4" />
			{/if}
		</div>

		<input
			id="location"
			{name}
			type="text"
			{value}
			oninput={handleInput}
			onfocus={() => {
				if (suggestions.length > 0) isOpen = true;
			}}
			placeholder="e.g. Hostel 7, Library, SAC..."
			autocomplete="off"
			class="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 py-2.5 pr-3.5 pl-10 text-sm text-zinc-100 placeholder-zinc-500 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
		/>
	</div>

	<!-- Quick Campus Spot Pills -->
	<div class="mt-2 flex flex-wrap items-center gap-1.5">
		<span class="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Popular spots:</span>
		{#each commonCampusSpots as spot}
			<button
				type="button"
				onclick={() => selectSpot(spot)}
				class="rounded-lg border border-zinc-800/80 bg-zinc-900/60 px-2 py-0.5 text-[11px] text-zinc-400 hover:border-emerald-500/40 hover:bg-zinc-800 hover:text-emerald-300 transition-colors"
			>
				{spot}
			</button>
		{/each}
	</div>

	<!-- Autocomplete Dropdown Suggestions -->
	{#if isOpen && suggestions.length > 0}
		<div class="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950/95 p-1 shadow-2xl backdrop-blur-md">
			{#each suggestions as item}
				<button
					type="button"
					onclick={() => selectSpot(item.name || item.display_name.split(',')[0])}
					class="flex w-full items-start gap-2 rounded-lg p-2 text-left text-xs text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 transition-colors"
				>
					<MapPin class="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
					<div class="min-w-0 flex-1">
						<p class="font-medium text-zinc-200 truncate">{item.name || item.display_name.split(',')[0]}</p>
						<p class="text-[10px] text-zinc-500 truncate">{item.display_name}</p>
					</div>
				</button>
			{/each}
		</div>
	{/if}

	{#if error}
		<p class="mt-1 text-xs text-red-400">{error}</p>
	{/if}
</div>
