import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import JSZip from 'jszip';
import {montarKit} from '../scripts/lib/empacotamento.mjs';

const kit={schemaVersion:1,sku:'DKT-PLAT-001',slug:'backup-e-restauracao',nome:'Backup e Restauração',versao:'0.2.0',idTecnico:'artisys-backup',zip:'backup-e-restauracao-v0.2.0.zip',origem:{repositorio:'nutricionistaalmeidavh-spec/utilidades',caminho:'modules/artisys-backup',commitSnapshot:'abc123',importadoEm:'2026-09-27T20:00:00.000Z'},build:{habilitado:true}};

async function fixture({comProduto=true}={}){
  const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'dkt-pack-'));
  const kitDir=path.join(tmp,'kits',kit.slug); const dist=path.join(tmp,'dist');
  await fs.mkdir(kitDir,{recursive:true});
  for(const f of ['README.md','INSTALACAO.md','INTEGRACAO.md','CHANGELOG.md','TERCEIROS-E-LICENCAS.md']) await fs.writeFile(path.join(kitDir,f),`# ${f}\n`);
  await fs.writeFile(path.join(kitDir,'kit.json'),JSON.stringify(kit,null,2)+'\n');
  if(comProduto){
    await fs.mkdir(path.join(kitDir,'produto','src'),{recursive:true});
    await fs.writeFile(path.join(kitDir,'produto','src','index.js'),'export const backup=true;\n');
    await fs.writeFile(path.join(kitDir,'produto','LICENSE'),'MIT fixture\n');
  }
  return {tmp,kitDir,dist};
}

test('falha com mensagem acionável quando produto local não existe', async()=>{
  const {tmp,kitDir,dist}=await fixture({comProduto:false});
  await assert.rejects(()=>montarKit({kit,distDir:dist,kitDir,repoDir:tmp}),/produto/i);
});

test('gera ZIP canônico autocontido, SHA-256 determinístico e manifesto de proveniência', async()=>{
  const {tmp,kitDir,dist}=await fixture();
  const a=await montarKit({kit,distDir:dist,kitDir,repoDir:tmp});
  const b=await montarKit({kit,distDir:dist,kitDir,repoDir:tmp});
  assert.equal(path.basename(a.zipPath),kit.zip);
  assert.match(a.sha256,/^[a-f0-9]{64}$/);
  assert.equal(a.sha256,b.sha256);
  assert.deepEqual(a.arquivos,b.arquivos);
  const zip=await JSZip.loadAsync(await fs.readFile(a.zipPath));
  const nomes=Object.keys(zip.files);
  assert.ok(nomes.some(x=>x.endsWith('/README.md')));
  assert.ok(nomes.some(x=>x.includes('/produto/src/index.js')));
  assert.equal(nomes.some(x=>x.includes('/fonte/')),false);
  const manifestoPath=`${kit.slug}/MANIFESTO-BUILD.json`;
  const manifesto=JSON.parse(await zip.file(manifestoPath).async('string'));
  assert.equal(manifesto.sku,kit.sku);
  assert.equal(manifesto.idTecnico,kit.idTecnico);
  assert.equal(manifesto.slug,kit.slug);
  assert.equal(manifesto.versao,kit.versao);
  assert.equal(manifesto.commitSnapshot,'abc123');
  assert.ok(manifesto.arquivos.includes(`${kit.slug}/produto/src/index.js`));
});

test('scripts de montagem não referenciam origem utilidades nem UTILIDADES_PATH', async()=>{
  const caminhos=['scripts/montar-kit.mjs','scripts/montar-todos.mjs','scripts/montar-todos.ps1'];
  for(const caminho of caminhos){
    const texto=await fs.readFile(caminho,'utf8');
    assert.doesNotMatch(texto,/UTILIDADES_PATH|OrigemUtilidades|--origem|origemUtilidades/);
  }
});
