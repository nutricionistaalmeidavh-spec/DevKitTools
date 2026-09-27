# Desenvolvimento

## Requisitos

- Node.js 22 ou superior.
- Git.
- Para montar ZIPs reais, checkout autorizado do repositório `utilidades`.

## Fluxo estrutural

```bash
npm ci
npm run gerar:catalogo
npm run preparar:kits
npm run matriz
npm test
npm run validar
npm run verificar:secrets
node scripts/verificar-release.mjs --somente-estrutura
```

`catalogo/kits.json` e os `kit.json` individuais precisam permanecer sincronizados. Documentações manuais existentes não são sobrescritas pelo preparador.

## Fluxo comercial privado

```bash
npm run montar:todos -- --origem ../utilidades --dist dist
npm run montar:pacotes
npm run checksums
npm run verificar:release -- --origem ../utilidades
```

O diretório `dist/` não entra no Git.
