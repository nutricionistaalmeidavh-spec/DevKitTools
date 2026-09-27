import test from 'node:test';
import assert from 'node:assert/strict';
import {validarPacote} from '../scripts/lib/empacotamento.mjs';

const slugs=new Set(['backup-e-restauracao','acesso-e-permissoes']);

test('pacote rejeita kit inexistente',()=>{
  assert.throws(()=>validarPacote({slug:'base',versao:'1.0.0',kits:['nao-existe']},slugs),/inexistente/);
});

test('pacote rejeita versão inválida e kit duplicado',()=>{
  assert.throws(()=>validarPacote({slug:'base',versao:'v1',kits:['backup-e-restauracao']},slugs),/versão/);
  assert.throws(()=>validarPacote({slug:'base',versao:'1.0.0',kits:['backup-e-restauracao','backup-e-restauracao']},slugs),/duplicado/);
});
