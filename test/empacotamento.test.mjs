import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import JSZip from 'jszip';
import {montarKit} from '../scripts/lib/empacotamento.mjs';

const kit={slug:'backup-e-restauracao',nome:'Backup e Restauração',versao:'0.2.0',idTecnico:'artisys-backup',zip:'backup-e-restauracao-v0.2.0.zip',origem:{caminho:'modules/artisys-backup'}};

test('falha com mensagem acionável quando origem não existe', async()=>{
  await assert.rejects(()=>montarKit({kit,origemUtilidades:'/nao/existe',distDir:'/tmp/dist-x',kitDir:'/tmp/kit-x'}),/--origem|UTILIDADES_PATH/);
});

test('gera ZIP canônico, SHA-256 e ordem lógica reprodutível', async()=>{
  const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'dkt-'));
  const origem=path.join(tmp,'utilidades'); const modulo=path.join(origem,'modules','artisys-backup'); const kitDir=path.join(tmp,'kit'); const dist=path.join(tmp,'dist');
  await fs.mkdir(modulo,{recursive:true}); await fs.mkdir(kitDir,{recursive:true});
  await fs.writeFile(path.join(modulo,'index.js'),'export const backup=true;\n');
  await fs.writeFile(path.join(modulo,'LICENSE'),'MIT fixture\n');
  for(const f of ['README.md','INSTALACAO.md','INTEGRACAO.md','CHANGELOG.md','TERCEIROS-E-LICENCAS.md']) await fs.writeFile(path.join(kitDir,f),`# ${f}\n`);
  await fs.writeFile(path.join(kitDir,'kit.json'),JSON.stringify(kit));
  const a=await montarKit({kit,origemUtilidades:origem,distDir:dist,kitDir});
  const b=await montarKit({kit,origemUtilidades:origem,distDir:dist,kitDir});
  assert.equal(path.basename(a.zipPath),kit.zip);
  assert.match(a.sha256,/^[a-f0-9]{64}$/);
  assert.deepEqual(a.arquivos,b.arquivos);
  const zip=await JSZip.loadAsync(await fs.readFile(a.zipPath));
  assert.ok(Object.keys(zip.files).some(x=>x.endsWith('/README.md')));
  assert.ok(Object.keys(zip.files).some(x=>x.includes('/fonte/index.js')));
});
