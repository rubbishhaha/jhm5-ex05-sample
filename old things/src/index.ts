export interface Env {
  TICATION_KV: KVNamespace;
  ASSETS?: {
    fetch(input: Request | string, init?: RequestInit): Promise<Response>;
  };
  DB?: D1Database;
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

  // POST /api/login
  if (path === '/api/login' && request.method === 'POST') {
    try {
      const body = (await request.json()) as any;
      const email = body && typeof body.email === 'string' ? body.email : null;
      return jsonResponse({ token: 'dummy-token', user: { email } });
    } catch (e) {
      return jsonResponse({ error: 'invalid json' }, 400);
    }
  }

  // GET /api/tasks
  if (path === '/api/tasks' && request.method === 'GET') {
    try {
      const raw = await env.TICATION_KV.get('tasks');
      const tasks = raw ? JSON.parse(raw) : [];
      return jsonResponse(tasks);
    } catch (e) {
      return jsonResponse([], 200);
    }
  }

  // POST /api/tasks
  if (path === '/api/tasks' && request.method === 'POST') {
    try {
      const task = (await request.json()) as any;
      const raw = await env.TICATION_KV.get('tasks');
      const tasks = raw ? JSON.parse(raw) : [];
      const taskObj = task && typeof task === 'object' ? task : { title: String(task) };
      const newTask = Object.assign({ id: Date.now().toString() }, taskObj);
      tasks.push(newTask);
      await env.TICATION_KV.put('tasks', JSON.stringify(tasks));
      return jsonResponse(newTask, 201);
    } catch (e) {
      return jsonResponse({ error: 'failed to save task' }, 500);
    }
  }

  // GET /api/hkdse/stats -> query D1 (safe dummy query)
  if (path === '/api/hkdse/stats' && request.method === 'GET') {
    try {
      if (!env.DB) return jsonResponse({ error: 'no d1 binding' }, 500);
      const res = await env.DB.prepare('SELECT 1 AS ok').all();
      return jsonResponse({ rows: (res as any).results || res });
    } catch (e) {
      return jsonResponse({ error: 'd1 query failed', detail: String(e) }, 500);
    }
  }

  // GET /api/leaderboard
  if (path === '/api/leaderboard' && request.method === 'GET') {
    try {
      const raw = await env.TICATION_KV.get('leaderboard');
      const leaderboard = raw ? JSON.parse(raw) : [];
      return jsonResponse(leaderboard);
    } catch (e) {
      return jsonResponse([], 200);
    }
  }

  // POST /api/scores
  if (path === '/api/scores' && request.method === 'POST') {
    try {
      const score = (await request.json()) as any;
      const raw = await env.TICATION_KV.get('leaderboard');
      const leaderboard = raw ? JSON.parse(raw) : [];
      const scoreObj = score && typeof score === 'object' ? score : { value: Number(score) };
      const newScore = Object.assign({ id: Date.now().toString() }, scoreObj);
      leaderboard.push(newScore);
      await env.TICATION_KV.put('leaderboard', JSON.stringify(leaderboard));
      return jsonResponse(newScore, 201);
    } catch (e) {
      return jsonResponse({ error: 'failed to save score' }, 500);
    }
  }

  // Fallback: serve static assets via ASSETS binding
  try {
    if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return await env.ASSETS.fetch(request);
    }
  } catch (e) {
    // fall through to not found
  }

  return new Response('Not found', { status: 404 });
}

// Default export for Wrangler-style modules
export default {
  async fetch(request: Request, env: Env, ctx: any) {
    return handleRequest(request, env, ctx);
  },
};

// Global service-worker style handler for environments that provide `event`
declare const addEventListener: any;
if (typeof addEventListener === 'function') {
  addEventListener('fetch', (event: any) => {
    try {
      event.respondWith(handleRequest(event.request, event.env || (event as any).bindings || {}, event));
    } catch (e) {
      event.respondWith(new Response('Internal Server Error', { status: 500 }));
    }
  });
}
