import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {isDeepStrictEqual} from 'node:util';
import {carregarCatalogo} from './lib/catalogo.mjs';
import {validarSnapshotKit} from './lib/snapshot.mjs';

export async function validarSnapshotsCatalogo({catalogo,kitsRoot}){
  const erros=[];
  let totalValidados=0;
  for(const kit of catalogo.kits??[]){
    if(!kit.build?.habilitado) continue;
    totalValidados++;
    const kitDir=path.join(kitsRoot,kit.slug);
    try{await validarSnapshotKit({kit,kitDir});}
    catch(error){erros.push(`${kit.slug}: ${error.message}`);continue;}

    if(!kit.origem?.commitSnapshot || !kit.origem?.importadoEm){
      erros.push(`${kit.slug}: proveniência incompleta; commitSnapshot/importadoEm são obrigatórios.`);
    }

    try{
      const manifesto=JSON.parse(await fs.readFile(path.join(kitDir,'kit.json'),'utf8'));
      if(!isDeepStrictEqual(manifesto,kit)) erros.push(`${kit.slug}: kit.json diverge do catálogo.`);
    }catch(error){
      erros.push(`${kit.slug}: kit.json indisponível ou inválido (${error.message}).`);
    }
  }
  return {ok:erros.length===0,erros,totalValidados};
}

async function main(){
  const repoDir=process.cwd();
  const catalogo=await carregarCatalogo(repoDir);
  const resultado=await validarSnapshotsCatalogo({catalogo,kitsRoot:path.join(repoDir,'kits')});
  if(!resultado.ok){
    console.error(`Snapshots inválidos (${resultado.erros.length} problema(s)):`);
    for(const erro of resultado.erros) console.error(`- ${erro}`);
    process.exitCode=1;
    return;
  }
  console.log(`Snapshots válidos: ${resultado.totalValidados} kits com build habilitado.`);
}

if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) await main();
