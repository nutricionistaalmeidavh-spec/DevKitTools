import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

async function ler(nome){return fs.readFile(`.github/workflows/${nome}.yml`,'utf8');}

for(const nome of ['validar','montar-kits','release-kits']){
  test(`${nome} não depende do repositório utilidades`,async()=>{
    const y=await ler(nome);
    assert.doesNotMatch(y,/UTILIDADES_REPO_TOKEN/);
    assert.doesNotMatch(y,/UTILIDADES_PATH/);
    assert.doesNotMatch(y,/repository:\s*nutricionistaalmeidavh-spec\/utilidades/);
  });
}

test('validar usa Node 22 e executa todos os gates autocontidos',async()=>{
  const y=await ler('validar');
  for(const trecho of ['node-version: 22','npm ci','npm test','npm run validar','npm run validar:snapshots','npm run verificar:secrets','npm run matriz','git diff --exit-code']) assert.ok(y.includes(trecho),trecho);
});

test('montagem oferece modo QA e comercial usando apenas snapshots locais',async()=>{
  const y=await ler('montar-kits');
  assert.match(y,/modo:/);
  assert.match(y,/qa/);
  assert.match(y,/comercial/);
  assert.ok(y.includes('npm run validar:snapshots'));
  assert.ok(y.includes('npm run montar:todos -- --todos --dist dist'));
  assert.ok(y.includes('npm run montar:todos -- --dist dist'));
  assert.ok(y.includes('npm run montar:pacotes -- --todos'));
  assert.ok(y.includes('npm run montar:pacotes'));
  assert.ok(y.includes('actions/upload-artifact'));
  assert.doesNotMatch(y,/somente-estrutura/);
});

test('release exige repo privado, modo privado, tag v explícita e build local',async()=>{
  const y=await ler('release-kits');
  assert.ok(y.includes('MODO_DISTRIBUICAO'));
  assert.ok(y.includes('repository.private'));
  assert.ok(y.includes("^v[0-9]"));
  assert.ok(y.includes('npm run validar:snapshots'));
  assert.ok(y.includes('npm run montar:todos -- --dist dist'));
  assert.ok(y.includes('npm run montar:pacotes'));
  assert.ok(y.includes('gh release create'));
});
