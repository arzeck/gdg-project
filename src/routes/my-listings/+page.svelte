<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import { toast } from '$lib/toast';
	import {
		PlusCircle,
		Edit3,
		Trash2,
		CheckCircle,
		RotateCcw,
		Layers,
		MapPin,
		Calendar
	} from 'lucide-svelte';

	let { data } = $props();

	let activeTab = $state<'all' | 'available' | 'sold'>('all');

	// Confirm dialog state
	let deleteModalOpen = $state(false);
	let targetListing = $state<{ id: string; title: string } | null>(null);
	let isDeleting = $state(false);
	let deleteForm: HTMLFormElement;

	const filteredListings = $derived(
		data.listings.filter((item) => {
			if (activeTab === 'available') return item.status === 'available';
			if (activeTab === 'sold') return item.status === 'sold';
			return true;
		})
	);

	function formatPrice(val: number): string {
		return new Intl.NumberFormat('en-IN', {
			style: 'currency',
			currency: 'INR',
			maximumFractionDigits: 0
		}).format(val);
	}

	function formatDate(date: string | Date): string {
		return new Date(date).toLocaleDateString('en-IN', {
			month: 'short',
			day: 'numeric'
		});
	}

	function confirmDelete(id: string, title: string) {
		targetListing = { id, title };
		deleteModalOpen = true;
	}
</script>

