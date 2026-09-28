import fs from 'node:fs/promises';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import {copiarSnapshot} from './lib/snapshot.mjs';

const execFileP=promisify(execFile);

async function commitGit(root){
  try{return (await execFileP('git',['-C',root,'rev-parse','HEAD'])).stdout.trim();}
  catch(error){throw new Error(`Não foi possível detectar o commit da origem: ${error.message}`);}
}

function json(valor){return JSON.stringify(valor,null,2)+'\n';}

export async function atualizarSnapshots({repoDir=process.cwd(),origemRoot,slugs=[],todos=false,agora=new Date(),obterCommit=commitGit}){
  if(!origemRoot) throw new Error('Informe a origem de manutenção do snapshot.');
  const catalogoPath=path.join(repoDir,'catalogo','kits.json');
  const catalogo=JSON.parse(await fs.readFile(catalogoPath,'utf8'));
  const porSlug=new Map(catalogo.kits.map(k=>[k.slug,k]));

  let selecionados;
  if(todos){
    selecionados=catalogo.kits.filter(k=>k.build?.habilitado);
  }else{
    if(!slugs.length) throw new Error('Informe --kit <slug> ou --todos.');
    const faltantes=slugs.filter(slug=>!porSlug.has(slug));
    if(faltantes.length) throw new Error(`Kit não encontrado: ${faltantes.join(', ')}`);
    selecionados=slugs.map(slug=>porSlug.get(slug));
  }

  const commitSnapshot=await obterCommit(origemRoot);
  const importadoEm=(agora instanceof Date?agora:new Date(agora)).toISOString();
  const atualizados=[];

  for(const atual of selecionados){
    const modulo=path.join(origemRoot,...atual.origem.caminho.split('/'));
    const kitDir=path.join(repoDir,'kits',atual.slug);
    const destinoProduto=path.join(kitDir,'produto');
    await copiarSnapshot({origemModulo:modulo,destinoProduto});

    const origem={...atual.origem,commitSnapshot,importadoEm};
    delete origem.commit;
    const novo={...atual,origem};
    const indice=catalogo.kits.findIndex(k=>k.slug===atual.slug);
    catalogo.kits[indice]=novo;
    await fs.writeFile(path.join(kitDir,'kit.json'),json(novo));
    atualizados.push(atual.slug);
  }

  await fs.writeFile(catalogoPath,json(catalogo));
  return {atualizados,commitSnapshot,importadoEm};
}

function valorArg(nome){const i=process.argv.indexOf(nome);return i>=0?process.argv[i+1]:null;}

async function main(){
  const kit=valorArg('--kit');
  const todos=process.argv.includes('--todos');
  if(Boolean(kit)===todos) throw new Error('Informe exatamente uma opção: --kit <slug> ou --todos.');
  const origem=valorArg('--origem')||process.env.SNAPSHOT_ORIGEM_PATH;
  if(!origem) throw new Error('Informe --origem <path> ou SNAPSHOT_ORIGEM_PATH.');
  const resultado=await atualizarSnapshots({origemRoot:path.resolve(origem),slugs:kit?[kit]:[],todos});
  console.log(`Snapshots atualizados: ${resultado.atualizados.length}. Origem ${resultado.commitSnapshot}.`);
}

if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  await main();
}
