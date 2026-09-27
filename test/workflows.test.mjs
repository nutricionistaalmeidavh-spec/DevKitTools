import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

async function ler(nome){return fs.readFile(`.github/workflows/${nome}.yml`,'utf8');}

test('validar usa Node 22, npm ci, testes, catálogo e matriz',async()=>{
  const y=await ler('validar');
  for(const trecho of ['node-version: 22','npm ci','npm test','npm run validar','npm run matriz','git diff --exit-code']) assert.ok(y.includes(trecho),trecho);
});

test('montagem comercial usa origem privada e nunca exige isso no modo estrutura',async()=>{
  const y=await ler('montar-kits');
  assert.ok(y.includes('UTILIDADES_REPO_TOKEN'));
  assert.ok(y.includes('repository.private'));
  assert.ok(y.includes('actions/upload-artifact'));
  assert.ok(y.includes('somente-estrutura'));
});

test('release exige repo privado, modo privado e tag v explícita',async()=>{
  const y=await ler('release-kits');
  assert.ok(y.includes('MODO_DISTRIBUICAO'));
  assert.ok(y.includes('repository.private'));
  assert.ok(y.includes('UTILIDADES_REPO_TOKEN'));
  assert.ok(y.includes("^v[0-9]"));
  assert.ok(y.includes('gh release create'));
});
