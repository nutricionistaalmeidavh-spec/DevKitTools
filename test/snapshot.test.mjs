import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

async function api(){
  try{return await import('../scripts/lib/snapshot.mjs');}
  catch(error){assert.fail(`snapshot.mjs indisponível: ${error.code ?? error.message}`);}
}

async function fixture(){
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'dkt-snapshot-'));
  const origem=path.join(root,'origem');
  const kitDir=path.join(root,'kit');
  const produto=path.join(kitDir,'produto');
  await fs.mkdir(path.join(origem,'src'),{recursive:true});
  await fs.mkdir(path.join(origem,'tests'),{recursive:true});
  await fs.mkdir(path.join(origem,'examples'),{recursive:true});
  await fs.mkdir(path.join(origem,'bin'),{recursive:true});
  await fs.writeFile(path.join(origem,'src','index.js'),'export const ok=true;\n');
  await fs.writeFile(path.join(origem,'tests','index.test.js'),'// teste\n');
  await fs.writeFile(path.join(origem,'examples','uso.js'),'// exemplo\n');
  await fs.writeFile(path.join(origem,'bin','cli.js'),'// cli\n');
  await fs.writeFile(path.join(origem,'package.json'),'{}\n');
  await fs.writeFile(path.join(origem,'module.json'),'{}\n');
  await fs.writeFile(path.join(origem,'LICENSE'),'MIT fixture\n');
  await fs.writeFile(path.join(origem,'NOTICE'),'Aviso fixture\n');
  await fs.writeFile(path.join(origem,'.env.example'),'TOKEN=SEU_TOKEN_AQUI\n');
  return {root,origem,kitDir,produto};
}

test('copia snapshot permitido e remove arquivo obsoleto do destino anterior', async()=>{
  const {copiarSnapshot}=await api();
  const {origem,produto}=await fixture();
  await fs.mkdir(produto,{recursive:true});
  await fs.writeFile(path.join(produto,'obsoleto.txt'),'antigo\n');
  const resultado=await copiarSnapshot({origemModulo:origem,destinoProduto:produto});
  assert.ok(resultado.arquivos.includes('src/index.js'));
  assert.ok(resultado.arquivos.includes('tests/index.test.js'));
  assert.ok(resultado.arquivos.includes('examples/uso.js'));
  assert.ok(resultado.arquivos.includes('bin/cli.js'));
  assert.ok(resultado.arquivos.includes('package.json'));
  assert.ok(resultado.arquivos.includes('module.json'));
  assert.ok(resultado.arquivos.includes('LICENSE'));
  assert.ok(resultado.arquivos.includes('NOTICE'));
  assert.ok(resultado.arquivos.includes('.env.example'));
  await assert.rejects(fs.access(path.join(produto,'obsoleto.txt')));
});

test('arquivo sensível aninhado bloqueia a cópia do snapshot', async()=>{
  const {copiarSnapshot}=await api();
  for(const rel of ['src/.env','tests/chave.pem','dados/clientes.sqlite','logs/app.log','nested/credentials.json','node_modules/x.js','.git/config']){
    const {origem,produto}=await fixture();
    const alvo=path.join(origem,...rel.split('/'));
    await fs.mkdir(path.dirname(alvo),{recursive:true});
    await fs.writeFile(alvo,'segredo\n');
    await assert.rejects(()=>copiarSnapshot({origemModulo:origem,destinoProduto:produto}),/Arquivo bloqueado/);
  }
});

test('validarSnapshotKit exige produto para kit com build habilitado', async()=>{
  const {validarSnapshotKit}=await api();
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'dkt-kit-'));
  const kit={slug:'backup-e-restauracao',build:{habilitado:true}};
  await assert.rejects(()=>validarSnapshotKit({kit,kitDir:root}),/produto.*backup-e-restauracao|backup-e-restauracao.*produto/i);
});

test('validarSnapshotKit aceita kit sem build mesmo sem produto', async()=>{
  const {validarSnapshotKit}=await api();
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'dkt-kit-'));
  const resultado=await validarSnapshotKit({kit:{slug:'planejado',build:{habilitado:false}},kitDir:root});
  assert.deepEqual(resultado.arquivos,[]);
});
