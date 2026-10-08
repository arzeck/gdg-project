import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import bcrypt from 'bcryptjs';
import * as schema from './schema';
import { users, listings } from './schema';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	console.error('DATABASE_URL is not set. Please set DATABASE_URL in your .env file.');
	process.exit(1);
}

const sql = neon(databaseUrl);
const db = drizzle(sql, { schema });

async function seed() {
	console.log('🌱 Seeding database...');

	// Hash password for demo accounts
	const passwordHash = await bcrypt.hash('password123', 10);

	// 1. Create Demo Users
	console.log('Creating demo users...');
	const demoUsers = [
		{
			name: 'Aarav Sharma',
			email: 'aarav@campus.edu',
			passwordHash
		},
		{
			name: 'Priya Patel',
			email: 'priya@campus.edu',
			passwordHash
		},
		{
			name: 'Rohan Verma',
			email: 'rohan@campus.edu',
			passwordHash
		}
	];

	const createdUsers = [];
	for (const u of demoUsers) {
		const res = await db
			.insert(users)
			.values(u)
			.onConflictDoUpdate({
				target: users.email,
				set: { name: u.name, passwordHash: u.passwordHash }
			})
			.returning();
		createdUsers.push(res[0]);
	}

	const [aarav, priya, rohan] = createdUsers;

	// 2. Realistic Campus Listings
	console.log('Creating realistic listings...');
	const sampleListings: Array<typeof listings.$inferInsert> = [
		{
			userId: aarav.id,
			title: 'Hero Sprint 21-Speed Mountain Bicycle',
			description:
				'In great condition, dual disc brakes, recently serviced with new brake pads and bell. Great for commuting between hostel and department.',
			price: 4500,
			category: 'Cycles',
			imageUrl:
				'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80',
			location: 'Hostel 7 Cycle Stand',
			status: 'available'
		},
		{
			userId: priya.id,
			title: 'Introduction to Algorithms (CLRS) 4th Edition',
			description:
				'Barely used, zero highlights or pencil markings. Essential reference textbook for CS201 and Data Structures & Algorithms.',
			price: 1200,
			category: 'Books',
			imageUrl:
				'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
			location: 'Central Library Foyer',
			status: 'available'
		},
		{
			userId: rohan.id,
			title: 'Logitech MX Master 3S Wireless Mouse',
			description:
				'Ergonomic mouse with ultra-fast electromagnetic scroll wheel. Works via Bluetooth and Logi Bolt receiver. Comes with original box and cable.',
			price: 5200,
			category: 'Electronics',
			imageUrl:
				'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80',
			location: 'Hostel 12, Room 318',
			status: 'available'
		},
		{
			userId: aarav.id,
			title: 'Casio fx-991EX ClassWiz Scientific Calculator',
			description:
				'Allowed in all midsem/endsem exams. High-resolution spreadsheet display and matrix calculation features. Battery included.',
			price: 850,
			category: 'Stationery',
			imageUrl:
				'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80',
			location: 'SAC Cafe',
			status: 'sold'
		},
		{
			userId: priya.id,
			title: 'Ergonomic Mesh Study Chair with Lumbar Support',
			description:
				'Height adjustable, breathable mesh back with tilt lock. Purchased 6 months ago for coding sessions, selling due to graduating.',
			price: 2800,
			category: 'Furniture',
			imageUrl:
				'https://images.unsplash.com/photo-1580481077195-c2901e3b6a95?auto=format&fit=crop&w=800&q=80',
			location: 'Hostel 4, Block B',
			status: 'available'
		},
		{
			userId: rohan.id,
			title: 'Decathlon Yonex Badminton Racket Set (2 Rackets + Cover)',
			description:
				'Carbon graphite shaft, strung at 24 lbs. Comes with protective full cover and half-tube of Mavis 350 nylon shuttlecocks.',
			price: 1600,
			category: 'Sports',
			imageUrl:
				'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
			location: 'Sports Complex / Indoor Badminton Court',
			status: 'available'
		},
		{
			userId: aarav.id,
			title: 'Sony WH-1000XM4 Noise Canceling Headphones',
			description:
				'Industry-leading active noise cancellation, pristine sound, 30h battery life. Includes audio cable, airline adapter, and travel case.',
			price: 13500,
			category: 'Electronics',
			imageUrl:
				'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
			location: 'ECE Department Corridor',
			status: 'sold'
		},
		{
			userId: priya.id,
			title: 'College Techfest 2024 Black Hoodie (Size L)',
			description:
				'Heavyweight 350 GSM cotton fleece hoodie, limited edition crew apparel, worn only twice. Super warm for winter semesters.',
			price: 700,
			category: 'Clothing',
			imageUrl:
				'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
			location: 'Hostel 4 Ground Floor',
			status: 'available'
		},
		{
			userId: rohan.id,
			title: 'Wooden Foldable Bed Study Table with Cup Holder',
			description:
				'Compact portable lap desk with tablet/phone slot, anti-slip legs. Perfect for late-night hostel bed study sessions.',
			price: 450,
			category: 'Furniture',
			imageUrl:
				'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800&q=80',
			location: 'Hostel 12 Reception',
			status: 'available'
		},
		{
			userId: aarav.id,
			title: 'Warm Mist Room Kettle & Water Boiler (1.5L)',
			description:
				'Prestige stainless steel electric kettle, auto shut-off, boil-dry protection. Essential for late-night hostel tea and Maggi.',
			price: 650,
			category: 'Other',
			imageUrl:
				'https://images.unsplash.com/photo-1594213114663-ddfeefe724fc?auto=format&fit=crop&w=800&q=80',
			location: 'Hostel 7, 2nd Floor Pantry',
			status: 'available'
		}
	];

	for (const item of sampleListings) {
		await db.insert(listings).values(item);
	}

	console.log('✅ Seed completed successfully!');
	console.log('Demo accounts created:');
	console.log('- aarav@campus.edu (password: password123)');
	console.log('- priya@campus.edu (password: password123)');
	console.log('- rohan@campus.edu (password: password123)');
}

seed().catch((err) => {
	console.error('Seed failed:', err);
	process.exit(1);
});

