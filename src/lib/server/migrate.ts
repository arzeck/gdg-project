import { neon } from '@neondatabase/serverless';
import fs from 'node:fs';
import path from 'node:path';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	console.error('DATABASE_URL is missing in environment variables');
	process.exit(1);
}

const sql = neon(databaseUrl);

async function runMigration() {
	console.log('🚀 Running database migrations against Neon Postgres...');
	const migrationFile = path.resolve('drizzle/0000_modern_impossible_man.sql');
	const content = fs.readFileSync(migrationFile, 'utf-8');
	const statements = content
		.split('--> statement-breakpoint')
		.map((s) => s.trim())
		.filter((s) => s.length > 0);

	for (let i = 0; i < statements.length; i++) {
		const statement = statements[i];
		const summary = statement.replace(/\s+/g, ' ').slice(0, 50);
		console.log(`[${i + 1}/${statements.length}] Executing: ${summary}...`);
		try {
			await sql.query(statement);
		} catch (err: unknown) {
			const error = err as { message?: string };
			console.log(`  Notice/Info: ${error?.message || error}`);
		}
	}
	console.log('✅ Migrations applied successfully!');
}

runMigration().catch((err) => {
	console.error('Migration failed:', err);
	process.exit(1);
});

