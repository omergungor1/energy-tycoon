// Node migration runner for Supabase Management API
import fs from 'fs';
import path from 'path';

// Load .env.local if not already populated in process.env
function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

loadEnvFile(path.resolve(process.cwd(), '.env.local'));
loadEnvFile(path.resolve(process.cwd(), '.env'));

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
if (!TOKEN) {
  console.error('Hata: SUPABASE_ACCESS_TOKEN ortam değişkeni bulunamadı.');
  console.error('Lütfen .env.local dosyanızda SUPABASE_ACCESS_TOKEN=<token> tanımlı olduğundan emin olun.');
  process.exit(1);
}

// Extract project ref from environment URL or project ref var
let PROJECT_REF = process.env.SUPABASE_PROJECT_REF;
if (!PROJECT_REF && process.env.NEXT_PUBLIC_SUPABASE_URL) {
  const match = process.env.NEXT_PUBLIC_SUPABASE_URL.match(/https:\/\/([a-z0-9]+)\.supabase\.co/);
  if (match) PROJECT_REF = match[1];
}
if (!PROJECT_REF) {
  PROJECT_REF = 'pybuhomzrxrlxbmqrwjm';
}

const ENDPOINT = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;

async function executeQuery(sql) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`SQL Failed [${res.status}]: ${errText}\nQuery:\n${sql.slice(0, 200)}...`);
  }
  return await res.json();
}

async function runFile(filePath) {
  console.log(`Running file: ${filePath}`);
  const content = fs.readFileSync(filePath, 'utf-8');

  // Split by top-level section dividers or double newlines
  const statements = [];
  let current = '';
  let inFunction = false;

  for (const line of content.split('\n')) {
    if (line.includes('$$')) {
      inFunction = !inFunction;
    }
    current += line + '\n';
    if (!inFunction && line.trim().endsWith(';')) {
      if (current.trim().length > 0) {
        statements.push(current.trim());
      }
      current = '';
    }
  }
  if (current.trim().length > 0) {
    statements.push(current.trim());
  }

  console.log(`Found ${statements.length} statements to execute.`);
  for (let i = 0; i < statements.length; i++) {
    let stmt = statements[i].replace(/^(\s*--[^\n]*\n)+/g, '').trim();
    if (!stmt) continue;
    console.log(`Executing [${i + 1}/${statements.length}]: ${stmt.slice(0, 50).replace(/\n/g, ' ')}...`);
    try {
      await executeQuery(stmt);
      console.log(`✓ [${i + 1}/${statements.length}] executed.`);
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log(`⚠ [${i + 1}/${statements.length}] Atlandı (Zaten mevcut): ${stmt.slice(0, 45)}...`);
      } else {
        console.error(`✗ Error on statement ${i + 1}:`, e.message);
        throw e;
      }
    }
  }
  console.log(`Successfully completed ${filePath}`);
}

async function main() {
  await runFile('supabase/migrations/20261029_initial_schema.sql');
  await runFile('supabase/seed.sql');
  console.log('🎉 All migrations and seed data applied successfully!');
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
