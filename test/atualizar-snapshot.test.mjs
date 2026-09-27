import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

async function api(){
  try{return await import('../scripts/atualizar-snapshot.mjs');}
  catch(error){assert.fail(`atualizar-snapshot.mjs indisponível: ${error.code ?? error.message}`);}
}

async function fixture(){
  const repoDir=await fs.mkdtemp(path.join(os.tmpdir(),'dkt-update-'));
  const origemRoot=path.join(repoDir,'upstream');
  const modulo=path.join(origemRoot,'modules','artisys-backup');
  const kitDir=path.join(repoDir,'kits','backup-e-restauracao');
  await fs.mkdir(path.join(repoDir,'catalogo'),{recursive:true});
  await fs.mkdir(modulo,{recursive:true});
  await fs.mkdir(kitDir,{recursive:true});
  await fs.writeFile(path.join(modulo,'index.js'),'export const backup=true;\n');
  await fs.writeFile(path.join(modulo,'LICENSE'),'MIT fixture\n');
  const kit={
    schemaVersion:1,sku:'DKT-PLAT-001',idTecnico:'artisys-backup',slug:'backup-e-restauracao',nome:'Backup e Restauração',descricao:'Backup.',categoria:'Plataforma e Dados',versao:'0.2.0',estadoTecnico:'implemented',estadoComercial:'qa',
    origem:{repositorio:'nutricionistaalmeidavh-spec/utilidades',caminho:'modules/artisys-backup',commit:'legado'},runtime:['node'],dependenciaPagaObrigatoria:false,dependenciasOpcionais:[],upstreams:[],inclui:[],naoInclui:[],comandosValidacao:[],precoSugeridoBRL:79,documentacaoConferida:true,licencasConferidas:false,build:{habilitado:true},zip:'backup-e-restauracao-v0.2.0.zip'
  };
  const catalogo={schemaVersion:1,locale:'pt-BR',modoDistribuicao:'publico-desenvolvimento',kits:[kit]};
  await fs.writeFile(path.join(repoDir,'catalogo','kits.json'),JSON.stringify(catalogo,null,2)+'\n');
  await fs.writeFile(path.join(kitDir,'kit.json'),JSON.stringify(kit,null,2)+'\n');
  return {repoDir,origemRoot,kit};
}

test('atualiza um snapshot, registra proveniência e preserva campos comerciais', async()=>{
  const {atualizarSnapshots}=await api();
  const {repoDir,origemRoot}=await fixture();
  const agora=new Date('2026-09-27T20:00:00.000Z');
  const resultado=await atualizarSnapshots({repoDir,origemRoot,slugs:['backup-e-restauracao'],agora,obterCommit:async()=> 'abc123'});
  assert.equal(resultado.atualizados.length,1);
  const catalogo=JSON.parse(await fs.readFile(path.join(repoDir,'catalogo','kits.json'),'utf8'));
  const kit=catalogo.kits[0];
  assert.equal(kit.estadoComercial,'qa');
  assert.equal(kit.precoSugeridoBRL,79);
  assert.equal(kit.documentacaoConferida,true);
  assert.equal(kit.origem.commitSnapshot,'abc123');
  assert.equal(kit.origem.importadoEm,'2026-09-27T20:00:00.000Z');
  assert.ok(!Object.hasOwn(kit.origem,'commit'));
  assert.equal(await fs.readFile(path.join(repoDir,'kits','backup-e-restauracao','produto','index.js'),'utf8'),'export const backup=true;\n');
  const manifesto=JSON.parse(await fs.readFile(path.join(repoDir,'kits','backup-e-restauracao','kit.json'),'utf8'));
  assert.deepEqual(manifesto,kit);
});

test('falha para slug inexistente sem alterar o catálogo', async()=>{
  const {atualizarSnapshots}=await api();
  const {repoDir,origemRoot}=await fixture();
  const antes=await fs.readFile(path.join(repoDir,'catalogo','kits.json'),'utf8');
  await assert.rejects(()=>atualizarSnapshots({repoDir,origemRoot,slugs:['nao-existe'],obterCommit:async()=> 'abc'}),/não encontrado|inexistente/i);
  assert.equal(await fs.readFile(path.join(repoDir,'catalogo','kits.json'),'utf8'),antes);
});

test('modo todos seleciona todos os kits com build habilitado', async()=>{
  const {atualizarSnapshots}=await api();
  const {repoDir,origemRoot}=await fixture();
  const catalogoPath=path.join(repoDir,'catalogo','kits.json');
  const catalogo=JSON.parse(await fs.readFile(catalogoPath,'utf8'));
  catalogo.kits.push({...catalogo.kits[0],sku:'DKT-PLAT-002',idTecnico:'artisys-sem-build',slug:'sem-build',nome:'Sem Build',origem:{repositorio:'x',caminho:'modules/artisys-sem-build',commit:null},build:{habilitado:false}});
  await fs.writeFile(catalogoPath,JSON.stringify(catalogo,null,2)+'\n');
  const resultado=await atualizarSnapshots({repoDir,origemRoot,todos:true,obterCommit:async()=> 'abc'});
  assert.deepEqual(resultado.atualizados,['backup-e-restauracao']);
});
