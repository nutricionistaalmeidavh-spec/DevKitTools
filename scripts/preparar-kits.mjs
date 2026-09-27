import fs from 'node:fs/promises';
import path from 'node:path';
import {carregarCatalogo} from './lib/catalogo.mjs';

async function escreverSeAusente(arquivo,conteudo){try{await fs.access(arquivo);}catch{await fs.writeFile(arquivo,conteudo);}}
export async function prepararKit(kit,repoDir=process.cwd()){
  const dir=path.join(repoDir,'kits',kit.slug); await fs.mkdir(dir,{recursive:true});
  await fs.writeFile(path.join(dir,'kit.json'),JSON.stringify(kit,null,2)+'\n');
  const upstreams=kit.upstreams.length?kit.upstreams.map(x=>`- ${x}`).join('\n'):'- Nenhum upstream declarado no snapshot atual. Conferir antes de marcar como pronto.';
  await escreverSeAusente(path.join(dir,'README.md'),`# ${kit.nome}\n\n${kit.descricao}\n\n**SKU:** ${kit.sku}  \n**Versão:** ${kit.versao}  \n**Categoria:** ${kit.categoria}  \n**Estado comercial:** ${kit.estadoComercial}  \n**ZIP esperado:** \`${kit.zip}\`\n\nID técnico: \`${kit.idTecnico}\`.\n`);
  await escreverSeAusente(path.join(dir,'INSTALACAO.md'),`# Instalação — ${kit.nome}\n\n1. Extraia o ZIP em uma pasta de trabalho.\n2. Leia o README e o arquivo de integração.\n3. Instale apenas as dependências declaradas pelo módulo de origem.\n4. Execute os testes/verificações incluídos antes de integrar em produção.\n`);
  await escreverSeAusente(path.join(dir,'INTEGRACAO.md'),`# Integração — ${kit.nome}\n\nOrigem técnica: \`${kit.origem.repositorio}/${kit.origem.caminho}\`.\n\nO kit é local/self-hosted por padrão. Regras específicas da aplicação consumidora permanecem fora deste módulo.\n`);
  await escreverSeAusente(path.join(dir,'CHANGELOG.md'),`# Changelog\n\n## ${kit.versao}\n\n- Estrutura comercial inicial do kit.\n`);
  await escreverSeAusente(path.join(dir,'TERCEIROS-E-LICENCAS.md'),`# Terceiros e licenças — ${kit.nome}\n\n**Status:** ${kit.licencasConferidas?'Conferido':'Pendente de conferência comercial'}\n\nUpstreams declarados:\n${upstreams}\n\nAntes da venda, preservar licenças, NOTICEs e atribuições exigidas pelos componentes de terceiros.\n`);
  return dir;
}

const catalogo=await carregarCatalogo();
for(const kit of catalogo.kits) await prepararKit(kit);
const pacotes=JSON.parse(await fs.readFile(path.join(process.cwd(),'catalogo','pacotes.json'),'utf8'));
for(const p of pacotes.pacotes){const dir=path.join(process.cwd(),'pacotes',p.slug);await fs.mkdir(dir,{recursive:true});await fs.writeFile(path.join(dir,'pacote.json'),JSON.stringify(p,null,2)+'\n');await escreverSeAusente(path.join(dir,'README.md'),`# ${p.nome}\n\nPacote composto com ${p.kits.length} kits.\n\n**Versão:** ${p.versao}  \n**ZIP esperado:** \`${p.zip}\`\n\nKits:\n${p.kits.map(x=>`- ${x}`).join('\n')}\n`);}
console.log(`Estrutura preparada para ${catalogo.kits.length} kits e ${pacotes.pacotes.length} pacotes.`);
