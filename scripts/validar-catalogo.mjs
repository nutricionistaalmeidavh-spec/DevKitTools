import fs from 'node:fs/promises';
import path from 'node:path';
import {carregarCatalogo, validarCatalogo} from './lib/catalogo.mjs';
const raiz=process.cwd(); const catalogo=await carregarCatalogo(raiz); const r=validarCatalogo(catalogo);
for(const kit of catalogo.kits){const p=path.join(raiz,'kits',kit.slug,'kit.json');try{const k=JSON.parse(await fs.readFile(p,'utf8'));for(const campo of ['sku','idTecnico','slug','nome','categoria','versao','estadoTecnico','estadoComercial','zip'])if(k[campo]!==kit[campo])r.erros.push(`${kit.nome}: kit.json divergente em ${campo}`);}catch{r.erros.push(`${kit.nome}: kit.json ausente`);}}
r.ok=r.erros.length===0;
if(!r.ok){console.error('Catálogo inválido:\n- '+r.erros.join('\n- '));process.exit(1);} console.log(`Catálogo válido: ${catalogo.kits.length} kits.`);
