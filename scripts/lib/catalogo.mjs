import fs from 'node:fs/promises';
import path from 'node:path';
import semver from 'semver';

export const ESTADOS_COMERCIAIS = ['planejado','preparando','qa','pronto','pausado','descontinuado'];
export const ESTADOS_TECNICOS = ['stable','implemented'];

export const PREFIXOS = {
  'Qualidade e Entrega':'QUAL','Documentos e Mídia':'DOC','Interface e Produtividade':'UI','Arquivos e Captura':'ARQ','Desktop e Hardware':'DESK','Plataforma e Dados':'PLAT','Aplicativos Web e Mobile':'WEB','Gestão e Operação':'GEST','Engenharia e BIM':'ENG','Engenharia e Agro':'AGRO'
};

export function slugificar(texto){return texto.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');}
export async function lerSemente(arquivo){const raw=await fs.readFile(arquivo,'utf8');const linhas=raw.trim().split(/\r?\n/);const cab=linhas.shift().split('\t');return linhas.filter(Boolean).map(l=>{const vals=l.split('\t');return Object.fromEntries(cab.map((k,i)=>[k,vals[i]??'']));});}

export function criarCatalogo(modulos){
  const porCategoria=new Map();const ordenados=[...modulos].sort((a,b)=>a.categoria.localeCompare(b.categoria,'pt-BR')||a.nome.localeCompare(b.nome,'pt-BR'));
  const kits=ordenados.map(m=>{const seq=(porCategoria.get(m.categoria)??0)+1;porCategoria.set(m.categoria,seq);const prefixo=PREFIXOS[m.categoria]??'GERAL';const slug=slugificar(m.nome);return {
    schemaVersion:1,sku:`DKT-${prefixo}-${String(seq).padStart(3,'0')}`,idTecnico:m.idTecnico,slug,nome:m.nome,descricao:m.descricao,categoria:m.categoria,versao:m.versao,estadoTecnico:m.estadoTecnico,estadoComercial:'preparando',
    origem:{repositorio:'nutricionistaalmeidavh-spec/utilidades',caminho:`modules/${m.idTecnico}`,commit:null},runtime:[],dependenciaPagaObrigatoria:false,dependenciasOpcionais:[],upstreams:m.upstreams??[],
    inclui:['código-fonte do módulo','documentação do kit','exemplo/testes quando disponíveis na origem'],naoInclui:['serviços pagos de terceiros','credenciais','infraestrutura always-on obrigatória'],comandosValidacao:[],precoSugeridoBRL:null,documentacaoConferida:false,licencasConferidas:false,build:{habilitado:true},zip:`${slug}-v${m.versao}.zip`
  };});return {schemaVersion:1,locale:'pt-BR',modoDistribuicao:'publico-desenvolvimento',kits};
}

const CAMPOS_COMERCIAIS=['sku','slug','estadoComercial','precoSugeridoBRL','documentacaoConferida','licencasConferidas','runtime','dependenciasOpcionais','inclui','naoInclui','comandosValidacao','build'];
export function reconciliarCatalogos({tecnico,apresentacao,overrides=[]}){
  const tm=new Map((tecnico?.modules??[]).map(m=>[m.id,m]));const am=new Map((apresentacao?.modules??[]).map(m=>[m.id,m]));
  const somenteTecnico=[...tm.keys()].filter(id=>!am.has(id)).sort();const somenteApresentacao=[...am.keys()].filter(id=>!tm.has(id)).sort();
  const comuns=[...tm.keys()].filter(id=>am.has(id));
  const modulos=comuns.map(id=>{const t=tm.get(id),a=am.get(id);return {idTecnico:id,versao:t.version,estadoTecnico:t.status,nome:a.name,categoria:a.category,descricao:a.description??'',upstreams:t.upstreams??[]};});
  const catalogo=criarCatalogo(modulos);const om=new Map(overrides.map(o=>[o.idTecnico,o]));
  catalogo.kits=catalogo.kits.map(k=>{const o=om.get(k.idTecnico);if(!o)return k;const r={...k};for(const c of CAMPOS_COMERCIAIS)if(Object.hasOwn(o,c))r[c]=structuredClone(o[c]);r.zip=`${r.slug}-v${r.versao}.zip`;return r;});
  return {kits:catalogo.kits,divergencias:{somenteTecnico,somenteApresentacao}};
}

export function validarCatalogo(catalogo){const erros=[];if(!catalogo||!Array.isArray(catalogo.kits))return{ok:false,erros:['Catálogo sem lista kits.']};const vistos={sku:new Set(),slug:new Set(),id:new Set()};for(const k of catalogo.kits){if(!/^DKT-[A-Z0-9]+-\d{3}$/.test(k.sku))erros.push(`${k.nome??k.idTecnico}: SKU inválido`);if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(k.slug))erros.push(`${k.nome??k.idTecnico}: slug inválido`);if(!semver.valid(k.versao))erros.push(`${k.nome??k.idTecnico}: versão inválida`);if(!ESTADOS_TECNICOS.includes(k.estadoTecnico))erros.push(`${k.nome}: estado técnico inválido`);if(!ESTADOS_COMERCIAIS.includes(k.estadoComercial))erros.push(`${k.nome}: estado comercial inválido`);for(const[campo,set]of[['sku',vistos.sku],['slug',vistos.slug],['idTecnico',vistos.id]]){if(set.has(k[campo]))erros.push(`${k.nome}: ${campo} duplicado (${k[campo]})`);else set.add(k[campo]);}if(!k.nome?.trim()||!k.categoria?.trim())erros.push(`${k.idTecnico}: nome/categoria vazios`);if(k.dependenciaPagaObrigatoria)erros.push(`${k.nome}: core não pode exigir dependência paga obrigatória`);if(k.estadoComercial==='pronto'){if(!(k.precoSugeridoBRL>0))erros.push(`${k.nome}: kit pronto sem preço sugerido`);if(!k.documentacaoConferida)erros.push(`${k.nome}: kit pronto sem documentação conferida`);if(!k.licencasConferidas)erros.push(`${k.nome}: kit pronto sem licenças conferidas`);if(!k.build?.habilitado)erros.push(`${k.nome}: kit pronto sem build habilitado`);}const esperado=`${k.slug}-v${k.versao}.zip`;if(k.zip!==esperado)erros.push(`${k.nome}: ZIP canônico deve ser ${esperado}`);}return{ok:erros.length===0,erros};}

