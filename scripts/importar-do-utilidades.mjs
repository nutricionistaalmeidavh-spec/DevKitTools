import fs from 'node:fs/promises';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {reconciliarCatalogos, criarPacotes, gerarMatrizMarkdown} from './lib/catalogo.mjs';

const execFileP=promisify(execFile);
function arg(nome){const i=process.argv.indexOf(nome);return i>=0?process.argv[i+1]:null;}
const origem=path.resolve(arg('--origem')||process.env.UTILIDADES_PATH||'');
if(!arg('--origem')&&!process.env.UTILIDADES_PATH) throw new Error('Informe --origem <path> ou UTILIDADES_PATH.');
const tecnico=JSON.parse(await fs.readFile(path.join(origem,'catalog','modules.json'),'utf8'));
const apresentacao=JSON.parse(await fs.readFile(path.join(origem,'catalog','module-display.pt-BR.json'),'utf8'));
let existente={schemaVersion:1,locale:'pt-BR',modoDistribuicao:'publico-desenvolvimento',kits:[]};
try{existente=JSON.parse(await fs.readFile('catalogo/kits.json','utf8'));}catch{}
const {kits,divergencias}=reconciliarCatalogos({tecnico,apresentacao,overrides:existente.kits});
if(divergencias.somenteTecnico.length||divergencias.somenteApresentacao.length){
  const linhas=[];if(divergencias.somenteTecnico.length)linhas.push(`Sem nome pt-BR: ${divergencias.somenteTecnico.join(', ')}`);if(divergencias.somenteApresentacao.length)linhas.push(`Sem módulo técnico: ${divergencias.somenteApresentacao.join(', ')}`);throw new Error(`Catálogos do utilidades divergentes. ${linhas.join(' | ')}`);
}
let commit=null;try{commit=(await execFileP('git',['-C',origem,'rev-parse','HEAD'])).stdout.trim();}catch{}
for(const k of kits)k.origem.commit=commit;
const catalogo={schemaVersion:1,locale:'pt-BR',modoDistribuicao:existente.modoDistribuicao??'publico-desenvolvimento',kits};
if(process.argv.includes('--escrever-snapshots')){await fs.mkdir('catalogo/origem',{recursive:true});await fs.writeFile('catalogo/origem/modules.snapshot.json',JSON.stringify(tecnico,null,2)+'\n');await fs.writeFile('catalogo/origem/module-display.pt-BR.snapshot.json',JSON.stringify(apresentacao,null,2)+'\n');}
if(process.argv.includes('--atualizar-catalogo')){await fs.writeFile('catalogo/kits.json',JSON.stringify(catalogo,null,2)+'\n');await fs.writeFile('catalogo/pacotes.json',JSON.stringify(criarPacotes(catalogo),null,2)+'\n');await fs.writeFile('catalogo/MATRIZ-KITS.md',gerarMatrizMarkdown(catalogo));}
console.log(`Reconciliação concluída: ${kits.length} kits, origem ${commit??'sem commit Git detectado'}.`);
