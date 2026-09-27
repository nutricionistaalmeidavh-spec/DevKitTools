import path from 'node:path';
import {carregarCatalogo} from './lib/catalogo.mjs';
import {montarKit} from './lib/empacotamento.mjs';
function arg(nome){const i=process.argv.indexOf(nome);return i>=0?process.argv[i+1]:null;}
const slug=arg('--kit'); const origem=arg('--origem')||process.env.UTILIDADES_PATH; const dist=arg('--dist')||'dist'; if(!slug) throw new Error('Informe --kit <slug>.');
const catalogo=await carregarCatalogo(); const kit=catalogo.kits.find(k=>k.slug===slug); if(!kit) throw new Error(`Kit inexistente: ${slug}`);
const r=await montarKit({kit,origemUtilidades:origem,distDir:path.resolve(dist),kitDir:path.resolve('kits',slug)});console.log(`${kit.nome}: ${r.zipPath}\nSHA-256 ${r.sha256}`);
