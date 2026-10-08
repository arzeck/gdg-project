<script lang="ts">
	import { navigating } from '$app/state';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import ListingGrid from '$lib/components/ListingGrid.svelte';
	import Skeletons from '$lib/components/Skeletons.svelte';
	import { Sparkles, ChevronLeft, ChevronRight, PlusCircle } from 'lucide-svelte';

	let { data } = $props();

	const isNavigating = $derived(Boolean(navigating.to));

	function goToPage(newPage: number) {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('page', newPage.toString());
		goto(`?${params.toString()}`, { noScroll: false });
	}

	function resetFilters() {
		goto('/', { replaceState: true });
	}
</script>

<svelte:head>
	<title>Campus Marketplace — Buy & Sell On Campus</title>
	<meta
		name="description"
		content="The campus marketplace where students buy and sell textbooks, electronics, cycles, furniture and college gear."
	/>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<!-- Hero Section -->
	<section class="mb-10 text-center sm:text-left">
		<div class="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 mb-3">
			<Sparkles class="h-3.5 w-3.5" />
			<span>Peer-to-Peer Campus Marketplace</span>
		</div>
		<div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
			<div>
				<h1 class="text-3xl font-extrabold tracking-tight text-zinc-100 sm:text-4xl">
					Trade items with students on your campus
				</h1>
				<p class="mt-2 text-sm text-zinc-400 max-w-2xl leading-relaxed">
					Verified hostel and department exchange. Books, cycles, dorm furniture, electronics, and accessories.
				</p>
			</div>
			<div class="shrink-0">
				<a
					href="/listings/new"
					class="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-zinc-950 shadow-md shadow-emerald-950/40 transition-all hover:bg-emerald-400"
				>
					<PlusCircle class="h-4 w-4" />
					<span>Post an Item</span>
				</a>
			</div>
		</div>
	</section>

	<!-- Filter and Search Controls -->
	<FilterBar />

	<!-- Listing Results Header -->
	<div class="mb-5 flex items-center justify-between text-xs text-zinc-400">
		<p>
			Showing <span class="font-semibold text-zinc-200">{data.listings.length}</span> of{' '}
			<span class="font-semibold text-zinc-200">{data.total}</span> listings
		</p>
		{#if data.totalPages > 1}
			<p class="font-mono text-[11px] text-zinc-500">
				Page {data.page} of {data.totalPages}
			</p>
		{/if}
	</div>

	<!-- Listings Grid or Loading Skeleton -->
	{#if isNavigating}
		<Skeletons count={8} />
	{:else}
		<ListingGrid
			listings={data.listings}
			emptyTitle="No listings match your search"
			emptyDescription="Try clearing some filters or searching with a different keyword."
			emptyActionText="Reset All Filters"
			onemptyaction={resetFilters}
		/>
	{/if}

	<!-- Pagination Controls -->
	{#if data.totalPages > 1 && !isNavigating}
		<nav class="mt-12 flex items-center justify-center gap-3" aria-label="Pagination">
			<button
				type="button"
				disabled={data.page <= 1}
				onclick={() => goToPage(data.page - 1)}
				class="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3.5 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-800 disabled:opacity-40 disabled:hover:border-zinc-800"
			>
				<ChevronLeft class="h-4 w-4" />
				<span>Previous</span>
			</button>

			<div class="flex items-center gap-1">
				{#each Array(data.totalPages) as _, i (i)}
					{@const pageNum = i + 1}
					<button
						type="button"
						onclick={() => goToPage(pageNum)}
						class="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors {data.page ===
						pageNum
							? 'bg-emerald-500 text-zinc-950 font-bold'
							: 'border border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}"
					>
						{pageNum}
					</button>
				{/each}
			</div>

			<button
				type="button"
				disabled={data.page >= data.totalPages}
				onclick={() => goToPage(data.page + 1)}
				class="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3.5 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-800 disabled:opacity-40 disabled:hover:border-zinc-800"
			>
				<span>Next</span>
				<ChevronRight class="h-4 w-4" />
			</button>
		</nav>
	{/if}
</div>
