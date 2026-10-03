import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (['node_modules', '.git'].includes(entry.name)) return [];
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? sourceFiles(file) : /\.(?:js|md|json)$/.test(file) ? [file] : [];
  });
}

test('public source and documentation contain English rather than Chinese text', () => {
  for (const file of sourceFiles(root)) {
    assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /[\u3400-\u9fff]/u, file);
  }
});