<svelte:head>
	<title>My Listings — Campus Marketplace</title>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<!-- Page Header -->
	<div class="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<div class="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 mb-2">
				<Layers class="h-3.5 w-3.5" />
				<span>Seller Dashboard</span>
			</div>
			<h1 class="text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
				My Listings
			</h1>
			<p class="mt-1 text-xs text-zinc-400">
				Manage your posted items, update availability, or edit pricing.
			</p>
		</div>

		<div>
			<a
				href="/listings/new"
				class="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-zinc-950 shadow-md shadow-emerald-950/40 transition-all hover:bg-emerald-400"
			>
				<PlusCircle class="h-4 w-4" />
				<span>Post New Item</span>
			</a>
		</div>
	</div>

	<!-- Filter Tabs: All, Available, Sold -->
	<div class="mb-6 flex items-center gap-2 border-b border-zinc-800 pb-3">
		<button
			type="button"
			onclick={() => (activeTab = 'all')}
			class="rounded-xl px-3.5 py-1.5 text-xs font-medium transition-colors {activeTab ===
			'all'
				? 'bg-zinc-800 text-zinc-100 font-semibold'
				: 'text-zinc-400 hover:text-zinc-200'}"
		>
			All ({data.listings.length})
		</button>
		<button
			type="button"
			onclick={() => (activeTab = 'available')}
			class="rounded-xl px-3.5 py-1.5 text-xs font-medium transition-colors {activeTab ===
			'available'
				? 'bg-zinc-800 text-emerald-400 font-semibold'
				: 'text-zinc-400 hover:text-zinc-200'}"
		>
			Available ({data.listings.filter((l) => l.status === 'available').length})
		</button>
		<button
			type="button"
			onclick={() => (activeTab = 'sold')}
			class="rounded-xl px-3.5 py-1.5 text-xs font-medium transition-colors {activeTab ===
			'sold'
				? 'bg-zinc-800 text-zinc-100 font-semibold'
				: 'text-zinc-400 hover:text-zinc-200'}"
		>
			Sold ({data.listings.filter((l) => l.status === 'sold').length})
		</button>
	</div>

	<!-- Listings List / Grid -->
	{#if filteredListings.length > 0}
		<div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each filteredListings as item (item.id)}
				{@const isSold = item.status === 'sold'}
				<div class="flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3 transition-colors hover:border-zinc-700">
					<!-- Top Image & Badges -->
					<div>
						<a href="/listings/{item.id}" class="relative block aspect-4/3 w-full overflow-hidden rounded-xl bg-zinc-950">
							<img
								src={item.imageUrl}
								alt={item.title}
								class="h-full w-full object-cover {isSold ? 'opacity-40 grayscale-40' : ''}"
							/>
							{#if isSold}
								<div class="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
									<span class="rounded-xl border border-zinc-700 bg-zinc-950/90 px-3 py-1 text-xs font-bold tracking-wider text-zinc-300 uppercase shadow-lg">
										SOLD
									</span>
								</div>
							{/if}
							<div class="absolute top-2.5 left-2.5">
								<span class="rounded-lg border border-zinc-800 bg-zinc-950/80 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
									{item.category}
								</span>
							</div>
						</a>

						<div class="mt-3">
							<div class="flex items-center justify-between gap-2">
								<span class="text-base font-bold text-emerald-400 tracking-tight">
									{formatPrice(item.price)}
								</span>
								<StatusBadge status={item.status} />
							</div>

							<a href="/listings/{item.id}" class="mt-1 block">
								<h3 class="line-clamp-1 text-sm font-semibold text-zinc-100 hover:text-emerald-300 transition-colors">
									{item.title}
								</h3>
							</a>

							{#if item.location}
								<div class="mt-1 flex items-center gap-1 text-[11px] text-zinc-400">
									<MapPin class="h-3 w-3 shrink-0 text-zinc-500" />
									<span class="truncate">{item.location}</span>
								</div>
							{/if}
						</div>
					</div>

					<!-- Card Quick Action Buttons -->
					<div class="mt-4 border-t border-zinc-800/80 pt-3">
						<div class="flex items-center gap-1.5">
							<!-- Edit Button -->
							<a
								href="/listings/{item.id}/edit"
								class="flex-1 flex items-center justify-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
							>
								<Edit3 class="h-3.5 w-3.5 text-zinc-400" />
								<span>Edit</span>
							</a>

							<!-- Quick Toggle Sold Form with use:enhance -->
							<form
								method="POST"
								action="?/toggleSold"
								use:enhance={() => {
									return async ({ result, update }) => {
										if (result.type === 'success') {
											toast.success(result.data?.message || 'Status updated');
											await invalidateAll();
										}
										await update();
									};
								}}
								class="flex-1"
							>
								<input type="hidden" name="id" value={item.id} />
								<button
									type="submit"
									class="w-full flex items-center justify-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
								>
									{#if isSold}
										<RotateCcw class="h-3.5 w-3.5 text-emerald-400" />
										<span>Available</span>
									{:else}
										<CheckCircle class="h-3.5 w-3.5 text-amber-400" />
										<span>Sold</span>
									{/if}
								</button>
							</form>

							<!-- Delete Trigger Button -->
							<button
								type="button"
								onclick={() => confirmDelete(item.id, item.title)}
								class="flex h-8 w-8 items-center justify-center rounded-xl border border-red-500/20 bg-red-950/20 text-red-400 hover:bg-red-950/40 transition-colors"
								aria-label="Delete listing"
							>
								<Trash2 class="h-3.5 w-3.5" />
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<EmptyState
			title={activeTab === 'all'
				? "You haven't posted any listings yet"
				: activeTab === 'available'
					? 'No active available listings'
					: 'No sold listings yet'}
			description={activeTab === 'all'
				? 'Declutter your hostel or room and make money by selling to fellow students.'
				: 'Switch tabs or create a new listing to share items with classmates.'}
			actionText="Post an Item"
			actionHref="/listings/new"
		/>
	{/if}
</div>

<!-- Hidden Delete Form -->
<form
	bind:this={deleteForm}
	method="POST"
	action="?/delete"
	use:enhance={() => {
		isDeleting = true;
		return async ({ result, update }) => {
			isDeleting = false;
			deleteModalOpen = false;
			if (result.type === 'success') {
				toast.success('Listing deleted successfully');
				await invalidateAll();
			}
			await update();
		};
	}}
	class="hidden"
>
	<input type="hidden" name="id" value={targetListing?.id || ''} />
</form>

<!-- Confirm Delete Dialog -->
<ConfirmDialog
	open={deleteModalOpen}
	title="Delete listing?"
	message="Are you sure you want to delete '{targetListing?.title}'? This action is permanent and deletes the item and image."
	confirmText="Yes, delete listing"
	cancelText="Cancel"
	danger={true}
	loading={isDeleting}
	onconfirm={() => deleteForm?.requestSubmit()}
	oncancel={() => {
		deleteModalOpen = false;
		targetListing = null;
	}}
/>
