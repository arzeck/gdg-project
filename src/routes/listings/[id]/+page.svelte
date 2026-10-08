<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import { toast } from '$lib/toast';
	import {
		ArrowLeft,
		MapPin,
		Calendar,
		Clock,
		Mail,
		Heart,
		Edit3,
		CheckCircle,
		RotateCcw,
		Trash2,
		ShieldCheck,
		Share2
	} from 'lucide-svelte';
	import { formatPrice } from '$lib/validation';

	let { data } = $props();

	const listing = $derived(data.listing);
	const isOwner = $derived(data.isOwner);
	const isSold = $derived(listing.status === 'sold');

	let deleteModalOpen = $state(false);
	let isDeleting = $state(false);
	let deleteForm = $state<HTMLFormElement>();

	let localFav = $state<boolean | null>(null);
	const isFavourite = $derived(localFav !== null ? localFav : Boolean(listing.isFavourite));
	let favLoading = $state(false);

	function formatDate(date: string | Date): string {
		return new Date(date).toLocaleDateString('en-IN', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	async function handleFavToggle() {
		const prev = isFavourite;
		localFav = !prev; // Optimistic
		favLoading = true;

		try {
			const res = await fetch(`/api/favourites/${listing.id}`, {
				method: localFav ? 'POST' : 'DELETE'
			});
			if (!res.ok) {
				localFav = prev;
				toast.error('Could not update favourite status');
			} else {
				toast.success(localFav ? 'Added to favourites' : 'Removed from favourites');
			}
		} catch {
			localFav = prev;
			toast.error('Network error');
		} finally {
			favLoading = false;
		}
	}

	function shareListing() {
		if (navigator.share) {
			navigator.share({
				title: listing.title,
				text: `Check out ${listing.title} on Campus Marketplace for ${formatPrice(listing.price)}`,
				url: window.location.href
			}).catch(() => {});
		} else {
			navigator.clipboard.writeText(window.location.href);
			toast.success('Link copied to clipboard!');
		}
	}
</script>

<svelte:head>
	<title>{listing.title} — Campus Marketplace</title>
	<meta name="description" content="{listing.description.slice(0, 150)}..." />
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
	<!-- Navigation Breadcrumb -->
	<div class="mb-6 flex items-center justify-between">
		<a
			href="/"
			class="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
		>
			<ArrowLeft class="h-3.5 w-3.5" />
			<span>Back to listings</span>
		</a>

		<div class="flex items-center gap-2">
			<button
				type="button"
				onclick={shareListing}
				class="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 transition-colors"
				aria-label="Share listing"
			>
				<Share2 class="h-3.5 w-3.5" />
			</button>

			<button
				type="button"
				onclick={handleFavToggle}
				disabled={favLoading}
				class="flex h-8 items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-xs font-medium transition-colors hover:border-zinc-700 {isFavourite
					? 'text-red-400'
					: 'text-zinc-400'}"
				aria-label={isFavourite ? 'Saved in favourites' : 'Save to favourites'}
			>
				<Heart class="h-3.5 w-3.5 {isFavourite ? 'fill-red-500 text-red-500' : ''}" />
				<span class="hidden sm:inline">{isFavourite ? 'Saved' : 'Save'}</span>
			</button>
		</div>
	</div>

	<!-- Main Details Grid -->
	<div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
		<!-- Left Column: Item Image & Sold Notice (7 cols) -->
		<div class="lg:col-span-7">
			<div class="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950 p-2 shadow-2xl">
				<div class="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-zinc-900">
					<img
						src={listing.imageUrl}
						alt={listing.title}
						class="h-full w-full object-cover transition-all {isSold
							? 'opacity-40 grayscale-40'
							: ''}"
					/>

					{#if isSold}
						<div class="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[3px]">
							<span class="rounded-2xl border border-zinc-700 bg-zinc-950/95 px-6 py-2 text-base font-bold tracking-widest text-zinc-200 uppercase shadow-2xl">
								ITEM SOLD
							</span>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Right Column: Info & Action Controls (5 cols) -->
		<div class="flex flex-col justify-between space-y-6 lg:col-span-5">
			<div class="space-y-5">
				<!-- Category & Status Badge -->
				<div class="flex items-center justify-between gap-3">
					<span class="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs font-medium text-emerald-400">
						{listing.category}
					</span>
					<StatusBadge status={listing.status} size="md" />
				</div>

				<!-- Title -->
				<h1 class="text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
					{listing.title}
				</h1>

				<!-- Price -->
				<div class="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4">
					<p class="text-xs uppercase tracking-wider text-zinc-500 font-medium">Asking Price</p>
					<p class="mt-1 text-3xl font-extrabold text-emerald-400 tracking-tight">
						{formatPrice(listing.price)}
					</p>
				</div>

				<!-- Meta Badges: Location, Posted Date -->
				<div class="flex flex-wrap gap-2 text-xs text-zinc-400">
					{#if listing.location}
						<div class="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-1.5">
							<MapPin class="h-3.5 w-3.5 text-emerald-400" />
							<span>{listing.location}</span>
						</div>
					{/if}
					<div class="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-1.5">
						<Calendar class="h-3.5 w-3.5 text-zinc-500" />
						<span>Posted {formatDate(listing.createdAt)}</span>
					</div>
				</div>

				<!-- Description -->
				<div>
					<h3 class="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
						Description
					</h3>
					<div class="rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-4 text-xs leading-relaxed text-zinc-300 whitespace-pre-line">
						{listing.description}
					</div>
				</div>

				<!-- Seller Profile Card -->
				<div class="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
					<div class="flex items-center gap-3">
						<div class="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-sm">
							{listing.seller.name.charAt(0).toUpperCase()}
						</div>
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-1.5">
								<p class="text-xs font-semibold text-zinc-200 truncate">{listing.seller.name}</p>
								<span title="Verified Campus Student" class="inline-flex shrink-0">
									<ShieldCheck class="h-3.5 w-3.5 text-emerald-400" />
								</span>
							</div>
							<p class="text-[11px] text-zinc-500 truncate">{listing.seller.email}</p>
						</div>
					</div>

					<!-- Contact Button -->
					<div class="mt-4">
						{#if isSold}
							<button
								type="button"
								disabled
								class="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 text-xs font-medium text-zinc-500 cursor-not-allowed"
							>
								<Mail class="h-4 w-4" />
								<span>Item Sold — Contact Disabled</span>
							</button>
						{:else}
							<a
								href="mailto:{listing.seller.email}?subject={encodeURIComponent(`Campus Exchange: Interested in '${listing.title}'`)}&body={encodeURIComponent(`Hi ${listing.seller.name},\n\nI saw your listing '${listing.title}' listed for ${formatPrice(listing.price)} on Campus Marketplace and would like to buy it.\n\nWhen and where on campus can we meet?`)}"
								class="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-xs font-bold text-zinc-950 shadow-md shadow-emerald-950/40 transition-all hover:bg-emerald-400"
							>
								<Mail class="h-4 w-4" />
								<span>Contact Seller via Email</span>
							</a>
						{/if}
					</div>
				</div>
			</div>

			<!-- Owner Controls (Strictly shown only for owner) -->
			{#if isOwner}
				<div class="rounded-2xl border border-emerald-500/30 bg-emerald-950/10 p-4">
					<div class="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-3">
						<ShieldCheck class="h-4 w-4" />
						<span>You Own This Listing</span>
					</div>

					<div class="flex flex-wrap items-center gap-2.5">
						<!-- Edit Listing Button -->
						<a
							href="/listings/{listing.id}/edit"
							class="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 py-2 text-xs font-medium text-zinc-200 transition-colors hover:border-zinc-700 hover:bg-zinc-800"
						>
							<Edit3 class="h-3.5 w-3.5 text-zinc-400" />
							<span>Edit Listing</span>
						</a>

						<!-- Toggle Sold Status Form -->
						<form
							method="POST"
							action="?/toggleSold"
							use:enhance={() => {
								return async ({ result, update }) => {
									if (result.type === 'success') {
										const msg = (result.data as { message?: string } | undefined)?.message;
										toast.success(msg || 'Status updated');
										await invalidateAll();
									}
									await update();
								};
							}}
							class="flex-1 min-w-[140px]"
						>
							<button
								type="submit"
								class="w-full flex items-center justify-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 py-2 text-xs font-medium text-zinc-200 transition-colors hover:border-zinc-700 hover:bg-zinc-800"
							>
								{#if isSold}
									<RotateCcw class="h-3.5 w-3.5 text-emerald-400" />
									<span>Mark Available</span>
								{:else}
									<CheckCircle class="h-3.5 w-3.5 text-amber-400" />
									<span>Mark as Sold</span>
								{/if}
							</button>
						</form>

						<!-- Delete Listing Trigger Button -->
						<button
							type="button"
							onclick={() => (deleteModalOpen = true)}
							class="flex items-center justify-center gap-1.5 rounded-xl border border-red-500/30 bg-red-950/20 px-3.5 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-950/40"
						>
							<Trash2 class="h-3.5 w-3.5" />
							<span>Delete</span>
						</button>
					</div>

					<!-- Hidden Delete Form submitted after confirmation -->
					<form
						bind:this={deleteForm}
						method="POST"
						action="?/delete"
						use:enhance={() => {
							isDeleting = true;
							return async ({ result, update }) => {
								isDeleting = false;
								deleteModalOpen = false;
								toast.success('Listing deleted successfully');
								await update();
							};
						}}
						class="hidden"
					></form>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Delete Confirmation Dialog -->
<ConfirmDialog
	open={deleteModalOpen}
	title="Delete this listing?"
	message="Are you sure you want to delete '{listing.title}'? This will permanently remove the listing and its image from Cloudinary."
	confirmText="Yes, delete listing"
	cancelText="Cancel"
	danger={true}
	loading={isDeleting}
	onconfirm={() => deleteForm?.requestSubmit()}
	oncancel={() => (deleteModalOpen = false)}
/>
