#!/usr/bin/env node
/**
 * Generate Supabase database TypeScript types.
 * Strategy:
 * 1. Try local (Docker) supabase instance.
 * 2. If Docker not running OR command fails, and env SUPABASE_PROJECT_ID is set, try remote.
 * 3. If both fail, ensure placeholder `Database` type so build does not break.
 */
import { execSync } from 'node:child_process';
import { writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const outFile = join(__dirname, '..', 'src', 'lib', 'database.types.ts');

function writePlaceholder(reason) {
  const content = `// Auto-generated fallback Supabase types.\n// Reason: ${reason}\n// Update: run: npm run types-gen-local (with local stack running) or set SUPABASE_PROJECT_ID and rerun build.\nexport type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];\nexport interface Database { public: { Tables: {}; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {} } }\nexport type { Database as DB };\n`;
  writeFileSync(outFile, content, 'utf8');
  console.warn(`[types:gen] Wrote placeholder types (${reason}).`);
}

function run(cmd) {
  execSync(cmd, { stdio: 'pipe', encoding: 'utf8' });
}

let success = false;

// 1. Try local
try {
  run('supabase gen types typescript --local --schema public');
  // If succeeds, we need to capture output separately (supabase CLI prints to stdout). Re-run capturing.
  const local = execSync('supabase gen types typescript --local --schema public', { encoding: 'utf8' });
  writeFileSync(outFile, local, 'utf8');
  console.log('[types:gen] Generated types from local Supabase.');
  success = true;
} catch (e) {
  console.warn('[types:gen] Local generation failed:', e.message.split('\n')[0]);
}

// 2. Remote if not success
if (!success) {
  const projectId = process.env.SUPABASE_PROJECT_ID;
  if (projectId) {
    try {
      const remote = execSync(`supabase gen types typescript --project-id ${projectId} --schema public`, { encoding: 'utf8' });
      writeFileSync(outFile, remote, 'utf8');
      console.log('[types:gen] Generated types from remote project.');
      success = true;
    } catch (e) {
      console.warn('[types:gen] Remote generation failed:', e.message.split('\n')[0]);
    }
  } else {
    console.warn('[types:gen] SUPABASE_PROJECT_ID not set; skipping remote generation.');
  }
}

// 3. Placeholder if still not success
if (!success) {
  writePlaceholder('could not reach local or remote Supabase');
}
