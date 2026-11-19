// Vice Cover Studio — entry program for make.fun's "Make GTA 6 Cover Art".
// Node 22, standard library only. It hands the app in: copies this
// repository's app/ and screenshots/ into the grader's output directory and
// writes /output/dossier.json with the vendored make.fun dossier builder.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function fail(message: string): never {
  throw new Error(`main.ts: ${message}`);
}

const appDir = join(repoRoot, 'app');
if (!existsSync(appDir)) fail('app/ is missing from the repository');
const indexHtml = join(appDir, 'index.html');
if (!existsSync(indexHtml)) fail('app/index.html is missing');

const shotsDir = join(repoRoot, 'screenshots');
const shots = existsSync(shotsDir)
  ? readdirSync(shotsDir).filter((name) => !name.startsWith('.'))
  : [];
if (shots.length < 3 || shots.length > 4) {
  fail(`screenshots/ must hold 3 or 4 images, found ${shots.length}`);
}

mkdirSync(outputDir, { recursive: true });
cpSync(appDir, join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
cpSync(shotsDir, join(outputDir, 'screenshots'), { recursive: true });

writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
