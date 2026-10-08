<script lang="ts">
	import ListingGrid from '$lib/components/ListingGrid.svelte';
	import { Heart, ShoppingBag } from 'lucide-svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Saved Items — Campus Marketplace</title>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<!-- Page Header -->
	<div class="mb-8">
		<div class="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400 mb-2">
			<Heart class="h-3.5 w-3.5 fill-red-400" />
			<span>Wishlist</span>
		</div>
		<h1 class="text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
			Saved Items
		</h1>
		<p class="mt-1 text-xs text-zinc-400">
			Keep track of items you are interested in buying on campus.
		</p>
	</div>

	<!-- Listings Grid -->
	<ListingGrid
		listings={data.listings}
		emptyTitle="No saved items yet"
		emptyDescription="Click the heart icon on any listing card to save items to your wishlist for quick access."
		emptyActionText="Browse Marketplace"
		emptyActionHref="/"
	/>
</div>
