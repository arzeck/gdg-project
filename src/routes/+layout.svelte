<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import Toast from '$lib/components/Toast.svelte';
	import {
		ShoppingBag,
		PlusCircle,
		Heart,
		Layers,
		LogOut,
		LogIn,
		UserPlus,
		User,
		Menu,
		X
	} from 'lucide-svelte';

	let { data, children } = $props();

	let mobileMenuOpen = $state(false);
	let userMenuOpen = $state(false);

	const user = $derived(data.user);
	const currentPath = $derived(page.url.pathname);

	function closeMenus() {
		mobileMenuOpen = false;
		userMenuOpen = false;
	}
</script>

<svelte:window onclick={(e) => {
	// Close user menu on outside click
	const target = e.target as HTMLElement | null;
	if (!target?.closest('#user-menu-button') && !target?.closest('#user-menu-dropdown')) {
		userMenuOpen = false;
	}
}} />

<div class="flex min-h-screen flex-col bg-[#090a0f] text-zinc-100">
	<!-- Top Navigation -->
	<header class="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
		<div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
			<!-- Logo -->
			<a
				href="/"
				onclick={closeMenus}
				class="flex items-center gap-2.5 text-base font-bold tracking-tight text-zinc-100 transition-opacity hover:opacity-90"
			>
				<div class="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-sm shadow-emerald-950/40">
					<ShoppingBag class="h-4 w-4" />
				</div>
				<div class="flex flex-col">
					<span class="leading-none text-zinc-100">CAMPUS<span class="text-emerald-400">EXCHANGE</span></span>
					<span class="text-[10px] tracking-wider text-zinc-400 font-mono">MARKETPLACE</span>
				</div>
			</a>

			<!-- Desktop Navigation Links -->
			<nav class="hidden md:flex items-center gap-6">
				<a
					href="/"
					class="text-sm font-medium transition-colors {currentPath === '/'
						? 'text-emerald-400'
						: 'text-zinc-400 hover:text-zinc-200'}"
				>
					Browse
				</a>

				{#if user}
					<a
						href="/my-listings"
						class="text-sm font-medium transition-colors {currentPath === '/my-listings'
							? 'text-emerald-400'
							: 'text-zinc-400 hover:text-zinc-200'}"
					>
						My Listings
					</a>
					<a
						href="/favourites"
						class="text-sm font-medium transition-colors {currentPath === '/favourites'
							? 'text-emerald-400'
							: 'text-zinc-400 hover:text-zinc-200'}"
					>
						Favourites
					</a>
				{/if}
			</nav>

			<!-- Desktop Actions -->
			<div class="hidden md:flex items-center gap-3">
				{#if user}
					<a
						href="/listings/new"
						class="flex items-center gap-2 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-zinc-950 shadow-sm shadow-emerald-950/40 transition-all hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
					>
						<PlusCircle class="h-3.5 w-3.5" />
						<span>Sell Item</span>
					</a>

					<!-- User Dropdown Menu -->
					<div class="relative">
						<button
							id="user-menu-button"
							type="button"
							onclick={() => (userMenuOpen = !userMenuOpen)}
							class="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-800"
							aria-expanded={userMenuOpen}
							aria-haspopup="true"
						>
							<div class="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
								{user.name.charAt(0).toUpperCase()}
							</div>
							<span class="max-w-[120px] truncate font-medium">{user.name}</span>
						</button>

						{#if userMenuOpen}
							<div
								id="user-menu-dropdown"
								class="absolute right-0 mt-2 w-56 rounded-xl border border-zinc-800 bg-zinc-950/95 p-1.5 shadow-2xl backdrop-blur-md"
							>
								<div class="px-3 py-2 border-b border-zinc-800/80 mb-1">
									<p class="text-xs font-semibold text-zinc-200 truncate">{user.name}</p>
									<p class="text-[11px] text-zinc-500 truncate">{user.email}</p>
								</div>
								<a
									href="/my-listings"
									onclick={closeMenus}
									class="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100"
								>
									<Layers class="h-3.5 w-3.5 text-zinc-400" />
									<span>My Listings</span>
								</a>
								<a
									href="/favourites"
									onclick={closeMenus}
									class="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100"
								>
									<Heart class="h-3.5 w-3.5 text-zinc-400" />
									<span>Favourites</span>
								</a>
								<form method="POST" action="/logout" use:enhance class="mt-1 border-t border-zinc-800/80 pt-1">
									<button
										type="submit"
										class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-red-400 hover:bg-red-950/20 hover:text-red-300 text-left"
									>
										<LogOut class="h-3.5 w-3.5" />
										<span>Sign Out</span>
									</button>
								</form>
							</div>
						{/if}
					</div>
				{:else}
					<a
						href="/login"
						class="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3.5 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100"
					>
						<LogIn class="h-3.5 w-3.5" />
						<span>Sign In</span>
					</a>
					<a
						href="/register"
						class="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-zinc-950 shadow-sm shadow-emerald-950/40 transition-all hover:bg-emerald-400"
					>
						<UserPlus class="h-3.5 w-3.5" />
						<span>Register</span>
					</a>
				{/if}
			</div>

			<!-- Mobile Menu Button -->
			<div class="flex items-center gap-2 md:hidden">
				{#if user}
					<a
						href="/listings/new"
						class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-zinc-950 shadow-sm"
						aria-label="Sell Item"
					>
						<PlusCircle class="h-5 w-5" />
					</a>
				{/if}
				<button
					type="button"
					onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
					class="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200"
					aria-label="Toggle navigation menu"
				>
					{#if mobileMenuOpen}
						<X class="h-5 w-5" />
					{:else}
						<Menu class="h-5 w-5" />
					{/if}
				</button>
			</div>
		</div>

		<!-- Mobile Drawer -->
		{#if mobileMenuOpen}
			<div class="border-b border-zinc-800 bg-zinc-950/95 px-4 pt-3 pb-6 md:hidden">
				<div class="space-y-1">
					<a
						href="/"
						onclick={closeMenus}
						class="block rounded-lg px-3 py-2 text-sm font-medium {currentPath === '/'
							? 'bg-zinc-900 text-emerald-400'
							: 'text-zinc-300 hover:bg-zinc-900/50'}"
					>
						Browse
					</a>
					{#if user}
						<a
							href="/my-listings"
							onclick={closeMenus}
							class="block rounded-lg px-3 py-2 text-sm font-medium {currentPath === '/my-listings'
								? 'bg-zinc-900 text-emerald-400'
								: 'text-zinc-300 hover:bg-zinc-900/50'}"
						>
							My Listings
						</a>
						<a
							href="/favourites"
							onclick={closeMenus}
							class="block rounded-lg px-3 py-2 text-sm font-medium {currentPath === '/favourites'
								? 'bg-zinc-900 text-emerald-400'
								: 'text-zinc-300 hover:bg-zinc-900/50'}"
						>
							Favourites
						</a>
						<div class="mt-4 border-t border-zinc-800 pt-3">
							<div class="px-3 py-1 mb-2">
								<p class="text-xs font-semibold text-zinc-200">{user.name}</p>
								<p class="text-[11px] text-zinc-500">{user.email}</p>
							</div>
							<form method="POST" action="/logout" use:enhance>
								<button
									type="submit"
									class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-red-400 hover:bg-red-950/20 text-left"
								>
									<LogOut class="h-3.5 w-3.5" />
									<span>Sign Out</span>
								</button>
							</form>
						</div>
					{:else}
						<div class="mt-4 flex flex-col gap-2 border-t border-zinc-800 pt-3">
							<a
								href="/login"
								onclick={closeMenus}
								class="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 text-xs font-medium text-zinc-200"
							>
								<LogIn class="h-3.5 w-3.5" />
								<span>Sign In</span>
							</a>
							<a
								href="/register"
								onclick={closeMenus}
								class="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-xs font-semibold text-zinc-950"
							>
								<UserPlus class="h-3.5 w-3.5" />
								<span>Register</span>
							</a>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</header>

	<!-- Main App Content -->
	<main class="flex-1">
		{@render children()}
	</main>

	<!-- Footer -->
	<footer class="border-t border-zinc-800/80 bg-zinc-950/40 py-8 text-center text-xs text-zinc-500">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="flex flex-col sm:flex-row items-center justify-between gap-4">
				<div class="flex items-center gap-2">
					<div class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
					<span class="font-medium text-zinc-400">Campus Marketplace</span>
					<span class="text-zinc-600">·</span>
					<span>Peer-to-peer student exchange</span>
				</div>
				<p class="text-zinc-500 font-mono text-[11px]">
					Built with SvelteKit & Drizzle ORM
				</p>
			</div>
		</div>
	</footer>

	<!-- Global Toast Notifications -->
	<Toast />
</div>
