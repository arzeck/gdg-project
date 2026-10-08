<script lang="ts">
	import type { ListingWithSeller } from '$lib/server/listings';
	import StatusBadge from './StatusBadge.svelte';
	import { MapPin, Heart, Calendar } from 'lucide-svelte';

	let {
		listing,
		showOwnerControls = false,
		ontogglefav
	}: {
		listing: ListingWithSeller;
		showOwnerControls?: boolean;
		ontogglefav?: (id: string, currentlyFav: boolean) => void;
	} = $props();

	const isSold = $derived(listing.status === 'sold');
	let isFavourite = $state(Boolean(listing.isFavourite));
	let favLoading = $state(false);

	function formatPrice(val: number): string {
		return new Intl.NumberFormat('en-IN', {
			style: 'currency',
			currency: 'INR',
			maximumFractionDigits: 0
		}).format(val);
	}

	function formatDate(date: string | Date): string {
		const d = new Date(date);
		return d.toLocaleDateString('en-IN', {
			month: 'short',
			day: 'numeric'
		});
	}

	async function handleFavClick(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();

		const prev = isFavourite;
		isFavourite = !prev; // Optimistic toggle

		if (ontogglefav) {
			ontogglefav(listing.id, prev);
		} else {
			// Built-in API toggle fallback
			favLoading = true;
			try {
				const res = await fetch(`/api/favourites/${listing.id}`, {
					method: isFavourite ? 'POST' : 'DELETE'
				});
				if (!res.ok) {
					isFavourite = prev; // Revert on error
				}
			} catch {
				isFavourite = prev;
			} finally {
				favLoading = false;
			}
		}
	}
</script>

<div
	class="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-3 transition-all duration-200 hover:-translate-y-1 hover:border-zinc-700 hover:bg-zinc-900/80 hover:shadow-xl hover:shadow-black/60 {isSold
		? 'opacity-85'
		: ''}"
>
	<!-- Image Container -->
	<a href="/listings/{listing.id}" class="relative block aspect-4/3 w-full overflow-hidden rounded-xl bg-zinc-950">
		<img
			src={listing.imageUrl}
			alt={listing.title}
			loading="lazy"
			class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 {isSold
				? 'opacity-40 grayscale-40'
				: ''}"
		/>

		<!-- SOLD Overlay -->
		{#if isSold}
			<div class="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
				<span class="rounded-xl border border-zinc-700 bg-zinc-950/90 px-3.5 py-1 text-xs font-bold tracking-wider text-zinc-300 uppercase shadow-lg">
					SOLD
				</span>
			</div>
		{/if}

		<!-- Category Tag -->
		<div class="absolute top-2.5 left-2.5">
			<span class="rounded-lg border border-zinc-800/90 bg-zinc-950/80 px-2 py-0.5 text-[10px] font-medium tracking-wide text-zinc-300 backdrop-blur-md">
				{listing.category}
			</span>
		</div>

		<!-- Favourite Button -->
		<button
			type="button"
			onclick={handleFavClick}
			disabled={favLoading}
			class="absolute top-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800/80 bg-zinc-950/80 text-zinc-400 backdrop-blur-md transition-all hover:scale-110 hover:border-red-500/50 hover:text-red-400 focus:outline-none"
			aria-label={isFavourite ? 'Remove from favourites' : 'Save to favourites'}
		>
			<Heart
				class="h-3.5 w-3.5 {isFavourite
					? 'fill-red-500 text-red-500'
					: 'text-zinc-400'}"
			/>
		</button>
	</a>

	<!-- Card Body -->
	<div class="mt-3 flex flex-1 flex-col justify-between">
		<div>
			<!-- Price & Status -->
			<div class="flex items-center justify-between gap-2">
				<span class="text-base font-bold text-emerald-400 tracking-tight">
					{formatPrice(listing.price)}
				</span>
				<StatusBadge status={listing.status} />
			</div>

			<!-- Title -->
			<a href="/listings/{listing.id}" class="mt-1.5 block">
				<h3 class="line-clamp-1 text-sm font-semibold text-zinc-100 transition-colors group-hover:text-emerald-300">
					{listing.title}
				</h3>
			</a>

			<!-- Location if provided -->
			{#if listing.location}
				<div class="mt-1 flex items-center gap-1 text-[11px] text-zinc-400">
					<MapPin class="h-3 w-3 shrink-0 text-zinc-500" />
					<span class="truncate">{listing.location}</span>
				</div>
			{/if}
		</div>

		<!-- Card Footer: Seller & Date -->
		<div class="mt-3.5 flex items-center justify-between border-t border-zinc-800/60 pt-2.5 text-[11px] text-zinc-500">
			<span class="truncate font-medium text-zinc-400">{listing.seller.name}</span>
			<span class="shrink-0">{formatDate(listing.createdAt)}</span>
		</div>
	</div>
</div>
