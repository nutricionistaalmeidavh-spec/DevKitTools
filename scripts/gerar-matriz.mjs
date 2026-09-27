import fs from 'node:fs/promises';
import path from 'node:path';
import {carregarCatalogo, gerarMatrizMarkdown} from './lib/catalogo.mjs';
const raiz=process.cwd();
const catalogo=await carregarCatalogo(raiz);
const md=gerarMatrizMarkdown(catalogo);
await fs.writeFile(path.join(raiz,'catalogo','MATRIZ-KITS.md'),md);
console.log(`Matriz gerada: ${catalogo.kits.length} kits.`);
