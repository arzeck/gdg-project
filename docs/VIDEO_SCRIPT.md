# Campus Marketplace — Video Walkthrough Script (4–5 Minutes)

This document provides a timed outline and narration script for a 4–5 minute technical walkthrough video demonstrating the **Campus Marketplace** web application.

---

## Video Outline & Timing Summary

| Timestamp | Section | Visual Focus | Key Discussion Points |
| :--- | :--- | :--- | :--- |
| **0:00 – 0:45** | **1. Introduction & Approach** | Homepage, Dark UI, Responsive Layout | University problem statement, strict tech stack, Svelte 5 runes, phased engineering approach |
| **0:45 – 1:45** | **2. Core Marketplace Tour** | Login page with 1-Click Demo Fill, Feed, Debounced Filters | Authentication flow, cookie security, shareable URL search params, category & price filters |
| **1:45 – 2:30** | **3. Listing Lifecycle & Cloudinary** | "Sell Item" Modal/Page, Drag-and-drop preview, Detail Page | Server-side signed uploads, asset destruction, INR currency formatting, seller details |
| **2:30 – 3:15** | **4. Ownership Security & Seller Dashboard** | Detail page owner controls, Mark as Sold, "My Listings" tab | Server-side authorization (401/403 verification), sold item dimming & overlay, deletion confirmation |
| **3:15 – 4:15** | **5. Bonus Implementations** | Favourites Heart, Location Autocomplete, Real-time Pill | **Bonus A** (Wishlist & optimistic UI), **Bonus B** (Nominatim OSM proxy), **Bonus C** (SSE + ETag serverless fallback) |
| **4:15 – 4:55** | **6. Engineering Challenges & Solutions** | VS Code / Architecture diagrams | Bun runtime IPv6 fix for Neon poolers, Windows NTFS junction patch for Vercel adapter |
| **4:55 – 5:10** | **7. Wrap-up & Deployment** | Vercel production deployment | Summary of production readiness |

---

## Detailed Walkthrough Script

### 0:00 – 0:45 | Section 1: Introduction, Problem Statement & Approach
- **Screen**: Show the clean, dark-themed homepage (`#090a0f` background, emerald accents, rounded-2xl cards, Geist sans font). Resize the browser to demonstrate mobile responsiveness.
- **Narration**:
  > *"Hello everyone! Today I'm presenting **CampusExchange**, a full-stack campus marketplace built specifically for college students to buy and sell textbooks, electronics, cycles, and dorm essentials safely within their university.*
  >
  > *From an engineering perspective, this entire project is built using a modern, unified full-stack architecture: SvelteKit with the latest Svelte 5 Runes, TypeScript, Tailwind CSS, Neon Serverless Postgres, and Drizzle ORM. There is no separate backend service — all business logic runs securely through SvelteKit server routes, form actions, and hooks.*
  >
  > *I approached this timed challenge systematically in phases: from schema migrations and seed data, to session authentication, RESTful APIs, responsive UI states, security hardening, and all three bonus tiers."*

---

### 0:45 – 1:45 | Section 2: Authentication & Deep Search
- **Screen**: Navigate to `/login`. Demonstrate the **1-Click Demo Fill** buttons (`Aarav`, `Priya`, `Rohan`). Log in as Aarav. Return to `/` and type in the search bar. Show URL parameters changing in real-time.
- **Narration**:
  > *"Let's start with authentication. We implemented custom stateful session authentication with passwords hashed via bcrypt. To make grading and testing effortless, the login screen includes 1-click fill buttons for our three pre-seeded student personas.*
  >
  > *Sessions are stored in Postgres as SHA-256 token hashes, transmitted via httpOnly, secure, sameSite=lax cookies with a 30-day lifetime and a sliding 15-day refresh window.*
  >
  > *On the browse page, search and filtering are completely synchronized with URL search parameters. Notice as I type 'cycle' or 'clrs' — the search input is debounced by 300 milliseconds to prevent database query spam. We can filter by category, set minimum and maximum price ranges in Rupees, filter by hostel location, or sort from low to high. Because all filters live in the URL, students can easily bookmark and share filtered links with friends."*

---

### 1:45 – 2:30 | Section 3: Listing Creation & Cloudinary Integration
- **Screen**: Click "Sell Item" (`/listings/new`). Show form validation. Pick an image file to show client-side preview with file size. Fill out title, category, price, and location. Click Submit.
- **Narration**:
  > *"Now let's post a new item. Form inputs are validated both client-side and server-side using shared Zod schemas.*
  >
  > *When uploading an image, the client instantly generates a local preview and validates that the file is under 5 megabytes. Notice that Cloudinary credentials are kept completely server-side — no API secrets or client-side upload presets are ever exposed in browser network requests.*
  >
  > *Once submitted, SvelteKit processes the upload, sends the signed payload to Cloudinary, stores the secure URL and public ID in Postgres, and redirects us to the newly created listing detail page with clean INR currency formatting and seller verification badges."*

