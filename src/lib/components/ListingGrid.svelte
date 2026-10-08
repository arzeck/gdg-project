<script lang="ts">
	import type { ListingWithSeller } from '$lib/server/listings';
	import ListingCard from './ListingCard.svelte';
	import EmptyState from './EmptyState.svelte';

	let {
		listings = [],
		emptyTitle = 'No items found',
		emptyDescription = 'Try adjusting your search criteria or filters.',
		emptyActionText,
		emptyActionHref,
		onemptyaction
	}: {
		listings: ListingWithSeller[];
		emptyTitle?: string;
		emptyDescription?: string;
		emptyActionText?: string;
		emptyActionHref?: string;
		onemptyaction?: () => void;
	} = $props();
</script>

{#if listings.length > 0}
	<div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
		{#each listings as listing (listing.id)}
			<ListingCard {listing} />
		{/each}
	</div>
{:else}
	<EmptyState
		title={emptyTitle}
		description={emptyDescription}
		actionText={emptyActionText}
		actionHref={emptyActionHref}
		onaction={onemptyaction}
	/>
{/if}
