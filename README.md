# DevKitTools

Catálogo, validação e empacotamento dos **kits técnicos vendáveis da ArtiSys**, com nomes comerciais em português.

## Como está organizado

- `catalogo/MATRIZ-KITS.md` — visão humana de tudo que pode virar produto.
- `catalogo/kits.json` — fonte comercial central.
- `kits/<nome-em-portugues>/` — manifesto e documentação de cada kit.
- `pacotes/` — combinações comerciais de vários kits.
- `scripts/` — validação, sincronização, geração de ZIP e SHA-256.
- `dist/` — ZIPs gerados localmente/CI; não é versionado.

Cada item vendável usa o padrão **`<nome-do-kit>-v<versao>.zip`** e recebe checksum SHA-256.

## Regra enquanto este repositório estiver público

Este repositório pode permanecer público durante o desenvolvimento para utilizar GitHub Actions. **O código vendável vindo do repositório privado `utilidades` não é publicado aqui.** Enquanto o DevKitTools estiver público, os workflows validam catálogo, documentação e estrutura; a montagem/release comercial é bloqueada.

Quando o repositório for privado, configure:

1. variável do repositório `MODO_DISTRIBUICAO=privado`;
2. secret `UTILIDADES_REPO_TOKEN` com permissão mínima de leitura sobre `nutricionistaalmeidavh-spec/utilidades`.

Só então os workflows comerciais podem gerar os ZIPs com o código técnico real.

## Desenvolvimento

```bash
npm ci
npm test
npm run validar
npm run matriz
npm run verificar:secrets
```

Para atualizar estrutura a partir da semente comercial:

```bash
npm run gerar:catalogo
npm run preparar:kits
npm run matriz
```

Para montar um kit com um checkout local do `utilidades`:

```bash
npm run montar:kit -- --kit backup-e-restauracao --origem ../utilidades
```

Para montar todos:

```bash
npm run montar:todos -- --origem ../utilidades --dist dist
npm run montar:pacotes
npm run checksums
```

No Windows PowerShell 5.1+:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\montar-todos.ps1 -OrigemUtilidades C:\caminho\utilidades
```

Consulte também `docs/LICENCIAMENTO-E-DISTRIBUICAO.md`, `docs/DESENVOLVIMENTO.md` e `docs/COMO-ADICIONAR-UM-KIT.md`.
