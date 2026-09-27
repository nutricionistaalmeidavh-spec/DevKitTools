import fs from 'node:fs/promises';
import path from 'node:path';

function normalizar(p){return p.replaceAll('\\','/');}

export function motivoBloqueio(caminho){
  const p=normalizar(caminho); const low=p.toLowerCase(); const partes=low.split('/'); const nome=partes.at(-1) ?? '';
  if(partes.includes('..')) return 'travessia de diretório';
  if(partes.includes('.git')) return 'metadados Git';
  if(partes.includes('node_modules')) return 'dependências instaladas';
  if(nome==='.env') return 'arquivo de ambiente real';
  if(/^\.env\.(?!example$|sample$|template$)/.test(nome)) return 'arquivo de ambiente real';
  if(/\.(pem|key|p12|pfx)$/i.test(nome)) return 'chave/certificado sensível';
  if(/\.(sqlite|sqlite3|db)$/i.test(nome)) return 'banco de dados local';
  if(/\.log$/i.test(nome)) return 'log local';
  if(/^(credentials|credential|secrets?|private[-_]?key)(\.|$)/i.test(nome)) return 'arquivo de credencial/segredo';
  return null;
}

export function validarCaminhos(caminhos){
  for(const caminho of caminhos){const motivo=motivoBloqueio(caminho);if(motivo) throw new Error(`Arquivo bloqueado: ${caminho} (${motivo})`);}
}

export async function listarArquivosPermitidos(root){
  const saida=[];
  async function andar(dir){for(const ent of await fs.readdir(dir,{withFileTypes:true})){const abs=path.join(dir,ent.name);const rel=normalizar(path.relative(root,abs));if(ent.isDirectory()) await andar(abs); else if(ent.isFile()) saida.push(rel);}}
  await andar(root); saida.sort((a,b)=>a.localeCompare(b,'en')); validarCaminhos(saida); return saida;
}

export async function existe(p){try{await fs.access(p);return true;}catch{return false;}}
