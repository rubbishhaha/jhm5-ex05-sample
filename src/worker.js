import { Router } from 'itty-router';

const router = Router();

// Serve static files from the apps directory
async function handleStatic(request, env) {
  const url = new URL(request.url);
  let path = url.pathname;
  
  // Serve index.html for root path
  if (path === '/') {
    path = '/index.html';
  }

  try {
    return await env.ASSETS.fetch(request);
  } catch {
    return new Response('Not found', { status: 404 });
  }
}

// API Routes for Tication Server
router.post('/api/login', async (request) => {
  const { email, password } = await request.json();
  // TODO: Implement login logic
  return new Response(JSON.stringify({ token: 'dummy-token' }), {
    headers: { 'Content-Type': 'application/json' }
  });
});

router.get('/api/tasks', async (request, env) => {
  // TODO: Implement task fetching from KV
  return new Response(JSON.stringify([]), {
    headers: { 'Content-Type': 'application/json' }
  });
});

router.post('/api/tasks', async (request, env) => {
  // TODO: Implement task creation in KV
  const task = await request.json();
  return new Response(JSON.stringify(task), {
    headers: { 'Content-Type': 'application/json' }
  });
});

// API Routes for HKDSE Analyzer
router.get('/api/hkdse/stats', async (request, env) => {
  // TODO: Implement HKDSE stats fetching from D1
  return new Response(JSON.stringify({}), {
    headers: { 'Content-Type': 'application/json' }
  });
});

// API Routes for Math Rush
router.get('/api/leaderboard', async (request, env) => {
  // TODO: Implement leaderboard fetching from KV
  return new Response(JSON.stringify([]), {
    headers: { 'Content-Type': 'application/json' }
  });
});

router.post('/api/scores', async (request, env) => {
  // TODO: Implement score submission to KV
  const score = await request.json();
  return new Response(JSON.stringify(score), {
    headers: { 'Content-Type': 'application/json' }
  });
});

// Catch-all route for static files
router.all('*', handleStatic);

export default {
  async fetch(request, env, ctx) {
    return router.handle(request, env, ctx);
  }
};