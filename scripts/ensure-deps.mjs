import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const projectRoot = process.cwd();
const nodeModulesDir = path.join(projectRoot, 'node_modules');
const packageLockPath = path.join(projectRoot, 'package-lock.json');

function hasNodeModules() {
  try {
    const stat = fs.statSync(nodeModulesDir);
    if (!stat.isDirectory()) return false;

    const entries = fs.readdirSync(nodeModulesDir);
    return entries.length > 0;
  } catch {
    return false;
  }
}

function runNpmInstall() {
  const hasLock = fs.existsSync(packageLockPath);
  const args = hasLock ? ['ci'] : ['install'];

  const result = spawnSync('npm', args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    cwd: projectRoot,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (!hasNodeModules()) {
  console.log('[ensure-deps] Installing dependencies (node_modules missing)…');
  runNpmInstall();
}

