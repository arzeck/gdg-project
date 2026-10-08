import { relations } from 'drizzle-orm';
import {
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
	integer,
	primaryKey,
	index
} from 'drizzle-orm/pg-core';

export const categoryEnum = pgEnum('listing_category', [
	'Books',
	'Electronics',
	'Furniture',
	'Clothing',
	'Stationery',
	'Cycles',
	'Sports',
	'Other'
]);

export const statusEnum = pgEnum('listing_status', ['available', 'sold']);

export const users = pgTable('users', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const sessions = pgTable('sessions', {
	id: text('id').primaryKey(), // token hash
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull()
});

export const listings = pgTable(
	'listings',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		title: text('title').notNull(),
		description: text('description').notNull(),
		price: integer('price').notNull(), // Whole rupees in INR
		category: categoryEnum('category').notNull(),
		imageUrl: text('image_url').notNull(),
		imagePublicId: text('image_public_id'),
		location: text('location'),
		status: statusEnum('status').notNull().default('available'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => [
		index('listings_status_idx').on(table.status),
		index('listings_category_idx').on(table.category),
		index('listings_created_at_idx').on(table.createdAt),
		index('listings_user_id_idx').on(table.userId),
		index('listings_status_category_created_idx').on(
			table.status,
			table.category,
			table.createdAt
		)
	]
);

export const favourites = pgTable(
	'favourites',
	{
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		listingId: uuid('listing_id')
			.notNull()
			.references(() => listings.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => [
		primaryKey({ columns: [table.userId, table.listingId] }),
		index('favourites_user_id_idx').on(table.userId),
		index('favourites_listing_id_idx').on(table.listingId)
	]
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
	sessions: many(sessions),
	listings: many(listings),
	favourites: many(favourites)
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	})
}));

export const listingsRelations = relations(listings, ({ one, many }) => ({
	user: one(users, {
		fields: [listings.userId],
		references: [users.id]
	}),
	favourites: many(favourites)
}));

export const favouritesRelations = relations(favourites, ({ one }) => ({
	user: one(users, {
		fields: [favourites.userId],
		references: [users.id]
	}),
	listing: one(listings, {
		fields: [favourites.listingId],
		references: [listings.id]
	})
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Listing = typeof listings.$inferSelect;
export type NewListing = typeof listings.$inferInsert;
export type Favourite = typeof favourites.$inferSelect;
export type Category = (typeof categoryEnum.enumValues)[number];
export type Status = (typeof statusEnum.enumValues)[number];
