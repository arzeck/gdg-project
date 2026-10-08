# CampusExchange — Campus Marketplace

> A production-grade, full-stack marketplace web application engineered for college students to securely buy and sell pre-owned textbooks, electronics, cycles, furniture, and campus essentials within their university ecosystem.

[![Tech Stack](https://img.shields.io/badge/Stack-SvelteKit%205%20%7C%20TypeScript%20%7C%20Tailwind%20%7C%20Neon%20Postgres-emerald)](https://svelte.dev)
[![Database](https://img.shields.io/badge/Database-Neon%20Serverless%20Postgres%20%2B%20Drizzle%20ORM-blue)](https://neon.tech)
[![Deployment](https://img.shields.io/badge/Deploy-Vercel%20Serverless-black)](https://vercel.com)

---

## Live Demo & Test Credentials

- **Live Deployment URL**: [https://gdg-campus-marketplace.vercel.app](https://gdg-campus-marketplace.vercel.app) *(or your deployed Vercel URL)*

### Pre-seeded Demo Accounts
The database is pre-seeded with 3 realistic student accounts and 10 campus listings. You can log into any of them directly or use the **1-Click Demo Fill** buttons on the `/login` screen:

| Name | Campus Email | Password | Pre-seeded Listings |
| :--- | :--- | :--- | :--- |
| **Aarav Sharma** | `aarav@campus.edu` | `password123` | CLRS 3rd Ed, Hercules Roadeo Cycle, Logitech G304 Mouse, Sony WH-1000XM4 |
| **Priya Patel** | `priya@campus.edu` | `password123` | iPad Air 5th Gen (64GB M1), Ergonomic Study Chair, Campus Lab Coat |
| **Rohan Gupta** | `rohan@campus.edu` | `password123` | Casio FX-991EX Calculator, Yonex Badminton Racket, Wooden Mini Bedside Table |

---

## Tech Stack & Architecture

- **Frontend & Full-Stack Framework**: **SvelteKit** (latest with **Svelte 5 Runes**: `$state`, `$derived`, `$props`, `$effect`) using server routes (`+page.server.ts`), form actions (`use:enhance`), and request hooks (`hooks.server.ts`). Zero separate backend service.
- **Styling & UI**: **Tailwind CSS**, Geist / Geist Mono typography, dark minimal tech-forward palette (`#090a0f` background, subtle `zinc-800` borders, emerald `#10b981` accents), and **Lucide Svelte** icons.
- **Database & ORM**: **Neon Serverless Postgres** paired with **Drizzle ORM** and `drizzle-kit` for automated SQL schema migrations and strict type inference.
- **Authentication**: Custom stateful session-based auth. Passwords hashed with `bcryptjs` (10 rounds). Cryptographically random 32-byte session tokens stored as SHA-256 hashes in PostgreSQL. Transmitted via `httpOnly`, `secure`, `sameSite=lax` cookies with 30-day expiry and sliding 15-day refresh.
- **Validation**: Strict **Zod** validation schemas shared between client UX forms and server-side endpoints.
- **Media Storage**: **Cloudinary** signed server-side uploads (5MB size enforcement, JPG/PNG/WEBP whitelist) with automated asset destruction on listing updates and deletions.
- **Location Services**: **OpenStreetMap Nominatim API** proxy with in-memory caching and rapid campus area selection pills.
- **Real-Time Layer**: Dual-mode real-time sync with serverless **Server-Sent Events (SSE)** and automated HTTP **ETag / 304 Not Modified polling fallback**.
- **Package Manager & Runtime**: **Bun** for rapid dependency resolution and sub-second dual-stack IPv4/IPv6 database connection initialization.
- **Deployment**: **Vercel** via `@sveltejs/adapter-vercel`.

---

## Entity-Relationship (ER) Schema

```mermaid
erDiagram
    USERS ||--o{ SESSIONS : "creates"
    USERS ||--o{ LISTINGS : "owns"
    USERS ||--o{ FAVOURITES : "saves"
    LISTINGS ||--o{ FAVOURITES : "bookmarked in"

    USERS {
        uuid id PK "default random"
        varchar name "Student Name"
        varchar email UK "Campus Email"
        varchar password_hash "Bcrypt hash"
        timestamp created_at "now()"
    }

    SESSIONS {
        varchar id PK "SHA-256 Token Hash"
        uuid user_id FK "References users(id)"
        timestamp expires_at "Session expiry"
    }

    LISTINGS {
        uuid id PK "default random"
        uuid user_id FK "References users(id) ON DELETE CASCADE"
        varchar title "Listing Title"
        text description "Detailed Description"
        integer price "Price in INR (₹)"
        listing_category category "Books, Electronics, Furniture, etc."
        text image_url "Cloudinary Secure URL"
        varchar image_public_id "Cloudinary Asset ID"
        varchar location "Campus Area / Hostel"
        listing_status status "available | sold"
        timestamp created_at "Index (status, cat, created_at)"
        timestamp updated_at "Auto-updated"
    }

    FAVOURITES {
        uuid user_id PK, FK "References users(id)"
        uuid listing_id PK, FK "References listings(id) ON DELETE CASCADE"
        timestamp created_at "now()"
    }
```

### Database Indexes & Performance Optimizations
- `idx_listings_status_cat_created`: Composite index on `(status, category, created_at DESC)` for sub-millisecond filtering on the browse feed.
- `idx_listings_user`: Index on `(user_id)` for instant seller dashboard retrieval.
- `idx_sessions_user`: Index on `(user_id)` for rapid session invalidation and cleanup.
- Title and description search uses parameterized ILIKE matching across indexed text columns.

---

## Core Features Breakdown

### 1. Authentication & Route Security
- **Registration & Login**: Field-level client & server validation with Zod. Generic authentication errors prevent email enumeration attacks. In-memory IP rate limiting protects authentication endpoints.
- **Route Guards**: Evaluated centrally in `hooks.server.ts`. Authenticated users visiting `/login` or `/register` are automatically redirected to `/`. Unauthenticated users attempting to access `/listings/new`, `/listings/:id/edit`, `/my-listings`, or `/favourites` are redirected to `/login?redirectTo=...`.
- **Session Lifecycle**: Secure sliding window refreshes active sessions that are within 15 days of expiration.

### 2. Marketplace Feed & Shareable Search
- **Responsive Grid**: Adaptive card layout with loading skeleton states (`ListingGrid` and `Skeletons.svelte`).
- **Deep Shareable Search**: Real-time URL query parameter synchronization (`?q=...&category=...&minPrice=...&maxPrice=...&location=...&sort=...&showSold=...`).
- **Debounced Input**: Search input is debounced by 300ms to eliminate redundant database queries while students type.
- **Server-Driven Pagination**: Clean page-based pagination controls keeping URL state synchronized.

### 3. Listing Creation & Cloudinary Integration
- **Server-Side Signed Uploads**: Raw Cloudinary API secrets never leak to the client browser. Images are validated server-side for MIME type (JPEG/PNG/WEBP) and file size (≤ 5MB).
- **Client Image Preview**: Instant pre-upload preview with file size display and quick removal before submission.
- **Asset Cleanup**: Replacing an image during an edit or deleting a listing triggers automated background destruction of the previous Cloudinary asset via `cloudinary.uploader.destroy`.

### 4. Owner Authorization & Listing Lifecycle
- **Zero-Trust Ownership Checks**: Every mutating endpoint (`POST`, `PATCH`, `DELETE`) verifies `listing.userId === locals.user.id` on the server before applying any changes. Non-owners receive HTTP `403 Forbidden`.
- **Sold Status Styling**: Sold listings are styled with dimmed image opacity, a prominent `SOLD` badge overlay, and disabled email contact buttons across all views (feed, detail, and seller dashboard).
- **Destructive Action Confirmation**: Deletions require explicit confirmation via `ConfirmDialog.svelte`.

### 5. Seller Dashboard ("My Listings")
- Accessible at `/my-listings`, allowing sellers to view active inventory, filter by "Available" and "Sold", toggle availability status in one click, and access quick edit/delete actions.

---

## Bonus Features Implemented

### Bonus A: Favourites & Wishlist System
- **Optimistic Heart Toggles**: Students can bookmark items directly from browse cards or listing detail pages with instant visual feedback.
- **Dedicated Wishlist View**: `/favourites` route displays all saved items with empty state recommendations.
- **Database Backed**: Persistent PostgreSQL composite-key join table (`favourites`) with cascade deletion when items are removed.

### Bonus B: Location Autocomplete & Campus Area Filters
- **OpenStreetMap Nominatim Proxy**: Secure server-side proxy route `/api/locations` prevents CORS issues and includes in-memory query caching.
- **Campus Quick-Pills**: Location inputs provide 1-click pills for popular campus spots (`Hostel 1-16`, `Central Library`, `Student Activity Center`, `Department Complex`, `Main Cafeteria`).
- **Location-Based Filtering**: Search marketplace listings by specific campus hostels or landmarks.

### Bonus C: Real-Time Event Sync & Serverless Fallback
- **Server-Sent Events (SSE)**: The `/api/events` endpoint broadcasts real-time events (`listing:created`, `listing:updated`, `listing:sold`, `listing:deleted`) with 15-second keep-alive heartbeats.
- **ETag / HTTP 304 Polling Fallback**: Because serverless environments (such as Vercel Lambdas) terminate long-lived connections, the client (`src/lib/realtime.ts`) includes automated degradation to conditional ETag polling (`/api/listings/latest`) using `If-None-Match`, consuming minimal bandwidth when no changes exist.
- **Floating Notification Pill**: Shows a subtle "New listings posted — Click to refresh" banner on the home screen when peers post new items.

---

## Complete API Reference Table

| Method | Endpoint | Auth | Status Codes | Description |
| :--- | :--- | :---: | :---: | :--- |
| `POST` | `/login` *(action)* | No | `200, 303, 400` | Authenticates student, issues secure session cookie |
| `POST` | `/register` *(action)* | No | `200, 303, 400` | Registers new student, creates session |
| `POST` | `/logout` *(action)* | Yes | `303` | Destroys session in DB and clears cookie |
| `GET` | `/api/listings` | No | `200` | Fetch listings with filters (`q`, `category`, `minPrice`, `maxPrice`, `location`, `showSold`, `sort`, `page`) |
| `POST` | `/api/listings` | Yes | `201, 400, 401, 422` | Create listing with multipart image upload |
| `GET` | `/api/listings/:id` | No | `200, 404` | Get single listing details with seller info & favourite flag |
| `PATCH` | `/api/listings/:id` | Yes | `200, 400, 401, 403, 404, 422` | Update listing details or replace image (owner only) |
| `DELETE` | `/api/listings/:id` | Yes | `200, 401, 403, 404` | Delete listing and destroy Cloudinary asset (owner only) |
| `PATCH` | `/api/listings/:id/sold` | Yes | `200, 401, 403, 404` | Toggle listing status between `available` and `sold` (owner only) |
| `POST` | `/api/favourites/:id` | Yes | `200, 401, 404` | Add listing to user's favourites |
| `DELETE` | `/api/favourites/:id` | Yes | `200, 401, 404` | Remove listing from user's favourites |
| `GET` | `/api/locations` | No | `200` | Query Nominatim OSM autocomplete suggestions |
| `GET` | `/api/events` | No | `200` | Server-Sent Events stream for real-time marketplace events |
| `GET` | `/api/listings/latest` | No | `200, 304` | ETag conditional polling endpoint for serverless fallback |

---

## Key Technical Decisions & Challenges Faced

### 1. Dual-Stack IPv6 Timeout Mitigation on Windows / Node
- **Challenge**: Standard Node.js `fetch` and Undici on Windows suffered intermittent 10-second DNS lookup timeouts (`AggregateError [ETIMEDOUT]`) when connecting to Neon AWS US-East-1 poolers over dual-stack IPv6 connections.
- **Solution**: Executed Vite and background scripts via the **Bun** runtime (`bun --bun vite`). Bun resolves pooler endpoints natively with sub-millisecond connection times, avoiding connection drops.

### 2. Windows NTFS Junction Fallback for `@sveltejs/adapter-vercel`
- **Challenge**: Vercel's adapter attempts to create POSIX symbolic links during the build phase (`fs.symlinkSync`), which throws `EPERM: operation not permitted` on Windows workstations unless Developer Mode is activated.
- **Solution**: Implemented a non-intrusive shim in `vite.config.ts` intercepting `fs.symlinkSync` to utilize Windows NTFS directory junctions (`junction`), gracefully falling back to recursive copying (`fs.cpSync`) if privileges are restricted.

### 3. Svelte 5 Runes Architecture
- **Decision**: Built natively on Svelte 5 runes (`$state`, `$derived`, `$props`, `$effect`). Reactive URL filter updates use `$derived`, while interactive state (such as optimistic heart toggling and modal visibility) uses strictly typed `$state` variables with zero legacy Svelte 4 store subscriptions.

### 4. Cloudinary Secret Shielding & Automated Garbage Collection
- **Decision**: Client browsers never receive Cloudinary API secrets or upload presets. All uploads are processed via server form actions and server routes. Whenever a student updates an item with a new photo or deletes a listing, the server reads the previous `imagePublicId` and destroys the old asset on Cloudinary.

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Neon Postgres Connection String (pooled connection recommended)
DATABASE_URL="postgresql://username:password@ep-proud-waterfall-a400j63u-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Session Security
SESSION_SECRET="your-super-secret-random-32-byte-string"

# Cloudinary Credentials (server-side only)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Environment
NODE_ENV="development"
```

A template is provided in [`.env.example`](./.env.example).

---

## Local Development Setup

### Prerequisites
- [Bun](https://bun.sh/) (v1.1+ recommended) or Node.js (v20+)
- A free [Neon](https://neon.tech) PostgreSQL database
- A free [Cloudinary](https://cloudinary.com) account

### Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/arzeck/gdg-project/tree/main
   cd gdg-project
   ```

2. **Install dependencies**:
   ```bash
   bun install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Populate DATABASE_URL and Cloudinary credentials in .env
   ```

4. **Apply database migrations**:
   ```bash
   bun run db:push
   ```

5. **Seed demo users and listings**:
   ```bash
   bun run db:seed
   ```

6. **Start the development server**:
   ```bash
   bun run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Production Build & Vercel Deployment

1. **Run type-checking and lint checks**:
   ```bash
   bun run check
   ```

2. **Build the production bundle**:
   ```bash
   bun run build
   ```

3. **Deploy to Vercel**:
   - Push the repository to GitHub.
   - Import the project into [Vercel](https://vercel.com).
   - Add all environment variables (`DATABASE_URL`, `SESSION_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`).
   - Vercel automatically detects `@sveltejs/adapter-vercel` and packages the app as serverless functions.

---

## Known Limitations

1. **In-Memory Rate Limiting**: The current IP rate limiter operates in-memory. In a distributed multi-region serverless deployment, rate limiting should be backed by an external store such as Upstash Redis.
2. **OpenStreetMap Nominatim Rate Limits**: The Nominatim public API imposes an upper limit of 1 request/second. In high-traffic university deployments, local campus GIS data or a dedicated geocoding service should be cached.
3. **Campus Scope**: The current application is designed for a single university campus. Multi-campus support would require adding a `campus_id` foreign key across users and listings.

---

## License

MIT License. Designed and built for the GDG Campus Marketplace challenge.
