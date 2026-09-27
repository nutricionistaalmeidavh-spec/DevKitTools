import fs from 'node:fs/promises';
import path from 'node:path';
import {carregarCatalogo, selecionarPacotesParaMontagem} from './lib/catalogo.mjs';
import {montarPacote} from './lib/empacotamento.mjs';
import {gerarChecksums} from './gerar-checksums.mjs';

const catalogo=await carregarCatalogo();
const dados=JSON.parse(await fs.readFile('catalogo/pacotes.json','utf8'));
const dist=path.resolve('dist');
const incluirNaoProntos=process.argv.includes('--todos');
const selecionados=selecionarPacotesParaMontagem(dados,{incluirNaoProntos});
for(const pacote of selecionados) await montarPacote({pacote,catalogo,distDir:dist,pacoteDir:path.resolve('pacotes',pacote.slug)});
await gerarChecksums(dist);
console.log(`Pacotes montados: ${selecionados.length}${incluirNaoProntos?' (modo QA --todos)':' (somente prontos)'}.`);
