import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {lerSemente, criarCatalogo, validarCatalogo, gerarMatrizMarkdown, criarPacotes, selecionarKitsParaMontagem} from '../scripts/lib/catalogo.mjs';

const semente = await lerSemente(path.join(process.cwd(),'catalogo','semente-modulos.tsv'));

test('gera exatamente 63 kits com nomes comerciais em português', () => {
  const catalogo = criarCatalogo(semente);
  assert.equal(catalogo.kits.length, 63);
  assert.ok(catalogo.kits.some(k => k.nome === 'Backup e Restauração'));
  assert.ok(catalogo.kits.some(k => k.nome === 'Mapas e Dados Geoespaciais Agro'));
  assert.ok(catalogo.kits.every(k => k.zip === `${k.slug}-v${k.versao}.zip`));
});

test('rejeita SKU, slug e id técnico duplicados', () => {
  const catalogo = criarCatalogo(semente);
  const a = structuredClone(catalogo.kits[0]);
  const b = structuredClone(catalogo.kits[1]);
  b.sku = a.sku; b.slug = a.slug; b.idTecnico = a.idTecnico;
  const r = validarCatalogo({...catalogo,kits:[a,b]});
  assert.equal(r.ok,false);
  assert.ok(r.erros.some(e=>e.includes('sku duplicado')));
  assert.ok(r.erros.some(e=>e.includes('slug duplicado')));
  assert.ok(r.erros.some(e=>e.includes('idTecnico duplicado')));
});

test('kit pronto exige preço, documentação e licenças conferidas', () => {
  const catalogo = criarCatalogo(semente);
  const k = {...catalogo.kits[0], estadoComercial:'pronto'};
  const r = validarCatalogo({...catalogo,kits:[k]});
  assert.equal(r.ok,false);
  assert.ok(r.erros.some(e=>e.includes('sem preço')));
  assert.ok(r.erros.some(e=>e.includes('documentação')));
  assert.ok(r.erros.some(e=>e.includes('licenças')));
});

test('montagem comercial padrão inclui somente kits prontos', () => {
  const catalogo = criarCatalogo(semente);
  catalogo.kits[0] = {...catalogo.kits[0], estadoComercial:'pronto', precoSugeridoBRL:49, documentacaoConferida:true, licencasConferidas:true};
  catalogo.kits[1] = {...catalogo.kits[1], estadoComercial:'qa'};
  const selecionados = selecionarKitsParaMontagem(catalogo);
  assert.deepEqual(selecionados.map(k=>k.idTecnico), [catalogo.kits[0].idTecnico]);
  assert.equal(selecionarKitsParaMontagem(catalogo,{incluirNaoProntos:true}).length, catalogo.kits.length);
});

test('matriz é determinística e contém colunas comerciais', () => {
  const catalogo = criarCatalogo(semente);
  const a = gerarMatrizMarkdown(catalogo);
  const b = gerarMatrizMarkdown(catalogo);
  assert.equal(a,b);
  for (const coluna of ['SKU','Nome','Categoria','Versão','Técnico','Comercial','Preço','ZIP','Origem']) assert.ok(a.includes(coluna));
});

test('oito pacotes padrão referenciam apenas kits existentes', () => {
  const catalogo = criarCatalogo(semente);
  const pacotes = criarPacotes(catalogo);
  assert.equal(pacotes.pacotes.length,8);
  const slugs = new Set(catalogo.kits.map(k=>k.slug));
  for(const p of pacotes.pacotes) for(const slug of p.kits) assert.ok(slugs.has(slug),`${p.nome}: ${slug}`);
});
