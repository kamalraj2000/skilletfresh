import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// Load the repo-root .env regardless of where the process starts.
export const AGENT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const REPO_ROOT = path.resolve(AGENT_DIR, '..');
dotenv.config({ path: path.join(REPO_ROOT, '.env'), quiet: true });

export const AGENT_MODEL = process.env.AGENT_MODEL ?? 'claude-opus-4-8';
export const FDC_API_KEY = process.env.FDC_API_KEY ?? 'DEMO_KEY';
export const RECIPE_SOURCE = process.env.RECIPE_SOURCE === 'corpus' ? 'corpus' : 'live';
