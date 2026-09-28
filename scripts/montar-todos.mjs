import path from 'node:path';
import {carregarCatalogo, selecionarKitsParaMontagem} from './lib/catalogo.mjs';
import {montarKit} from './lib/empacotamento.mjs';
import {gerarChecksums} from './gerar-checksums.mjs';

function arg(nome){const i=process.argv.indexOf(nome);return i>=0?process.argv[i+1]:null;}
const dist=path.resolve(arg('--dist')||'dist');
const incluirNaoProntos=process.argv.includes('--todos');
const catalogo=await carregarCatalogo();
const selecionados=selecionarKitsParaMontagem(catalogo,{incluirNaoProntos});
if(selecionados.length===0) throw new Error(incluirNaoProntos?'Nenhum kit elegível para montagem.':'Nenhum kit está pronto para distribuição. Marque o kit como pronto somente após preço, documentação e licenças conferidos; use --todos apenas para QA interno.');
let n=0;
for(const kit of selecionados){
  await montarKit({kit,distDir:dist,kitDir:path.resolve('kits',kit.slug),repoDir:process.cwd()});
  n++;
}
await gerarChecksums(dist);
console.log(`Kits montados: ${n}${incluirNaoProntos?' (modo QA --todos)':' (somente prontos)'}.`);
