<script lang="ts">
	import { UploadCloud, Image as ImageIcon, X, AlertCircle } from 'lucide-svelte';

	let {
		existingImageUrl = '',
		name = 'image',
		required = true,
		error = ''
	}: {
		existingImageUrl?: string;
		name?: string;
		required?: boolean;
		error?: string;
	} = $props();

	let previewUrl = $state(existingImageUrl);
	let fileName = $state('');
	let fileSizeStr = $state('');
	let localError = $state('');
	let fileInput: HTMLInputElement;

	const displayError = $derived(localError || error);

	function formatBytes(bytes: number) {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	function handleFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		localError = '';

		// Validate size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			localError = 'Image must be under 5MB';
			target.value = '';
			return;
		}

		// Validate type
		const allowed = ['image/jpeg', 'image/png', 'image/webp'];
		if (!allowed.includes(file.type)) {
			localError = 'Only JPG, PNG, and WebP images are supported';
			target.value = '';
			return;
		}

		fileName = file.name;
		fileSizeStr = formatBytes(file.size);

		const reader = new FileReader();
		reader.onload = (e) => {
			previewUrl = e.target?.result as string;
		};
		reader.readAsDataURL(file);
	}

	function removeImage() {
		previewUrl = '';
		fileName = '';
		fileSizeStr = '';
		localError = '';
		if (fileInput) fileInput.value = '';
	}
</script>

<div>
	<label class="block text-xs font-medium uppercase tracking-wider text-zinc-400 mb-1.5">
		Item Image <span class="text-zinc-500 lowercase">(JPG, PNG, WEBP — Max 5MB)</span>
	</label>

	<!-- Hidden native file input -->
	<input
		bind:this={fileInput}
		id="image-file-input"
		type="file"
		{name}
		accept="image/jpeg,image/png,image/webp"
		onchange={handleFileChange}
		class="hidden"
		{required: required && !previewUrl}
	/>

	{#if previewUrl}
		<!-- Image Preview State -->
		<div class="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-2">
			<div class="relative aspect-16/9 w-full overflow-hidden rounded-xl bg-zinc-900">
				<img
					src={previewUrl}
					alt="Item preview"
					class="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
				/>
				<button
					type="button"
					onclick={removeImage}
					class="absolute top-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-950/80 text-zinc-300 backdrop-blur-md transition-colors hover:bg-red-500 hover:text-white"
					aria-label="Remove image"
				>
					<X class="h-4 w-4" />
				</button>
			</div>

			<div class="mt-2.5 flex items-center justify-between px-2 pb-1 text-xs text-zinc-400">
				<span class="truncate max-w-[200px] font-mono">{fileName || 'Current listing photo'}</span>
				<div class="flex items-center gap-2">
					{#if fileSizeStr}
						<span class="font-mono text-zinc-500">{fileSizeStr}</span>
					{/if}
					<button
						type="button"
						onclick={() => fileInput.click()}
						class="font-medium text-emerald-400 hover:text-emerald-300 underline"
					>
						Change
					</button>
				</div>
			</div>
		</div>
	{:else}
		<!-- Empty Upload Dropzone -->
		<button
			type="button"
			onclick={() => fileInput.click()}
			class="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-800 bg-zinc-950/60 p-8 text-center transition-all hover:border-emerald-500/50 hover:bg-zinc-900/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
		>
			<div class="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-400">
				<UploadCloud class="h-6 w-6 text-zinc-400" />
			</div>
			<p class="mt-3 text-xs font-semibold text-zinc-200">
				Click to select an image
			</p>
			<p class="mt-1 text-[11px] text-zinc-500">
				PNG, JPG, or WEBP up to 5MB
			</p>
		</button>
	{/if}

	{#if displayError}
		<div class="mt-1.5 flex items-center gap-1.5 text-xs text-red-400">
			<AlertCircle class="h-3.5 w-3.5 shrink-0" />
			<span>{displayError}</span>
		</div>
	{/if}
</div>