export function selecionarKitsParaMontagem(catalogo,{incluirNaoProntos=false}={}){
  return catalogo.kits.filter(k=>k.build?.habilitado && (incluirNaoProntos ? !['pausado','descontinuado'].includes(k.estadoComercial) : k.estadoComercial==='pronto'));
}

export function selecionarPacotesParaMontagem(dados,{incluirNaoProntos=false}={}){
  return (dados.pacotes??[]).filter(p=>incluirNaoProntos ? !['pausado','descontinuado'].includes(p.estadoComercial) : p.estadoComercial==='pronto');
}

export function gerarMatrizMarkdown(catalogo){const linhas=['# Matriz Comercial de Kits','', '> Gerada automaticamente de `catalogo/kits.json`. Não editar manualmente.','',`Total de kits: **${catalogo.kits.length}**`,'','| SKU | Nome | Categoria | Versão | Técnico | Comercial | Preço | ZIP | Origem |','|---|---|---|---:|---|---|---:|---|---|'];for(const k of [...catalogo.kits].sort((a,b)=>a.categoria.localeCompare(b.categoria,'pt-BR')||a.nome.localeCompare(b.nome,'pt-BR'))){const preco=k.precoSugeridoBRL==null?'—':`R$ ${Number(k.precoSugeridoBRL).toFixed(2).replace('.',',')}`;linhas.push(`| ${k.sku} | ${k.nome} | ${k.categoria} | ${k.versao} | ${k.estadoTecnico} | ${k.estadoComercial} | ${preco} | \`${k.zip}\` | \`${k.origem.caminho}\` |`);}return linhas.join('\n')+'\n';}
export async function carregarCatalogo(repoDir=process.cwd()){return JSON.parse(await fs.readFile(path.join(repoDir,'catalogo','kits.json'),'utf8'));}
export const PACOTES_PADRAO=[['base-desktop','Base Desktop',['artisys-desktop-shell','artisys-storage','artisys-settings','artisys-backup','artisys-licensing','artisys-audit-log']],['base-empresarial','Base Empresarial',['artisys-auth-rbac','artisys-audit-log','artisys-importer','artisys-exporter','artisys-reporting','artisys-feature-flags','artisys-alerts']],['base-pdv','Base PDV',['artisys-inventory','artisys-catalog','artisys-pricing','artisys-printing','artisys-serialport']],['documentos','Documentos',['artisys-pdf','artisys-ocr','artisys-documents','artisys-office','artisys-doc-convert','artisys-annotations']],['operacoes','Operações',['artisys-os','artisys-workflow-engine','artisys-approvals','artisys-checklists','artisys-contacts']],['ativos-e-manutencao','Ativos e Manutenção',['artisys-assets','artisys-asset-lifecycle','artisys-custody','artisys-maintenance','artisys-metering']],['saas','SaaS',['artisys-multitenancy','artisys-auth-rbac','artisys-sync','artisys-feature-flags','artisys-eventbus']],['engenharia','Engenharia',['artisys-bim','artisys-pdf','artisys-annotations','artisys-reporting']]];
export function criarPacotes(catalogo){const porId=new Map(catalogo.kits.map(k=>[k.idTecnico,k]));return{schemaVersion:1,pacotes:PACOTES_PADRAO.map(([slug,nome,ids],i)=>({schemaVersion:1,sku:`PKT-${String(i+1).padStart(3,'0')}`,slug,nome,versao:'1.0.0',kits:ids.map(id=>{if(!porId.has(id))throw new Error(`Pacote ${nome}: kit inexistente ${id}`);return porId.get(id).slug;}),estadoComercial:'preparando',precoSugeridoBRL:null,zip:`${slug}-v1.0.0.zip`}))};}
