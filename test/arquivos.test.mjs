import test from 'node:test';
import assert from 'node:assert/strict';
import {validarCaminhos} from '../scripts/lib/arquivos.mjs';

for (const bloqueado of ['.env','segredo.pem','privada.key','.git/config','node_modules/x.js','dados.sqlite','clientes.db','app.log','../escape.txt','credentials.json']) {
  test(`bloqueia caminho sensível: ${bloqueado}`, () => {
    assert.throws(()=>validarCaminhos([bloqueado]), new RegExp(bloqueado.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  });
}

test('permite .env.example como modelo sem segredo real', () => {
  assert.doesNotThrow(()=>validarCaminhos(['.env.example','src/index.js','README.md']));
});
