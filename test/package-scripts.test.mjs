import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

test('npm test executa somente a suite estrutural raiz', async () => {
  const pkg = JSON.parse(await fs.readFile('package.json', 'utf8'));
  assert.equal(pkg.scripts.test, 'node --test "test/*.test.mjs"');
});