---

### 2:30 – 3:15 | Section 4: Ownership Security, Sold Dimming & Dashboard
- **Screen**: View the created listing. Show the Edit, Mark as Sold, and Delete buttons. Toggle status to "Mark as Sold". Show the dimmed image and overlay. Switch to an incognito window as Priya, navigate to the same item, and demonstrate that owner controls are hidden and the contact button is disabled.
- **Narration**:
  > *"Security is non-negotiable. Notice the listing owner controls: 'Edit Listing', 'Mark as Sold', and 'Delete'. Every mutating server action loads the listing from the database and strictly verifies that listing.userId matches locals.user.id. If another student tries to tamper with the endpoint or send a modified user ID, the server rejects it with an immediate 403 Forbidden.*
  >
  > *When I toggle 'Mark as Sold', the item updates across the entire app via SvelteKit's invalidateAll(). Sold items receive a dimmed image overlay and a prominent 'SOLD' badge, and the email contact button is automatically disabled.*
  >
  > *Sellers also have access to a dedicated 'My Listings' dashboard at `/my-listings`, where they can manage all their active inventory, filter by sold status, and delete items with a safe confirmation dialog that automatically purges the old image asset from Cloudinary."*

---

### 3:15 – 4:15 | Section 5: Bonus Features (Wishlist, Location, Real-Time)
- **Screen**:
  1. Click the heart icon on a couple of listing cards. Show the instant fill (optimistic UI). Navigate to `/favourites`.
  2. Open the Create or Edit listing form and demonstrate the `LocationInput` component with quick campus spot pills and Nominatim autocomplete.
  3. Open a second tab, post a new listing, and show the floating "New items posted — Click to view" notification pill on the first tab.
- **Narration**:
  > *"Beyond the core requirements, I completed all three bonus features in order:*
  >
  > *First, **Bonus A — Favourites Wishlist**: Students can click the heart icon on any card or detail page. This uses optimistic UI so the heart toggles instantly while the server persists the bookmark in a composite-key favourites table. The `/favourites` page lets students review all their saved items.*
  >
  > *Second, **Bonus B — Location Autocomplete**: We built a secure proxy to the OpenStreetMap Nominatim API, paired with one-click pills for popular campus spots like Hostel 1 through 16, the Central Library, and the Student Center.*
  >
  > *Third, **Bonus C — Real-Time Updates**: We implemented dual-mode real-time sync. There is a Server-Sent Events endpoint at `/api/events` broadcasting listing lifecycle events with a 15-second heartbeat. Furthermore, to guarantee 100% compatibility with serverless runtimes like Vercel where long-lived connections can drop, our client automatically falls back to lightweight HTTP ETag polling using If-None-Match headers, showing a floating pill whenever peer students publish new items."*

---

### 4:15 – 4:55 | Section 6: Engineering Challenges Faced & Solutions
- **Screen**: Briefly show code snippets in VS Code (`vite.config.ts`, `src/lib/server/db.ts`, and `src/hooks.server.ts`).
- **Narration**:
  > *"I want to briefly highlight two tricky engineering challenges solved during development:*
  >
  > *First, when running Node on Windows workstations with dual-stack IPv6 connections, standard Undici fetch suffered intermittent 10-second DNS lookup timeouts reaching AWS US-East-1 Neon poolers. We solved this by executing Vite and server scripts via the Bun runtime, which resolves connections natively in under 800 milliseconds.*
  >
  > *Second, Vercel's adapter attempts to create POSIX symlinks during build, which throws EPERM on Windows without Developer Mode. We implemented a clean shim in vite.config.ts that maps symlinks to NTFS directory junctions and falls back to recursive copies, ensuring flawless local builds on Windows while remaining 100% compliant with Vercel deployment targets.*
  >
  > *Finally, migrating to Svelte 5 Runes provided clean, predictable reactivity without the boilerplate of legacy stores."*

---

### 4:55 – 5:10 | Section 7: Wrap-up & Deployment
- **Screen**: Show the deployed application live on Vercel with green checkmark and zero console errors.
- **Narration**:
  > *"The application is fully type-checked with zero svelte-check errors, passes production builds in under 3 seconds, and is live on Vercel. Thank you for watching!"*
