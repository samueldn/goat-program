// Vercel serverless function: stores each family member's checklist progress in Upstash Redis.
// Access needs the family passphrase. Only its SHA-256 hash lives on the server (FAMILY_KEY_HASH).
const crypto = require('crypto');

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY_HASH = process.env.FAMILY_KEY_HASH || '';
const HASH_KEY = 'goat:progress';
const ORIGINS = ['https://goat-program.vercel.app', 'https://samueldn.github.io'];
const MAX_OPS = 60;

async function redis(...command) {
  const res = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + REDIS_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  const body = await res.json();
  if (body.error) throw new Error(body.error);
  return body.result;
}

function authorized(req) {
  const given = String(req.headers['x-family-key'] || '');
  if (!KEY_HASH || given.length < 8 || given.length > 200) return false;
  const a = Buffer.from(crypto.createHash('sha256').update(given).digest('hex'));
  const b = Buffer.from(KEY_HASH);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// stored value is "timestamp|value"
function parse(raw) {
  const i = raw.indexOf('|');
  return { t: Number(raw.slice(0, i)) || 0, v: raw.slice(i + 1) };
}

async function readAll() {
  const flat = (await redis('HGETALL', HASH_KEY)) || [];
  const out = {};
  for (let i = 0; i < flat.length; i += 2) out[flat[i]] = parse(flat[i + 1]);
  return out;
}

module.exports = async (req, res) => {
  const origin = req.headers.origin;
  if (origin && ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'content-type, x-family-key');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  }
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (!REDIS_URL || !REDIS_TOKEN || !KEY_HASH) return res.status(503).json({ error: 'not-configured' });
  if (!authorized(req)) return res.status(401).json({ error: 'bad-passphrase' });

  try {
    if (req.method === 'POST') {
      const ops = Array.isArray(req.body && req.body.ops) ? req.body.ops.slice(0, MAX_OPS) : [];
      const clean = ops.filter(o =>
        o && typeof o.f === 'string' && o.f.length > 0 && o.f.length <= 80 && /^[\w|:.-]+$/.test(o.f) &&
        typeof o.v === 'string' && o.v.length <= 40 && Number.isFinite(o.t));
      if (clean.length) {
        const existing = await redis('HMGET', HASH_KEY, ...clean.map(o => o.f));
        const writes = [];
        clean.forEach((o, i) => {
          const cur = existing[i] ? parse(existing[i]) : null;
          if (!cur || o.t >= cur.t) writes.push(o.f, `${Math.round(o.t)}|${o.v}`);
        });
        if (writes.length) await redis('HSET', HASH_KEY, ...writes);
      }
    } else if (req.method !== 'GET') {
      return res.status(405).json({ error: 'method' });
    }
    return res.status(200).json({ progress: await readAll(), now: Date.now() });
  } catch (err) {
    return res.status(500).json({ error: 'server' });
  }
};
