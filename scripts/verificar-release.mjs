import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {carregarCatalogo,gerarMatrizMarkdown} from './lib/catalogo.mjs';
function arg(nome){const i=process.argv.indexOf(nome);return i>=0?process.argv[i+1]:null;}
function run(script,args=[]){const r=spawnSync(process.execPath,[script,...args],{stdio:'inherit',env:process.env});if(r.status!==0)throw new Error(`Gate falhou: ${script}`);}
run('scripts/validar-catalogo.mjs');run('scripts/verificar-segredos.mjs');
const catalogo=await carregarCatalogo();const esperado=gerarMatrizMarkdown(catalogo);const atual=await fs.readFile(path.join('catalogo','MATRIZ-KITS.md'),'utf8');if(atual!==esperado)throw new Error('Matriz versionada está divergente. Execute npm run matriz.');
const somente=process.argv.includes('--somente-estrutura');const origem=arg('--origem')||process.env.UTILIDADES_PATH;
if(!somente){if(!origem)throw new Error('Para verificar uma distribuição real, informe --origem <path> ou UTILIDADES_PATH.');run('scripts/montar-todos.mjs',['--origem',origem,'--dist','dist']);run('scripts/montar-pacotes.mjs');run('scripts/gerar-checksums.mjs');}
console.log(somente?'Gate estrutural de release aprovado.':'Gate completo de release aprovado.');
