import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validarContraSchema } from '../scripts/lib/validacao-schema.mjs';

async function schema(nome) {
  return JSON.parse(await readFile(new URL(`../schemas/${nome}.schema.json`, import.meta.url), 'utf8'));
}

const kitValido = {
  schemaVersion: 1,
  sku: 'DKT-PLAT-001',
  idTecnico: 'artisys-backup',
  slug: 'backup-e-restauracao',
  nome: 'Backup e Restauração',
  categoria: 'Plataforma e Dados',
  versao: '0.2.0',
  estadoTecnico: 'implemented',
  estadoComercial: 'preparando',
  origem: { repositorio: 'nutricionistaalmeidavh-spec/utilidades', caminho: 'modules/artisys-backup' },
  runtime: ['node'],
  dependenciaPagaObrigatoria: false,
  dependenciasOpcionais: [],
  upstreams: [],
  inclui: [],
  naoInclui: [],
  comandosValidacao: [],
  precoSugeridoBRL: null,
  documentacaoConferida: false,
  licencasConferidas: false,
  build: { habilitado: true }
};

const pacoteValido = {
  schemaVersion: 1,
  slug: 'base-desktop',
  nome: 'Base Desktop',
  versao: '1.0.0',
  kits: ['backup-e-restauracao']
};

test('schemas aceitam kit, pacote e catálogo mínimos válidos', async () => {
  const kitSchema = await schema('kit');
  const pacoteSchema = await schema('pacote');
  const catalogoSchema = await schema('catalogo');
  assert.deepEqual(validarContraSchema(kitSchema, kitValido), []);
  assert.deepEqual(validarContraSchema(pacoteSchema, pacoteValido), []);
  assert.deepEqual(validarContraSchema(catalogoSchema, { schemaVersion: 1, kits: [kitValido] }), []);
});

test('rejeita versão inválida', async () => {
  const erros = validarContraSchema(await schema('kit'), { ...kitValido, versao: 'v1' });
  assert.ok(erros.some((e) => e.includes('versao')));
});

test('rejeita slug com acento', async () => {
  const erros = validarContraSchema(await schema('kit'), { ...kitValido, slug: 'báckup' });
  assert.ok(erros.some((e) => e.includes('slug')));
});

test('rejeita estado comercial desconhecido', async () => {
  const erros = validarContraSchema(await schema('kit'), { ...kitValido, estadoComercial: 'vendendo' });
  assert.ok(erros.some((e) => e.includes('estadoComercial')));
});
