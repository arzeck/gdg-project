<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { listingCategories } from '$lib/validation';
	import { Search, X, SlidersHorizontal, ArrowUpDown, MapPin, IndianRupee } from 'lucide-svelte';

	let searchInput = $state(page.url.searchParams.get('q') || '');
	let locationInput = $state(page.url.searchParams.get('location') || '');
	let minPriceInput = $state(page.url.searchParams.get('minPrice') || '');
	let maxPriceInput = $state(page.url.searchParams.get('maxPrice') || '');
	let selectedCategory = $state(page.url.searchParams.get('category') || 'all');
	let selectedSort = $state(page.url.searchParams.get('sort') || 'newest');
	let showSold = $state(page.url.searchParams.get('showSold') === 'true');
	let showAdvanced = $state(false);

	let debounceTimer: ReturnType<typeof setTimeout>;

	function applyFilters(updates: Record<string, string | null | undefined>) {
		const params = new URLSearchParams(page.url.searchParams.toString());

		for (const [key, val] of Object.entries(updates)) {
			if (val === null || val === undefined || val === '' || val === 'all') {
				params.delete(key);
			} else {
				params.set(key, val);
			}
		}

		// Reset to page 1 on filter changes
		if (!('page' in updates)) {
			params.delete('page');
		}

		goto(`?${params.toString()}`, {
			reset: false,
			replace: true
		});
	}

	function handleSearchInput() {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			applyFilters({ q: searchInput });
		}, 300);
	}

	function handleLocationInput() {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			applyFilters({ location: locationInput });
		}, 300);
	}

	function handlePriceChange() {
		applyFilters({
			minPrice: minPriceInput || null,
			maxPrice: maxPriceInput || null
		});
	}

	function selectCat(cat: string) {
		selectedCategory = cat;
		applyFilters({ category: cat === 'all' ? null : cat });
	}

	function clearAllFilters() {
		searchInput = '';
		locationInput = '';
		minPriceInput = '';
		maxPriceInput = '';
		selectedCategory = 'all';
		selectedSort = 'newest';
		showSold = false;
		goto('/', { reset: false, replace: true });
	}

	const hasActiveFilters = $derived(
		Boolean(
			searchInput ||
				locationInput ||
				minPriceInput ||
				maxPriceInput ||
				(selectedCategory && selectedCategory !== 'all') ||
				(selectedSort && selectedSort !== 'newest') ||
				showSold
		)
	);
</script>

<div class="mb-8 space-y-4">
	<!-- Primary Search & Sort Bar -->
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
		<!-- Search Input (Debounced) -->
		<div class="relative flex-1">
			<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
				<Search class="h-4 w-4" />
			</div>
			<input
				type="text"
				bind:value={searchInput}
				oninput={handleSearchInput}
				placeholder="Search titles or descriptions (e.g. cycle, clrs, chair)..."
				class="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 py-2.5 pr-10 pl-10 text-xs text-zinc-100 placeholder-zinc-500 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
			/>
			{#if searchInput}
				<button
					type="button"
					onclick={() => {
						searchInput = '';
						applyFilters({ q: null });
					}}
					class="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-zinc-300"
					aria-label="Clear search"
				>
					<X class="h-3.5 w-3.5" />
				</button>
			{/if}
		</div>

		<!-- Sort Dropdown -->
		<div class="flex items-center gap-2">
			<div class="relative min-w-[170px]">
				<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
					<ArrowUpDown class="h-3.5 w-3.5" />
				</div>
				<select
					bind:value={selectedSort}
					onchange={() => applyFilters({ sort: selectedSort })}
					class="w-full appearance-none rounded-xl border border-zinc-800 bg-zinc-900/80 py-2.5 pr-8 pl-9 text-xs text-zinc-200 transition-colors focus:border-emerald-500 focus:outline-none"
				>
					<option value="newest">Newest First</option>
					<option value="price_asc">Price: Low to High</option>
					<option value="price_desc">Price: High to Low</option>
				</select>
			</div>

			<!-- Toggle Advanced Filters Button -->
			<button
				type="button"
				onclick={() => (showAdvanced = !showAdvanced)}
				class="flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-medium transition-colors {showAdvanced ||
				minPriceInput ||
				maxPriceInput ||
				locationInput ||
				showSold
					? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
					: 'border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'}"
				aria-expanded={showAdvanced}
			>
				<SlidersHorizontal class="h-3.5 w-3.5" />
				<span>Filters</span>
			</button>

			{#if hasActiveFilters}
				<button
					type="button"
					onclick={clearAllFilters}
					class="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-red-400 transition-colors"
					title="Clear all active filters"
				>
					<X class="h-3.5 w-3.5" />
					<span class="hidden sm:inline">Reset</span>
				</button>
			{/if}
		</div>
	</div>

	<!-- Category Pills -->
	<div class="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1">
		<button
			type="button"
			onclick={() => selectCat('all')}
			class="shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors {selectedCategory ===
			'all'
				? 'bg-emerald-500 text-zinc-950 font-semibold shadow-sm shadow-emerald-950/40'
				: 'border border-zinc-800 bg-zinc-900/70 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'}"
		>
			All Categories
		</button>
		{#each listingCategories as cat}
			<button
				type="button"
				onclick={() => selectCat(cat)}
				class="shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors {selectedCategory ===
				cat
					? 'bg-emerald-500 text-zinc-950 font-semibold shadow-sm shadow-emerald-950/40'
					: 'border border-zinc-800 bg-zinc-900/70 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'}"
			>
				{cat}
			</button>
		{/each}
	</div>

	<!-- Collapsible Filter Drawer: Price range, Location, Show Sold -->
	{#if showAdvanced}
		<div class="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 animate-in fade-in slide-in-from-top-2">
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<!-- Price Range -->
				<div>
					<label class="block text-[11px] font-medium uppercase tracking-wider text-zinc-400 mb-1.5">
						Price Range (₹)
					</label>
					<div class="flex items-center gap-2">
						<div class="relative flex-1">
							<span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-zinc-500 text-xs">₹</span>
							<input
								type="number"
								min="0"
								bind:value={minPriceInput}
								onchange={handlePriceChange}
								placeholder="Min"
								class="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 py-2 pr-2.5 pl-6 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
							/>
						</div>
						<span class="text-zinc-600 text-xs">to</span>
						<div class="relative flex-1">
							<span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-zinc-500 text-xs">₹</span>
							<input
								type="number"
								min="0"
								bind:value={maxPriceInput}
								onchange={handlePriceChange}
								placeholder="Max"
								class="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 py-2 pr-2.5 pl-6 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
							/>
						</div>
					</div>
				</div>

				<!-- Campus Location Filter -->
				<div>
					<label class="block text-[11px] font-medium uppercase tracking-wider text-zinc-400 mb-1.5">
						Campus Area / Hostel
					</label>
					<div class="relative">
						<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
							<MapPin class="h-3.5 w-3.5" />
						</div>
						<input
							type="text"
							bind:value={locationInput}
							oninput={handleLocationInput}
							placeholder="e.g. Hostel 7, Library..."
							class="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 py-2 pr-3 pl-8 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
						/>
					</div>
				</div>

				<!-- Show Sold Toggle -->
				<div class="flex items-end pb-1">
					<label class="flex cursor-pointer items-center gap-2.5">
						<input
							type="checkbox"
							bind:checked={showSold}
							onchange={() => applyFilters({ showSold: showSold ? 'true' : null })}
							class="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-400"
						/>
						<span class="text-xs font-medium text-zinc-300">
							Include sold items
						</span>
					</label>
				</div>
			</div>
		</div>
	{/if}
</div>
