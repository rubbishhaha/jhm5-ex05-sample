// Clean Cloudflare Worker for redo
export interface Env {
	dse_kv: KVNamespace;
	DB?: D1Database;
	ASSETS?: {
		fetch(input: Request | string, init?: RequestInit): Promise<Response>;
	};
}

function jsonResponse(data: unknown, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}

export async function handleRequest(request: Request, env: Env, ctx: any): Promise<Response> {
	const url = new URL(request.url);
	const path = url.pathname;

	// Health route
	if (path === '/' && request.method === 'GET') {
		return new Response('Worker is running');
	}

	// GET /api/hkdse/table3f -> return all rows from table3f
	if (path === '/api/hkdse/table3f' && request.method === 'GET') {
		try {
			if (!env.DB) return jsonResponse({ error: 'no d1 binding' }, 500);
			const res = await env.DB.prepare(
				'SELECT id, jj_no, description, type, day_school_candidates_no, day_school_candidates_cumulative_total, all_candidates_no, all_candidates_cumulative_total FROM table3f ORDER BY jj_no'
			).all();
			const rows = (res as any).results || (res as any).rows || res;
			return jsonResponse(rows);
		} catch (e) {
			return jsonResponse({ error: 'd1 query failed', detail: String(e) }, 500);
		}
	}

	// fallback: serve static assets via ASSETS binding
	try {
		if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
			return await env.ASSETS.fetch(request);
		}
	} catch (e) {
		// ignore
	}

	return new Response('Not found', { status: 404 });
}

export default {
	async fetch(request: Request, env: Env, ctx: any) {
		return handleRequest(request, env, ctx);
	},

	async scheduled(event: any, env: Env, ctx: any): Promise<void> {
		try {
			const resp = await fetch('https://api.cloudflare.com/client/v4/ips');
			const wasSuccessful = resp.ok ? 'success' : 'fail';
			console.log(`trigger fired at ${event.cron}: ${wasSuccessful}`);
		} catch (e) {
			console.log('scheduled handler error', e);
		}
	},
};

