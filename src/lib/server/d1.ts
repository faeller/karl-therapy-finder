// d1 helper - uses platform in prod, wrangler proxy in dev
import { dev, building } from '$app/environment';

interface WranglerProxy {
	env: { DB: D1Database };
}

let platformProxy: WranglerProxy | null = null;

export async function getD1(platform: App.Platform | undefined): Promise<D1Database | null> {
	// production: use platform bindings
	if (platform?.env?.DB) {
		return platform.env.DB;
	}

	// dev only: use wrangler proxy (never during build or prod)
	if (dev && !building) {
		if (!platformProxy) {
			try {
				// dynamic import via eval to hide from bundler and avoid type errors
				const wranglerModule = 'wrangler';
				// eslint-disable-next-line no-eval
				const wrangler = await (eval(`import('${wranglerModule}')`) as Promise<{
					getPlatformProxy: (opts: { configPath: string }) => Promise<WranglerProxy>;
				}>);
				platformProxy = await wrangler.getPlatformProxy({ configPath: './wrangler.toml' });
			} catch {
				return null;
			}
		}
		return platformProxy?.env?.DB ?? null;
	}

	return null;
}
