<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { LogIn, Mail, Lock, Eye, EyeOff, Loader2, Sparkles, UserCheck } from 'lucide-svelte';

	let { form } = $props();

	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let isSubmitting = $state(false);

	$effect(() => {
		if (form?.values?.email && !email) {
			email = form.values.email;
		}
	});

	const redirectTo = $derived(page.url.searchParams.get('redirectTo') || '');

	function fillDemo(demoEmail: string) {
		email = demoEmail;
		password = 'password123';
	}
</script>

<svelte:head>
	<title>Sign In — Campus Marketplace</title>
</svelte:head>

<div class="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
	<div class="w-full max-w-md">
		<!-- Brand & Header -->
		<div class="mb-8 text-center">
			<div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 shadow-sm shadow-emerald-950/40">
				<Sparkles class="h-6 w-6" />
			</div>
			<h1 class="text-2xl font-bold tracking-tight text-zinc-100">Welcome back</h1>
			<p class="mt-1 text-sm text-zinc-400">Sign in to buy and sell items within your campus</p>
		</div>

		<!-- Card -->
		<div class="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 shadow-xl backdrop-blur-md sm:p-8">
			<!-- Demo Credentials Quick Fill -->
			<div class="mb-6 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
				<div class="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
					<UserCheck class="h-3.5 w-3.5 text-emerald-400" />
					<span>Quick demo fill:</span>
				</div>
				<div class="mt-2 flex flex-wrap gap-1.5">
					<button
						type="button"
						onclick={() => fillDemo('aarav@campus.edu')}
						class="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300 transition-colors hover:border-emerald-500/40 hover:bg-zinc-800 hover:text-emerald-300"
					>
						Aarav
					</button>
					<button
						type="button"
						onclick={() => fillDemo('priya@campus.edu')}
						class="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300 transition-colors hover:border-emerald-500/40 hover:bg-zinc-800 hover:text-emerald-300"
					>
						Priya
					</button>
					<button
						type="button"
						onclick={() => fillDemo('rohan@campus.edu')}
						class="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300 transition-colors hover:border-emerald-500/40 hover:bg-zinc-800 hover:text-emerald-300"
					>
						Rohan
					</button>
				</div>
			</div>

			<!-- Error Alert -->
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
						Password
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
							autocomplete="current-password"
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
						<span>Signing in...</span>
					{:else}
						<LogIn class="h-4 w-4" />
						<span>Sign In</span>
					{/if}
				</button>
			</form>

			<!-- Switch to Register -->
			<div class="mt-6 text-center text-xs text-zinc-400">
				Don't have an account?{' '}
				<a
					href={redirectTo ? `/register?redirectTo=${encodeURIComponent(redirectTo)}` : '/register'}
					class="font-medium text-emerald-400 transition-colors hover:text-emerald-300 hover:underline"
				>
					Create one here
				</a>
			</div>
		</div>
	</div>
</div>

