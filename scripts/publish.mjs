#!/usr/bin/env node
/** dgdfurkan/CigerciMiqqo + cigercimiqqo/Menu — tek seferde push */
const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const TOKEN = execSync('gh auth token', { encoding: 'utf8' }).trim();
const AUTH = { username: 'x-access-token', password: TOKEN };
const REMOTES = [
  { name: 'origin', url: 'https://github.com/dgdfurkan/CigerciMiqqo.git' },
  { name: 'menu', url: 'https://github.com/cigercimiqqo/Menu.git' },
];

const SKIP = new Set(['.git', 'node_modules', 'menu-deploy', '.DS_Store', '.github']);

function listFiles(dir, base = dir) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) out.push(...listFiles(full, base));
    else out.push(path.relative(base, full).replace(/\\/g, '/'));
  }
  return out;
}

(async () => {
  const message = process.argv[2] || '🚀 update menu';
  const files = listFiles(ROOT);

  for (const file of files) {
    await git.add({ fs, dir: ROOT, filepath: file });
  }

  let committed = false;
  try {
    const sha = await git.commit({
      fs,
      dir: ROOT,
      message,
      author: { name: 'dgdfurkan', email: 'dgdfurkan@users.noreply.github.com' },
    });
    console.log('commit', sha);
    committed = true;
  } catch (error) {
    if (!/nothing to commit/i.test(String(error))) throw error;
    console.log('no local changes, pushing existing commits');
  }

  for (const remote of REMOTES) {
    await git.push({
      fs,
      http,
      dir: ROOT,
      remote: remote.name,
      ref: 'main',
      url: remote.url,
      onAuth: () => AUTH,
      force: false,
    });
    console.log('pushed →', remote.url);
  }

  if (committed) console.log('done');
})().catch(error => {
  console.error(error.message || error);
  process.exit(1);
});
