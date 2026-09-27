import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validarContraSchema } from '../scripts/lib/validacao-schema.mjs';
async function schema(nome){return JSON.parse(await readFile(new URL(`../schemas/${nome}.schema.json`,import.meta.url),'utf8'));}
const kitValido={schemaVersion:1,sku:'DKT-PLAT-001',idTecnico:'artisys-backup',slug:'backup-e-restauracao',nome:'Backup e Restauração',descricao:'Cria cópias de segurança verificáveis.',categoria:'Plataforma e Dados',versao:'0.2.0',estadoTecnico:'implemented',estadoComercial:'preparando',origem:{repositorio:'nutricionistaalmeidavh-spec/utilidades',caminho:'modules/artisys-backup',commit:null},runtime:['node'],dependenciaPagaObrigatoria:false,dependenciasOpcionais:[],upstreams:[],inclui:[],naoInclui:[],comandosValidacao:[],precoSugeridoBRL:null,documentacaoConferida:false,licencasConferidas:false,build:{habilitado:true},zip:'backup-e-restauracao-v0.2.0.zip'};
const pacoteValido={schemaVersion:1,sku:'PKT-001',slug:'base-desktop',nome:'Base Desktop',versao:'1.0.0',kits:['backup-e-restauracao'],estadoComercial:'preparando',precoSugeridoBRL:null,zip:'base-desktop-v1.0.0.zip'};
test('schemas aceitam kit, pacote e catálogo mínimos válidos',async()=>{assert.deepEqual(validarContraSchema(await schema('kit'),kitValido),[]);assert.deepEqual(validarContraSchema(await schema('pacote'),pacoteValido),[]);assert.deepEqual(validarContraSchema(await schema('catalogo'),{schemaVersion:1,locale:'pt-BR',modoDistribuicao:'publico-desenvolvimento',kits:[kitValido]}),[]);});
test('rejeita versão inválida',async()=>assert.ok(validarContraSchema(await schema('kit'),{...kitValido,versao:'v1'}).some(e=>e.includes('versao'))));
test('rejeita slug com acento',async()=>assert.ok(validarContraSchema(await schema('kit'),{...kitValido,slug:'báckup'}).some(e=>e.includes('slug'))));
test('rejeita estado comercial desconhecido',async()=>assert.ok(validarContraSchema(await schema('kit'),{...kitValido,estadoComercial:'vendendo'}).some(e=>e.includes('estadoComercial'))));
