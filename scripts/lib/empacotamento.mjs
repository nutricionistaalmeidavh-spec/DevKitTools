import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import JSZip from 'jszip';
import semver from 'semver';
import {listarArquivosPermitidos, existe, validarCaminhos} from './arquivos.mjs';
import {validarSnapshotKit} from './snapshot.mjs';

const execFileP=promisify(execFile);
const DATA_FIXA=new Date('2000-01-01T00:00:00.000Z');

export async function sha256Arquivo(arquivo){
  const b=await fs.readFile(arquivo);
  return crypto.createHash('sha256').update(b).digest('hex');
}

async function commitRepo(root){
  try{return (await execFileP('git',['-C',root,'rev-parse','HEAD'])).stdout.trim();}
  catch{return null;}
}

async function adicionarArquivos(zip,root,arquivos,prefixo){
  for(const rel of arquivos){
    validarCaminhos([rel]);
    const data=await fs.readFile(path.join(root,...rel.split('/')));
    zip.file(`${prefixo}/${rel}`,data,{date:DATA_FIXA,createFolders:true,unixPermissions:'0644'});
  }
}

export async function montarKit({kit,distDir,kitDir,repoDir=process.cwd()}){
  if(!kitDir || !(await existe(kitDir))) throw new Error(`Documentação comercial do kit não encontrada: ${kitDir}`);
  const {arquivos:produto}=await validarSnapshotKit({kit,kitDir});
  const produtoDir=path.join(kitDir,'produto');
  const todosKit=await listarArquivosPermitidos(kitDir);
  const docs=todosKit.filter(rel=>!rel.startsWith('produto/'));

  const zip=new JSZip();
  const prefixo=kit.slug;
  await adicionarArquivos(zip,kitDir,docs,prefixo);
  await adicionarArquivos(zip,produtoDir,produto,`${prefixo}/produto`);

  const devkitCommit=await commitRepo(repoDir);
  const arquivos=[
    ...docs.map(x=>`${prefixo}/${x}`),
    ...produto.map(x=>`${prefixo}/produto/${x}`),
    `${prefixo}/MANIFESTO-BUILD.json`
  ].sort();
  const manifesto={
    schemaVersion:2,
    sku:kit.sku,
    idTecnico:kit.idTecnico,
    slug:kit.slug,
    versao:kit.versao,
    commitSnapshot:kit.origem?.commitSnapshot??null,
    importadoEm:kit.origem?.importadoEm??null,
    devkitCommit,
    arquivos
  };
  zip.file(`${prefixo}/MANIFESTO-BUILD.json`,JSON.stringify(manifesto,null,2)+'\n',{date:DATA_FIXA,unixPermissions:'0644'});

  await fs.mkdir(distDir,{recursive:true});
  const zipPath=path.join(distDir,kit.zip ?? `${kit.slug}-v${kit.versao}.zip`);
  const buffer=await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE',compressionOptions:{level:9},platform:'UNIX'});
  await fs.writeFile(zipPath,buffer);
  return {zipPath,sha256:await sha256Arquivo(zipPath),arquivos,devkitCommit};
}

export function validarPacote(pacote,slugsExistentes){
  if(!semver.valid(pacote.versao)) throw new Error(`Pacote ${pacote.slug}: versão inválida`);
  const vistos=new Set();
  for(const slug of pacote.kits){
    if(vistos.has(slug)) throw new Error(`Pacote ${pacote.slug}: kit duplicado ${slug}`);
    vistos.add(slug);
    if(!slugsExistentes.has(slug)) throw new Error(`Pacote ${pacote.slug}: kit inexistente ${slug}`);
  }
  return true;
}

export async function montarPacote({pacote,catalogo,distDir,pacoteDir}){
  const slugs=new Set(catalogo.kits.map(k=>k.slug));
  validarPacote(pacote,slugs);
  const zip=new JSZip();
  const prefixo=pacote.slug;
  const docs=await listarArquivosPermitidos(pacoteDir);
  await adicionarArquivos(zip,pacoteDir,docs,prefixo);
  for(const slug of [...pacote.kits].sort()){
    const kit=catalogo.kits.find(k=>k.slug===slug);
    const origem=path.join(distDir,kit.zip);
    if(!(await existe(origem))) throw new Error(`ZIP do kit ausente para pacote ${pacote.nome}: ${kit.zip}`);
    zip.file(`${prefixo}/kits/${kit.zip}`,await fs.readFile(origem),{date:DATA_FIXA,unixPermissions:'0644'});
  }
  const zipPath=path.join(distDir,pacote.zip ?? `${pacote.slug}-v${pacote.versao}.zip`);
  await fs.mkdir(distDir,{recursive:true});
  await fs.writeFile(zipPath,await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE',compressionOptions:{level:9},platform:'UNIX'}));
  return {zipPath,sha256:await sha256Arquivo(zipPath)};
}
