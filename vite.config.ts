import fs from 'node:fs';
import path from 'node:path';
import adapter from '@sveltejs/adapter-vercel';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// On Windows without Developer Mode, symlinks require 'junction' or fallback to directory copy
if (process.platform === 'win32') {
	const origSymlinkSync = fs.symlinkSync;
	fs.symlinkSync = ((target: string, linkPath: string, type?: fs.symlink.Type | null) => {
		try {
			return origSymlinkSync(target, linkPath, type);
		} catch (err: unknown) {
			const error = err as { code?: string };
			if (error?.code === 'EPERM') {
				try {
					const resolvedTarget = path.isAbsolute(target)
						? target
						: path.resolve(path.dirname(linkPath), target);
					return origSymlinkSync(resolvedTarget, linkPath, 'junction');
				} catch {
					try {
						const resolvedTarget = path.isAbsolute(target)
							? target
							: path.resolve(path.dirname(linkPath), target);
						fs.cpSync(resolvedTarget, linkPath, { recursive: true });
						return;
					} catch {}
				}
			}
			throw err;
		}
	}) as typeof fs.symlinkSync;
}

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter()
		})
	]
});
