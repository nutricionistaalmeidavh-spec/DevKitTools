import fs from 'node:fs/promises';
import path from 'node:path';
import {lerSemente, criarCatalogo, criarPacotes} from './lib/catalogo.mjs';

const raiz = process.cwd();
const semente = await lerSemente(path.join(raiz,'catalogo','semente-modulos.tsv'));
const catalogo = criarCatalogo(semente);
const pacotes = criarPacotes(catalogo);
await fs.mkdir(path.join(raiz,'catalogo','origem'),{recursive:true});
await fs.writeFile(path.join(raiz,'catalogo','kits.json'),JSON.stringify(catalogo,null,2)+'\n');
await fs.writeFile(path.join(raiz,'catalogo','pacotes.json'),JSON.stringify(pacotes,null,2)+'\n');
await fs.writeFile(path.join(raiz,'catalogo','categorias.json'),JSON.stringify({schemaVersion:1,categorias:[...new Set(catalogo.kits.map(k=>k.categoria))].sort()},null,2)+'\n');
await fs.writeFile(path.join(raiz,'catalogo','origem','modules.snapshot.json'),JSON.stringify({schemaVersion:1,modules:semente.map(m=>({id:m.idTecnico,version:m.versao,status:m.estadoTecnico,upstreams:[]}))},null,2)+'\n');
await fs.writeFile(path.join(raiz,'catalogo','origem','module-display.pt-BR.snapshot.json'),JSON.stringify({schemaVersion:1,locale:'pt-BR',modules:semente.map(m=>({id:m.idTecnico,name:m.nome,category:m.categoria,description:m.descricao}))},null,2)+'\n');
console.log(`Catálogo gerado com ${catalogo.kits.length} kits e ${pacotes.pacotes.length} pacotes.`);
