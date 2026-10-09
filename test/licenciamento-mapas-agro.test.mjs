import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const kitDir = path.join('kits', 'mapas-e-dados-geoespaciais-agro');
const produtoDir = path.join(kitDir, 'produto');

test('kit geoespacial documenta licença autoral e direitos de dados sem embutir mapas', async () => {
  const license = await fs.readFile(path.join(produtoDir, 'LICENSE'), 'utf8');
  const terceiros = await fs.readFile(path.join(kitDir, 'TERCEIROS-E-LICENCAS.md'), 'utf8');
  const packageJson = JSON.parse(await fs.readFile(path.join(produtoDir, 'package.json'), 'utf8'));
  const arquivos = await fs.readdir(produtoDir, { recursive: true });
  assert.match(license, /LICENÇA COMERCIAL DE CÓDIGO-FONTE ARTISYS/);
  assert.match(license, /não revoga/i);
  assert.match(license, /Open Database License \(ODbL\) 1\.0/);
  assert.equal(packageJson.license, 'SEE LICENSE IN LICENSE');
  assert.equal(packageJson.private, true);
  assert.match(terceiros, /© OpenStreetMap contributors/);
  assert.match(terceiros, /mapasbrasilrelease/);
  assert.equal(arquivos.some(nome => /\.(pmtiles|osm\.pbf|mbtiles)$/i.test(nome)), false);
});
