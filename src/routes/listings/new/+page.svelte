<script lang="ts">
	import { enhance } from '$app/forms';
	import ImageUpload from '$lib/components/ImageUpload.svelte';
	import { listingCategories } from '$lib/validation';
	import { ArrowLeft, Loader2, PlusCircle, IndianRupee, MapPin } from 'lucide-svelte';

	let { form } = $props();

	let title = $state('');
	let description = $state('');
	let price = $state('');
	let category = $state('Books');
	let location = $state('');
	let isSubmitting = $state(false);

	$effect(() => {
		if (form?.values) {
			if (form.values.title && !title) title = form.values.title;
			if (form.values.description && !description) description = form.values.description;
			if (form.values.price && !price) price = form.values.price;
			if (form.values.category) category = form.values.category;
			if (form.values.location && !location) location = form.values.location;
		}
	});
</script>

<svelte:head>
	<title>Sell an Item — Campus Marketplace</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-8 sm:px-6">
	<!-- Back link -->
	<a
		href="/"
		class="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
	>
		<ArrowLeft class="h-3.5 w-3.5" />
		<span>Back to listings</span>
	</a>

	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
			Create a New Listing
		</h1>
		<p class="mt-1 text-xs text-zinc-400">
			Share details, set an asking price in INR, and add a clear photo of the item.
		</p>
	</div>

	<!-- Form Card -->
	<div class="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6 shadow-xl backdrop-blur-md sm:p-8">
		{#if form?.message}
			<div class="mb-6 rounded-xl border border-red-500/30 bg-red-950/20 p-3.5 text-xs text-red-400">
				{form.message}
			</div>
		{/if}

		<form
			method="POST"
			enctype="multipart/form-data"
			use:enhance={() => {
				isSubmitting = true;
				return async ({ update }) => {
					isSubmitting = false;
					await update();
				};
			}}
			class="space-y-5"
		>
			<!-- Title -->
			<div>
				<label for="title" class="block text-xs font-medium uppercase tracking-wider text-zinc-400">
					Item Title <span class="text-emerald-400">*</span>
				</label>
				<input
					id="title"
					name="title"
					type="text"
					required
					bind:value={title}
					placeholder="e.g. Hero Sprint 21-Speed Mountain Bike"
					class="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
				/>
				{#if form?.fieldErrors?.title}
					<p class="mt-1 text-xs text-red-400">{form.fieldErrors.title}</p>
				{/if}
			</div>

			<!-- Category & Price in 2 Columns -->
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<!-- Category -->
				<div>
					<label for="category" class="block text-xs font-medium uppercase tracking-wider text-zinc-400">
						Category <span class="text-emerald-400">*</span>
					</label>
					<select
						id="category"
						name="category"
						bind:value={category}
						class="mt-1.5 w-full appearance-none rounded-xl border border-zinc-800 bg-zinc-950/80 px-3.5 py-2.5 text-sm text-zinc-100 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
					>
						{#each listingCategories as cat}
							<option value={cat}>{cat}</option>
						{/each}
					</select>
					{#if form?.fieldErrors?.category}
						<p class="mt-1 text-xs text-red-400">{form.fieldErrors.category}</p>
					{/if}
				</div>

				<!-- Price (INR) -->
				<div>
					<label for="price" class="block text-xs font-medium uppercase tracking-wider text-zinc-400">
						Price (₹ Whole Rupees) <span class="text-emerald-400">*</span>
					</label>
					<div class="relative mt-1.5">
						<span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500 text-sm font-medium">₹</span>
						<input
							id="price"
							name="price"
							type="number"
							min="1"
							step="1"
							required
							bind:value={price}
							placeholder="1500"
							class="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 py-2.5 pr-3.5 pl-8 text-sm text-zinc-100 placeholder-zinc-500 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
						/>
					</div>
					{#if form?.fieldErrors?.price}
						<p class="mt-1 text-xs text-red-400">{form.fieldErrors.price}</p>
					{/if}
				</div>
			</div>

			<!-- Campus Location (Optional) -->
			<div>
				<label for="location" class="block text-xs font-medium uppercase tracking-wider text-zinc-400">
					Campus Location / Hostel <span class="text-zinc-500 lowercase">(optional)</span>
				</label>
				<div class="relative mt-1.5">
					<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
						<MapPin class="h-4 w-4" />
					</div>
					<input
						id="location"
						name="location"
						type="text"
						bind:value={location}
						placeholder="e.g. Hostel 7, Central Library Foyer, SAC"
						class="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 py-2.5 pr-3.5 pl-10 text-sm text-zinc-100 placeholder-zinc-500 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
					/>
				</div>
				{#if form?.fieldErrors?.location}
					<p class="mt-1 text-xs text-red-400">{form.fieldErrors.location}</p>
				{/if}
			</div>

			<!-- Image Upload with Client Preview -->
			<ImageUpload required={true} error={form?.fieldErrors?.image} />

			<!-- Description -->
			<div>
				<label for="description" class="block text-xs font-medium uppercase tracking-wider text-zinc-400">
					Description <span class="text-emerald-400">*</span>
				</label>
				<textarea
					id="description"
					name="description"
					rows="4"
					required
					bind:value={description}
					placeholder="Describe the condition, usage, reason for selling, and any included accessories..."
					class="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-950/80 p-3.5 text-sm text-zinc-100 placeholder-zinc-500 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
				></textarea>
				{#if form?.fieldErrors?.description}
					<p class="mt-1 text-xs text-red-400">{form.fieldErrors.description}</p>
				{/if}
			</div>

			<!-- Submit Button -->
			<div class="pt-2">
				<button
					type="submit"
					disabled={isSubmitting}
					class="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-zinc-950 shadow-md shadow-emerald-950/40 transition-all hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-50"
				>
					{#if isSubmitting}
						<Loader2 class="h-4 w-4 animate-spin" />
						<span>Uploading & creating listing...</span>
					{:else}
						<PlusCircle class="h-4 w-4" />
						<span>Publish Listing</span>
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>
