import test from 'node:test';
import assert from 'node:assert/strict';
import {reconciliarCatalogos} from '../scripts/lib/catalogo.mjs';

const tecnico={modules:[
  {id:'artisys-backup',version:'0.2.0',status:'implemented',upstreams:['rclone']},
  {id:'artisys-only-tech',version:'0.1.0',status:'implemented',upstreams:[]}
]};
const apresentacao={modules:[
  {id:'artisys-backup',name:'Backup e Restauração',category:'Plataforma e Dados',description:'Backup local.'},
  {id:'artisys-only-display',name:'Somente apresentação',category:'Plataforma e Dados',description:'Fixture.'}
]};

test('reconciliação lista ids divergentes dos dois catálogos',()=>{
  const r=reconciliarCatalogos({tecnico,apresentacao,overrides:[]});
  assert.deepEqual(r.divergencias.somenteTecnico,['artisys-only-tech']);
  assert.deepEqual(r.divergencias.somenteApresentacao,['artisys-only-display']);
});

test('reconciliação preserva dados técnicos, nome pt-BR e override comercial',()=>{
  const t={modules:[tecnico.modules[0]]}; const a={modules:[apresentacao.modules[0]]};
  const r=reconciliarCatalogos({tecnico:t,apresentacao:a,overrides:[{idTecnico:'artisys-backup',estadoComercial:'qa',precoSugeridoBRL:79}]});
  assert.equal(r.kits[0].idTecnico,'artisys-backup');
  assert.equal(r.kits[0].versao,'0.2.0');
  assert.equal(r.kits[0].estadoTecnico,'implemented');
  assert.deepEqual(r.kits[0].upstreams,['rclone']);
  assert.equal(r.kits[0].nome,'Backup e Restauração');
  assert.equal(r.kits[0].estadoComercial,'qa');
  assert.equal(r.kits[0].precoSugeridoBRL,79);
});
