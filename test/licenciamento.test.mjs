import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

async function ler(path) {
  return fs.readFile(path, 'utf8');
}

test('raiz declara repositorio multi-licenca e preserva Apache separadamente', async () => {
  const [rootLicense, apacheText, scopeDoc] = await Promise.all([
    ler('LICENSE'),
    ler('LICENSE-APACHE-2.0'),
    ler('docs/ESCOPO-DE-LICENCAS.md')
  ]);

  assert.match(rootLicense, /repositório multi-licença/i);
  assert.match(scopeDoc, /kits\/\*\/produto\//);
  assert.match(scopeDoc, /não.*automaticamente.*Apache/is);
  assert.match(apacheText, /Apache License\s+Version 2\.0/i);
});

test('escopo exige preservar LICENSE NOTICE e revisar licenca antes de pronto', async () => {
  const scopeDoc = await ler('docs/ESCOPO-DE-LICENCAS.md');
  assert.match(scopeDoc, /LICENSE/);
  assert.match(scopeDoc, /NOTICE/);
  assert.match(scopeDoc, /licencasConferidas\s*=\s*false/);
  assert.match(scopeDoc, /não.*pronto/is);
});
