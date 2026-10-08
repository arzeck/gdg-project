<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { UserPlus, User, Mail, Lock, Eye, EyeOff, Loader2, Sparkles } from 'lucide-svelte';

	let { form } = $props();

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let isSubmitting = $state(false);

	$effect(() => {
		if (form?.values?.name && !name) {
			name = form.values.name;
		}
		if (form?.values?.email && !email) {
			email = form.values.email;
		}
	});

	const redirectTo = $derived(page.url.searchParams.get('redirectTo') || '');
</script>

<svelte:head>
	<title>Register — Campus Marketplace</title>
</svelte:head>

<div class="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
	<div class="w-full max-w-md">
		<!-- Brand & Header -->
		<div class="mb-8 text-center">
			<div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 shadow-sm shadow-emerald-950/40">
				<Sparkles class="h-6 w-6" />
			</div>
			<h1 class="text-2xl font-bold tracking-tight text-zinc-100">Create an account</h1>
			<p class="mt-1 text-sm text-zinc-400">Join your campus community to trade and share gear</p>
		</div>

		<!-- Card -->
		<div class="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 shadow-xl backdrop-blur-md sm:p-8">
			<!-- Global Error Alert -->
			{#if form?.message}
				<div class="mb-6 rounded-xl border border-red-500/30 bg-red-950/20 p-3 text-sm text-red-400">
					{form.message}
				</div>
			{/if}

			<form
				method="POST"
				action={redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}
				use:enhance={() => {
					isSubmitting = true;
					return async ({ update }) => {
						isSubmitting = false;
						await update();
					};
				}}
				class="space-y-4"
			>
				<!-- Full Name -->
				<div>
					<label for="name" class="block text-xs font-medium uppercase tracking-wider text-zinc-400">
						Full Name
					</label>
					<div class="relative mt-1.5">
						<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
							<User class="h-4 w-4" />
						</div>
						<input
							id="name"
							name="name"
							type="text"
							required
							autocomplete="name"
							bind:value={name}
							placeholder="Aarav Sharma"
							class="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 py-2.5 pr-3.5 pl-10 text-sm text-zinc-100 placeholder-zinc-500 transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
						/>
					</div>
					{#if form?.fieldErrors?.name}
						<p class="mt-1 text-xs text-red-400">{form.fieldErrors.name}</p>
					{/if}
				</div>

				<!-- Email -->
				<div>
					<label for="email" class="block text-xs font-medium uppercase tracking-wider text-zinc-400">
						Campus Email
					</label>
					<div class="relative mt-1.5">
						<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
							<Mail class="h-4 w-4" />
						</div>
						<input
							id="email"
							name="email"
							type="email"
							required
							autocomplete="email"
							bind:value={email}
							placeholder="you@campus.edu"
							class="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 py-2.5 pr-3.5 pl-10 text-sm text-zinc-100 placeholder-zinc-500 transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
						/>
					</div>
					{#if form?.fieldErrors?.email}
						<p class="mt-1 text-xs text-red-400">{form.fieldErrors.email}</p>
					{/if}
				</div>

				<!-- Password -->
				<div>
					<label for="password" class="block text-xs font-medium uppercase tracking-wider text-zinc-400">
						Password <span class="text-zinc-500 lowercase">(min 8 characters)</span>
					</label>
					<div class="relative mt-1.5">
						<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
							<Lock class="h-4 w-4" />
						</div>
						<input
							id="password"
							name="password"
							type={showPassword ? 'text' : 'password'}
							required
							minlength="8"
							autocomplete="new-password"
							bind:value={password}
							placeholder="••••••••"
							class="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 py-2.5 pr-10 pl-10 text-sm text-zinc-100 placeholder-zinc-500 transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
						/>
						<button
							type="button"
							onclick={() => (showPassword = !showPassword)}
							class="absolute inset-y-0 right-0 flex items-center pr-3.5 text-zinc-500 hover:text-zinc-300"
							aria-label={showPassword ? 'Hide password' : 'Show password'}
						>
							{#if showPassword}
								<EyeOff class="h-4 w-4" />
							{:else}
								<Eye class="h-4 w-4" />
							{/if}
						</button>
					</div>
					{#if form?.fieldErrors?.password}
						<p class="mt-1 text-xs text-red-400">{form.fieldErrors.password}</p>
					{/if}
				</div>

				<!-- Submit Button -->
				<button
					type="submit"
					disabled={isSubmitting}
					class="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 shadow-md shadow-emerald-950/40 transition-all hover:bg-emerald-400 focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-zinc-950 focus:outline-none disabled:opacity-50"
				>
					{#if isSubmitting}
						<Loader2 class="h-4 w-4 animate-spin" />
						<span>Creating account...</span>
					{:else}
						<UserPlus class="h-4 w-4" />
						<span>Create Account</span>
					{/if}
				</button>
			</form>

			<!-- Switch to Login -->
			<div class="mt-6 text-center text-xs text-zinc-400">
				Already have an account?{' '}
				<a
					href={redirectTo ? `/login?redirectTo=${encodeURIComponent(redirectTo)}` : '/login'}
					class="font-medium text-emerald-400 transition-colors hover:text-emerald-300 hover:underline"
				>
					Sign in here
				</a>
			</div>
		</div>
	</div>
</div>

