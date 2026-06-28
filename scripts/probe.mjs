// Phase 0 — esimcard Reseller API live probe (READ-ONLY).
// Validates the real API contracts before we build on top of them.
// Usage:  node scripts/probe.mjs
// Does NOT purchase anything (no spending). Raw responses saved to scripts/_dumps/.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// --- load .env without any dependency ---
const env = {};
const envPath = path.join(ROOT, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const BASE = env.ESIMCARD_BASE_URL || 'https://portal.esimcard.com/api/developer/reseller';
const TOKEN = env.ESIMCARD_TOKEN || process.env.ESIMCARD_TOKEN;
if (!TOKEN || TOKEN === 'PUT_YOUR_TOKEN_HERE') {
  console.error('❌ No ESIMCARD_TOKEN found in .env');
  process.exit(1);
}

const DUMPS = path.join(ROOT, 'scripts', '_dumps');
fs.mkdirSync(DUMPS, { recursive: true });

const mask = (t) => t.slice(0, 8) + '…' + t.slice(-4);

async function call(method, pathname, { body } = {}) {
  const url = BASE + pathname;
  const headers = { Authorization: `Bearer ${TOKEN}`, Accept: 'application/json' };
  if (body) headers['Content-Type'] = 'application/json';
  const t0 = Date.now();
  try {
    const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* non-json */ }
    return { status: res.status, ms: Date.now() - t0, json, text };
  } catch (e) {
    return { status: 0, ms: Date.now() - t0, json: null, text: String(e), error: true };
  }
}

const dump = (name, data) =>
  fs.writeFileSync(path.join(DUMPS, name + '.json'), JSON.stringify(data, null, 2));

const line = () => console.log('─'.repeat(64));
const short = (v) => (typeof v === 'string' && v.length > 60 ? v.slice(0, 57) + '…' : v);

async function main() {
  console.log(`\nesimcard probe → ${BASE}`);
  console.log(`token: ${mask(TOKEN)}\n`);

  // 1) Balance — confirms the token works at all
  line(); console.log('1) GET /balance  (does the token work?)');
  {
    const r = await call('GET', '/balance');
    dump('balance', r.json ?? r.text);
    console.log(`   HTTP ${r.status} · ${r.ms}ms`);
    if (r.json) console.log(`   →`, JSON.stringify(r.json));
    else console.log(`   → (non-json) ${short(r.text)}`);
    if (r.status === 401) { console.log('\n❌ Token rejected (401). Stopping.'); return; }
  }

  // 2) Countries
  line(); console.log('2) GET /packages/country');
  {
    const r = await call('GET', '/packages/country');
    dump('packages_country', r.json ?? r.text);
    const arr = r.json?.data ?? [];
    console.log(`   HTTP ${r.status} · ${r.ms}ms · countries: ${arr.length}`);
    console.log(`   sample:`, arr.slice(0, 3).map((c) => `${c.name}(#${c.id})`).join(', '));
  }

  // 3) Continents
  line(); console.log('3) GET /packages/continent');
  {
    const r = await call('GET', '/packages/continent');
    dump('packages_continent', r.json ?? r.text);
    const arr = r.json?.data ?? [];
    console.log(`   HTTP ${r.status} · ${r.ms}ms · continents: ${arr.length}`);
    console.log(`   →`, arr.map((c) => `${c.name}(#${c.id})`).join(', '));
  }

  // 4) Packages (DATA-ONLY) — shape + pagination; grab an id for detail
  let sampleId = null;
  line(); console.log('4) GET /packages?package_type=DATA-ONLY');
  {
    const r = await call('GET', '/packages?package_type=DATA-ONLY');
    dump('packages_data_only', r.json ?? r.text);
    const arr = r.json?.data ?? [];
    console.log(`   HTTP ${r.status} · ${r.ms}ms`);
    console.log(`   meta:`, JSON.stringify(r.json?.meta ?? {}));
    if (arr[0]) {
      sampleId = arr[0].id;
      console.log(`   keys:`, Object.keys(arr[0]).join(', '));
      console.log(`   sample:`, arr.slice(0, 2).map((p) => `${p.name} = $${p.price}`).join('  |  '));
    }
  }

  // 5) Packages (DATA-VOICE-SMS)
  line(); console.log('5) GET /packages?package_type=DATA-VOICE-SMS');
  {
    const r = await call('GET', '/packages?package_type=DATA-VOICE-SMS');
    dump('packages_dvs', r.json ?? r.text);
    const arr = r.json?.data ?? [];
    console.log(`   HTTP ${r.status} · ${r.ms}ms · total: ${r.json?.meta?.total ?? '?'}`);
    if (arr[0]) console.log(`   sample:`, `${arr[0].name} = $${arr[0].price}`);
  }

  // 6) Package detail — coverage shape
  line(); console.log(`6) GET /package/detail/:id  (id = ${sampleId ?? 'n/a'})`);
  if (sampleId) {
    const r = await call('GET', `/package/detail/${sampleId}`);
    dump('package_detail', r.json ?? r.text);
    const d = r.json?.data;
    console.log(`   HTTP ${r.status} · ${r.ms}ms`);
    if (d) {
      console.log(`   name: ${d.name} · $${d.price} · ${d.data_quantity}${d.data_unit}/${d.package_validity}${d.package_validity_unit}`);
      console.log(`   keys:`, Object.keys(d).join(', '));
      const countries = d.countries ?? d.romaing_countries ?? [];
      console.log(`   countries: ${countries.length}`);
      if (countries[0]?.network_coverage?.[0])
        console.log(`   coverage sample:`, JSON.stringify(countries[0].network_coverage[0]));
    }
  } else console.log('   skipped (no sample id)');

  // 7) Pricing — full catalog size
  line(); console.log('7) GET /pricing  (full catalog)');
  {
    const r = await call('GET', '/pricing');
    dump('pricing', r.json ?? r.text);
    const countries = r.json?.data?.countries ?? [];
    const pkgCount = countries.reduce((n, c) => n + (c.packages?.length ?? 0), 0);
    console.log(`   HTTP ${r.status} · ${r.ms}ms · countries: ${countries.length} · packages: ${pkgCount}`);
  }

  // 8) My eSIMs — existing inventory (likely empty)
  line(); console.log('8) GET /my-esims');
  {
    const r = await call('GET', '/my-esims');
    dump('my_esims', r.json ?? r.text);
    console.log(`   HTTP ${r.status} · ${r.ms}ms · total: ${r.json?.meta?.total ?? '?'}`);
    if (r.json?.data?.[0]) console.log(`   keys:`, Object.keys(r.json.data[0]).join(', '));
  }

  // 9) Network coverages
  line(); console.log('9) GET /network-coverages');
  {
    const r = await call('GET', '/network-coverages');
    dump('network_coverages', r.json ?? r.text);
    const arr = r.json?.data ?? [];
    console.log(`   HTTP ${r.status} · ${r.ms}ms · countries: ${arr.length}`);
  }

  line();
  console.log(`\n✅ Done. Raw responses saved to scripts/_dumps/`);
}

main().catch((e) => { console.error('Probe crashed:', e); process.exit(1); });
