import { z } from 'zod';

export const registerSchema = z.object({
	name: z
		.string()
		.trim()
		.min(2, { message: 'Name must be at least 2 characters' })
		.max(50, { message: 'Name must be at most 50 characters' }),
	email: z
		.string()
		.trim()
		.toLowerCase()
		.email({ message: 'Please enter a valid email address' }),
	password: z
		.string()
		.min(8, { message: 'Password must be at least 8 characters' })
		.max(100, { message: 'Password is too long' })
});

export const loginSchema = z.object({
	email: z
		.string()
		.trim()
		.toLowerCase()
		.email({ message: 'Please enter a valid email address' }),
	password: z
		.string()
		.min(1, { message: 'Password is required' })
});

export const listingCategories = [
	'Books',
	'Electronics',
	'Furniture',
	'Clothing',
	'Stationery',
	'Cycles',
	'Sports',
	'Other'
] as const;

export const listingCategoryEnum = z.enum(listingCategories);

export const listingSchema = z.object({
	title: z
		.string()
		.trim()
		.min(3, { message: 'Title must be at least 3 characters' })
		.max(100, { message: 'Title must be at most 100 characters' }),
	description: z
		.string()
		.trim()
		.min(10, { message: 'Description must be at least 10 characters' })
		.max(2000, { message: 'Description cannot exceed 2000 characters' }),
	price: z
		.coerce
		.number()
		.int({ message: 'Price must be a whole rupee amount' })
		.min(1, { message: 'Price must be at least ₹1' })
		.max(1000000, { message: 'Price cannot exceed ₹10,00,000' }),
	category: listingCategoryEnum,
	location: z
		.string()
		.trim()
		.max(100, { message: 'Location cannot exceed 100 characters' })
		.optional()
		.or(z.literal(''))
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ListingInput = z.infer<typeof listingSchema>;

export const formatPrice = (val: number): string => '₹' + val.toLocaleString('en-IN');

export const getFieldErrors = (error: z.ZodError): Record<string, string> =>
	Object.fromEntries(
		Object.entries(error.flatten().fieldErrors).map(([k, v]) => [k, Array.isArray(v) && v[0] ? String(v[0]) : ''])
	);

