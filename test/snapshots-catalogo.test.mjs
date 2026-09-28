import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

async function api(){
  try{return await import('../scripts/validar-snapshots.mjs');}
  catch(error){assert.fail(`validar-snapshots.mjs indisponível: ${error.code ?? error.message}`);}
}

function kit(slug,{build=true,proveniencia=true}={}){
  return {slug,nome:slug,build:{habilitado:build},origem:{repositorio:'x',caminho:`modules/${slug}`,...(proveniencia?{commitSnapshot:'abc123',importadoEm:'2026-09-27T20:00:00.000Z'}:{commit:null})}};
}

async function criarKit(root,k,{produto=true,manifesto=true}={}){
  const dir=path.join(root,k.slug);
  await fs.mkdir(dir,{recursive:true});
  if(produto){await fs.mkdir(path.join(dir,'produto'),{recursive:true});await fs.writeFile(path.join(dir,'produto','index.js'),'export default true;\n');}
  if(manifesto) await fs.writeFile(path.join(dir,'kit.json'),JSON.stringify(k,null,2)+'\n');
}

test('valida snapshots presentes, proveniência e kit.json sincronizado', async()=>{
  const {validarSnapshotsCatalogo}=await api();
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'dkt-all-snap-'));
  const ativo=kit('ativo'); const semBuild=kit('sem-build',{build:false,proveniencia:false});
  await criarKit(root,ativo);
  await criarKit(root,semBuild,{produto:false});
  const resultado=await validarSnapshotsCatalogo({catalogo:{kits:[ativo,semBuild]},kitsRoot:root});
  assert.equal(resultado.ok,true);
  assert.equal(resultado.totalValidados,1);
  assert.deepEqual(resultado.erros,[]);
});

test('reporta produto ausente, proveniência ausente e manifesto divergente', async()=>{
  const {validarSnapshotsCatalogo}=await api();
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'dkt-all-snap-'));
  const semProduto=kit('sem-produto');
  const semOrigem=kit('sem-origem',{proveniencia:false});
  const divergente=kit('divergente');
  await criarKit(root,semProduto,{produto:false});
  await criarKit(root,semOrigem);
  await criarKit(root,{...divergente,nome:'outro'},{produto:true});
  const resultado=await validarSnapshotsCatalogo({catalogo:{kits:[semProduto,semOrigem,divergente]},kitsRoot:root});
  assert.equal(resultado.ok,false);
  assert.ok(resultado.erros.some(e=>e.includes('sem-produto')&&/produto/i.test(e)));
  assert.ok(resultado.erros.some(e=>e.includes('sem-origem')&&/proveniência|commitSnapshot/i.test(e)));
  assert.ok(resultado.erros.some(e=>e.includes('divergente')&&/kit\.json|diverg/i.test(e)));
});
