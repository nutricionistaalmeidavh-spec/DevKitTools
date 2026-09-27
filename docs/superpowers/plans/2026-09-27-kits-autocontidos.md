# Kits Autocontidos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar o `DevKitTools` autocontido, com o código necessário dos 63 kits versionado dentro de `kits/<slug>/produto/`, sem dependência do repositório `utilidades` para build, teste, ZIP ou release.

**Architecture:** Cada kit mantém documentação comercial e um snapshot técnico em `produto/`. O `utilidades` permanece apenas como proveniência e fonte opcional para atualizações explícitas; o empacotador e os workflows operam exclusivamente sobre o checkout do `DevKitTools`. A migração inicial preserva licenças/NOTICE e registra o commit upstream usado em cada snapshot.

**Tech Stack:** Node.js 22 ESM, `node:test`, Ajv/JSON Schema, JSZip, semver, GitHub Actions, PowerShell.

**Spec:** `docs/superpowers/specs/2026-09-27-kits-autocontidos-design.md`

## Global Constraints

- O `DevKitTools` permanece público durante esta fase de desenvolvimento.
- Nenhum build, teste, ZIP ou release pode exigir `UTILIDADES_PATH` ou `UTILIDADES_REPO_TOKEN` depois da migração.
- Todo kit com `build.habilitado = true` deve possuir `kits/<slug>/produto/` versionado.
- Nunca copiar `.env` real, chaves privadas, credenciais/tokens, bancos reais, dados de clientes, logs, `node_modules`, caches, `.git` ou builds temporários.
- `.env.example` só é permitido com placeholders.
- Licenças e `NOTICE` existentes no snapshot devem ser preservados; copiar um arquivo não muda sua licença.
- Itens `preparando` podem ser testados/empacotados em QA, mas a montagem comercial padrão continua limitada a `estadoComercial = "pronto"`.
- Kit `pronto` continua exigindo preço, documentação conferida e licenças conferidas.
- ZIP canônico: `<slug>-v<versao>.zip`; saída em `dist/`; SHA-256 em `dist/SHA256SUMS.txt`.
- Os 8 pacotes continuam agregando ZIPs de kits, nunca lendo código upstream diretamente.
- Atualização futura de snapshot deve ser explícita; não haverá sincronização automática silenciosa com `utilidades`.

## Review Focus

- **Licença de raiz versus licença do produto:** código em `kits/*/produto/` não pode herdar ambiguamente a licença Apache da ferramenta; teste de escopo em Task 1.
- **Snapshot parcial:** um kit com `build.habilitado=true` sem `produto/` ou sem proveniência deve falhar com mensagem acionável; testes em Task 5.
- **Arquivos sensíveis aninhados:** `.env`, banco, chave ou credencial em qualquer profundidade de `produto/` deve bloquear importação/build; testes em Task 2 e Task 5.
- **Build acidental de item não pronto:** montagem comercial padrão deve ignorar `preparando`, enquanto `--todos` serve apenas para QA; testes em Task 4 e Task 6.
- **Drift entre catálogo e `kit.json`:** atualização de snapshot deve manter os dois sincronizados e preservar preço/estado comercial; testes em Task 3.

---

### Task 1: Delimitar o escopo de licenciamento antes de importar código

**Files:**
- Create: `LICENSE-APACHE-2.0`
- Modify: `LICENSE`
- Create: `docs/ESCOPO-DE-LICENCAS.md`
- Create: `test/licenciamento.test.mjs`

**Interfaces:**
- Consumes: licença Apache 2.0 atualmente na raiz.
- Produces: regra explícita de escopo para todo código que será adicionado em `kits/*/produto/`.

- [ ] **Step 1: Write the failing tests**

Em `test/licenciamento.test.mjs`, fixar estas asserções:

```js
assert.match(rootLicense, /repositório multi-licença/i);
assert.match(scopeDoc, /kits\/\*\/produto\//);
assert.match(scopeDoc, /não.*automaticamente.*Apache/i);
assert.match(apacheText, /Apache License\s+Version 2\.0/i);
```

Também afirmar que o documento exige preservação de `LICENSE`/`NOTICE` de cada snapshot e que nenhum kit pode ser `pronto` com `licencasConferidas=false`.

- [ ] **Step 2: Run the licensing test and verify RED**

Run: `node --test test/licenciamento.test.mjs`

Expected: FAIL porque `LICENSE-APACHE-2.0` e `docs/ESCOPO-DE-LICENCAS.md` ainda não existem e `LICENSE` ainda é somente o texto Apache.

- [ ] **Step 3: Establish the multi-license boundary**

`LICENSE-APACHE-2.0` recebe a cópia integral do Apache 2.0 atual. `LICENSE` vira um aviso curto de repositório multi-licença: tooling/documentação próprios fora de `kits/*/produto/` continuam sob Apache 2.0 salvo indicação específica; conteúdo de `kits/*/produto/` é governado pelos arquivos de licença/NOTICE do próprio kit e não é relicenciado automaticamente pelo aviso da raiz. `docs/ESCOPO-DE-LICENCAS.md` documenta essa fronteira e a regra de revisão antes de `pronto`.

- [ ] **Step 4: Run the licensing test**

Run: `node --test test/licenciamento.test.mjs`

Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run: `npm test`

Expected: PASS sem regressões.

- [ ] **Step 6: Commit**

```bash
git add LICENSE LICENSE-APACHE-2.0 docs/ESCOPO-DE-LICENCAS.md test/licenciamento.test.mjs
git commit -m "docs: delimita licencas dos produtos comerciais"
```

---

### Task 2: Criar o contrato de snapshot seguro e proveniência

**Files:**
- Create: `scripts/lib/snapshot.mjs`
- Modify: `scripts/lib/arquivos.mjs`
- Modify: `schemas/kit.schema.json`
- Modify: `test/arquivos.test.mjs`
- Create: `test/snapshot.test.mjs`

**Interfaces:**
- Consumes: regras atuais de caminhos proibidos em `scripts/lib/arquivos.mjs`.
- Produces:
  - `copiarSnapshot({ origemModulo, destinoProduto }) -> Promise<{ arquivos: string[] }>`
  - `validarSnapshotKit({ kit, kitDir }) -> Promise<{ arquivos: string[] }>`
  - `origem.commitSnapshot: string|null`
  - `origem.importadoEm: string|null` no schema/manifests.

- [ ] **Step 1: Write failing security/snapshot tests**

Em `test/snapshot.test.mjs`, cobrir:

- cópia de `src/**`, `test/**`/`tests/**`, `examples/**`, `bin/**`, `package.json`, `module.json`, `LICENSE`, `NOTICE` e configurações de build/teste;
- exclusão/bloqueio recursivo de `.env`, `node_modules`, `.git`, `*.pem`, `*.key`, `*.db`, `*.sqlite`, logs e arquivos de credencial;
- `.env.example` permitido somente como arquivo modelo;
- destino anterior é substituído de forma controlada, sem deixar arquivo obsoleto de snapshot anterior;
- `validarSnapshotKit` falha se `build.habilitado=true` e `produto/` estiver ausente.

- [ ] **Step 2: Run snapshot tests and verify RED**

Run: `node --test test/arquivos.test.mjs test/snapshot.test.mjs`

Expected: FAIL porque `scripts/lib/snapshot.mjs` e os campos novos ainda não existem.

- [ ] **Step 3: Implement snapshot copy/validation**

Criar em `scripts/lib/snapshot.mjs` exatamente:

```js
export async function copiarSnapshot({origemModulo, destinoProduto})
export async function validarSnapshotKit({kit, kitDir})
```

Usar a mesma política central de `scripts/lib/arquivos.mjs`; não criar uma segunda lista divergente de arquivos sensíveis.

- [ ] **Step 4: Extend `kit.schema.json` provenance**

Substituir `origem.commit` por:

```json
"commitSnapshot": {"type":["string","null"]},
"importadoEm": {"type":["string","null"],"format":"date-time"}
```

Manter `repositorio` e `caminho`. Durante a transição os campos podem ser `null`; Task 5 transforma ausência em erro para kits com build habilitado depois da migração.

- [ ] **Step 5: Run targeted tests**

Run: `node --test test/arquivos.test.mjs test/snapshot.test.mjs test/catalogo.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/snapshot.mjs scripts/lib/arquivos.mjs schemas/kit.schema.json test/arquivos.test.mjs test/snapshot.test.mjs
git commit -m "feat: adiciona snapshots tecnicos seguros"
```

---

### Task 3: Transformar importação em atualização explícita de snapshot

**Files:**
- Create: `scripts/atualizar-snapshot.mjs`
- Modify: `scripts/lib/importacao.mjs`
- Modify: `package.json`
- Modify: `test/importacao.test.mjs`
- Create: `test/atualizar-snapshot.test.mjs`
- Delete after compatibility window: `scripts/importar-do-utilidades.mjs`

**Interfaces:**
- Consumes: `copiarSnapshot()` da Task 2 e catálogo em `catalogo/kits.json`.
- Produces:
  - CLI `npm run snapshot:atualizar -- --kit <slug> --origem <path>`
  - CLI de migração inicial `npm run snapshot:atualizar -- --todos --origem <path>`
  - atualização sincronizada de `catalogo/kits.json` e `kits/<slug>/kit.json`.

- [ ] **Step 1: Write failing updater tests**

Cobrir em `test/atualizar-snapshot.test.mjs`:

- `--kit` atualiza somente o slug solicitado;
- `--todos` percorre todos os kits com `build.habilitado=true`;
- lê `git -C <origem> rev-parse HEAD` e grava o mesmo SHA em `origem.commitSnapshot`;
- grava `origem.importadoEm` em ISO-8601;
- preserva `estadoComercial`, `precoSugeridoBRL`, `documentacaoConferida`, `licencasConferidas` e demais overrides comerciais;
- atualiza `catalogo/kits.json` e o `kit.json` correspondente com os mesmos dados;
- slug inexistente falha sem alterar outros kits.

- [ ] **Step 2: Verify RED**

Run: `node --test test/importacao.test.mjs test/atualizar-snapshot.test.mjs`

Expected: FAIL porque o novo CLI não existe.

- [ ] **Step 3: Implement `scripts/atualizar-snapshot.mjs`**

Aceitar exatamente uma das opções `--kit <slug>` ou `--todos`, sempre com `--origem <path>` (ou `SNAPSHOT_ORIGEM_PATH` somente para desenvolvimento). A origem continua opcional para manutenção, mas nunca será usada pelo build/release.

- [ ] **Step 4: Add package script and remove build semantics from old importer**

Adicionar:

```json
"snapshot:atualizar": "node scripts/atualizar-snapshot.mjs"
```

Remover `scripts/importar-do-utilidades.mjs` depois que os testes não o referenciarem mais. `scripts/lib/importacao.mjs` pode manter apenas reconciliação de metadados se ainda for usada pelo catálogo, sem copiar código durante build.

- [ ] **Step 5: Run targeted and full tests**

Run: `node --test test/importacao.test.mjs test/atualizar-snapshot.test.mjs && npm test`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json scripts/atualizar-snapshot.mjs scripts/lib/importacao.mjs test/importacao.test.mjs test/atualizar-snapshot.test.mjs
git rm scripts/importar-do-utilidades.mjs
git commit -m "feat: torna atualizacao de snapshot explicita"
```

---

### Task 4: Refatorar o empacotamento para usar somente `produto/`

**Files:**
- Modify: `scripts/lib/empacotamento.mjs`
- Modify: `scripts/montar-kit.mjs`
- Modify: `scripts/montar-todos.mjs`
- Modify: `scripts/montar-todos.ps1`
- Modify: `test/empacotamento.test.mjs`
- Modify: `test/catalogo-comercial.test.mjs`

**Interfaces:**
- Consumes: `kits/<slug>/produto/`, proveniência do `kit.json` e política de arquivos da Task 2.
- Produces:
  - `montarKit({kit, distDir, kitDir}) -> Promise<{zipPath, sha256, arquivos, origemCommit, devkitCommit}>`
  - CLI `montar:kit -- --kit <slug> [--dist <dir>]`
  - CLI `montar:todos [-- --todos] [--dist <dir>]` sem `--origem`.

- [ ] **Step 1: Rewrite packaging tests to the new contract (RED first)**

Alterar `test/empacotamento.test.mjs` para provar:

- `montarKit()` funciona sem `UTILIDADES_PATH` e sem parâmetro `origemUtilidades`;
- `produto/` ausente gera erro contendo `produto/` e o slug;
- ZIP contém `README.md`, `kit.json`, `produto/**` e `MANIFESTO-BUILD.json`;
- nenhum caminho `fonte/` legado é criado;
- duas execuções com conteúdo idêntico produzem a mesma lista lógica e o mesmo SHA-256;
- manifesto registra `snapshotCommit` e `devkitCommit` quando disponível;
- arquivo proibido dentro de `produto/` bloqueia o build.

Em `test/catalogo-comercial.test.mjs`, manter o contrato: padrão monta apenas `pronto`; `--todos` inclui `preparando` somente para QA.

- [ ] **Step 2: Run targeted tests and verify RED**

Run: `node --test test/empacotamento.test.mjs test/catalogo-comercial.test.mjs`

Expected: FAIL porque o empacotador ainda exige origem externa e usa `fonte/`.

- [ ] **Step 3: Refactor `montarKit()`**

Usar `path.join(kitDir, 'produto')` como única fonte técnica. `MANIFESTO-BUILD.json` deve conter `schemaVersion`, `sku`, `idTecnico`, `slug`, `versao`, `snapshotCommit`, `devkitCommit` e `arquivos`.

- [ ] **Step 4: Remove external-origin CLI flags**

`montar-kit.mjs`, `montar-todos.mjs` e `montar-todos.ps1` não podem aceitar, ler ou mencionar `--origem`, `UTILIDADES_PATH` ou caminho `_origem/utilidades`.

- [ ] **Step 5: Run targeted/full tests**

Run: `node --test test/empacotamento.test.mjs test/catalogo-comercial.test.mjs && npm test`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/empacotamento.mjs scripts/montar-kit.mjs scripts/montar-todos.mjs scripts/montar-todos.ps1 test/empacotamento.test.mjs test/catalogo-comercial.test.mjs
git commit -m "refactor: empacota kits a partir de snapshots locais"
```

---

### Task 5: Validar autocontenção dos 63 kits

**Files:**
- Create: `scripts/validar-snapshots.mjs`
- Modify: `scripts/validar-catalogo.mjs`
- Modify: `package.json`
- Create: `test/snapshots-catalogo.test.mjs`
- Modify: `test/catalogo-comercial.test.mjs`

**Interfaces:**
- Consumes: `validarSnapshotKit()` da Task 2 e `catalogo/kits.json`.
- Produces: CLI `npm run validar:snapshots` que falha se qualquer kit habilitado não estiver autocontido.

- [ ] **Step 1: Write failing catalog-wide snapshot tests**

Testar:

- catálogo continua com exatamente 63 kits;
- para todo kit com `build.habilitado=true`, `kits/<slug>/produto/` deve existir;
- `origem.commitSnapshot` e `origem.importadoEm` devem estar preenchidos após a migração;
- `kit.json` local deve ser semanticamente igual à entrada do catálogo nos campos canônicos;
- todos os arquivos em `produto/` passam pela política de segurança;
- kit `pronto` sem preço/docs/licenças continua falhando.

- [ ] **Step 2: Verify RED before migrating snapshots**

Run: `node --test test/snapshots-catalogo.test.mjs`

Expected: FAIL listando kits ainda sem `produto/`.

- [ ] **Step 3: Implement `scripts/validar-snapshots.mjs`**

Percorrer `catalogo.kits.filter(k => k.build.habilitado)` e agregar todos os erros em uma única saída acionável, em vez de parar no primeiro kit.

- [ ] **Step 4: Wire validation into package scripts**

Adicionar:

```json
"validar:snapshots": "node scripts/validar-snapshots.mjs"
```

`npm run validar` continua validando schema/comercial; workflows executarão também `validar:snapshots` após a migração.

- [ ] **Step 5: Commit the validator while the migration test remains intentionally RED**

```bash
git add scripts/validar-snapshots.mjs scripts/validar-catalogo.mjs package.json test/snapshots-catalogo.test.mjs test/catalogo-comercial.test.mjs
git commit -m "test: exige snapshots locais para kits habilitados"
```

O branch pode ficar temporariamente RED até Task 7, porque Task 5 cria o gate que a migração materializada precisa satisfazer.

---

### Task 6: Remover dependência externa dos GitHub Actions

**Files:**
- Modify: `.github/workflows/validar.yml`
- Modify: `.github/workflows/montar-kits.yml`
- Modify: `.github/workflows/release-kits.yml`
- Modify: `test/workflows.test.mjs`

**Interfaces:**
- Consumes: `validar:snapshots` e CLIs locais das Tasks 4–5.
- Produces: CI/build/release sem credencial ou checkout do `utilidades`.

- [ ] **Step 1: Write failing workflow tests**

Em `test/workflows.test.mjs`, afirmar para todos os workflows:

```js
assert.doesNotMatch(texto, /UTILIDADES_REPO_TOKEN/);
assert.doesNotMatch(texto, /UTILIDADES_PATH/);
assert.doesNotMatch(texto, /repository:\s*nutricionistaalmeidavh-spec\/utilidades/);
```

Também afirmar:

- `validar.yml` roda `npm run validar:snapshots`;
- `montar-kits.yml` oferece modo QA que chama `montar:todos -- --todos` e modo comercial que chama `montar:todos` sem `--todos`;
- `release-kits.yml` mantém gate `repository.private == true`, `MODO_DISTRIBUICAO=privado` e tag `vMAJOR.MINOR.PATCH`.

- [ ] **Step 2: Verify RED**

Run: `node --test test/workflows.test.mjs`

Expected: FAIL porque os workflows atuais ainda usam token/checkout do `utilidades`.

- [ ] **Step 3: Rewrite `validar.yml`**

Após `npm ci`: `npm test`, `npm run validar`, `npm run validar:snapshots`, `npm run verificar:secrets`, `npm run matriz` e `git diff --exit-code -- catalogo/MATRIZ-KITS.md`.

- [ ] **Step 4: Rewrite `montar-kits.yml`**

Trocar `somente-estrutura` por `modo` (`qa` ou `comercial`). QA monta todos para verificar os 63; comercial monta somente `pronto`. Nenhum checkout externo.

- [ ] **Step 5: Rewrite `release-kits.yml`**

Manter gates de repositório privado/modo/tag; remover toda validação de token e checkout do upstream; montar do próprio checkout.

- [ ] **Step 6: Run workflow/full tests**

Run: `node --test test/workflows.test.mjs && npm test`

Expected: PASS exceto o gate global de snapshots, que só fica verde após Task 7.

- [ ] **Step 7: Commit**

```bash
git add .github/workflows/validar.yml .github/workflows/montar-kits.yml .github/workflows/release-kits.yml test/workflows.test.mjs
git commit -m "ci: remove dependencia do repositorio utilidades"
```

---

### Task 7: Migrar os snapshots dos 63 kits para `produto/`

**Files:**
- Modify: `catalogo/kits.json`
- Modify: `kits/*/kit.json` (63 manifests)
- Create: `kits/*/produto/**` (63 snapshots)
- Modify when required: `kits/*/TERCEIROS-E-LICENCAS.md`
- Modify: `catalogo/MATRIZ-KITS.md`

**Interfaces:**
- Consumes: updater seguro da Task 3, origem técnica `modules/artisys-*` correspondente e gate da Task 5.
- Produces: checkout do `DevKitTools` completamente autocontido para todos os kits com build habilitado.

- [ ] **Step 1: Pin the upstream revision used for the initial migration**

Registrar o SHA único do checkout de `utilidades` usado na migração. Todos os módulos importados desse checkout recebem esse SHA em `origem.commitSnapshot`, salvo exceção documentada por kit.

- [ ] **Step 2: Run the migration for all build-enabled kits**

Run em ambiente de desenvolvimento com acesso à origem:

```bash
npm run snapshot:atualizar -- --todos --origem <checkout-fixado-do-utilidades>
```

Expected: 63 snapshots processados ou contagem exata de `build.habilitado=true`; nenhum arquivo proibido copiado.

- [ ] **Step 3: Audit migrated contents**

Run:

```bash
npm run verificar:secrets
npm run validar:snapshots
```

Expected: PASS; `validar:snapshots` informa todos os kits habilitados com snapshot válido.

- [ ] **Step 4: Run module validation commands where declared**

Para cada kit com `comandosValidacao` não vazio, executar o comando dentro de `kits/<slug>/produto/`. Falha de módulo impede marcar snapshot como aceito; não alterar `estadoComercial` automaticamente.

- [ ] **Step 5: Reconcile license notices**

Preservar `LICENSE`/`NOTICE` importados e atualizar `TERCEIROS-E-LICENCAS.md` somente com fatos verificáveis do snapshot. Não marcar `licencasConferidas=true` automaticamente.

- [ ] **Step 6: Regenerate matrix and run all tests**

Run:

```bash
npm run matriz
npm test
npm run validar
npm run validar:snapshots
npm run verificar:secrets
```

Expected: tudo PASS; matriz sem inconsistências.

- [ ] **Step 7: Commit snapshots as the canonical commercial source**

```bash
git add catalogo kits
git commit -m "feat: incorpora snapshots tecnicos dos 63 kits"
```

---

### Task 8: Provar ZIPs independentes e os 8 bundles

**Files:**
- Modify: `test/empacotamento.test.mjs`
- Modify: `test/pacotes.test.mjs`
- Modify: `scripts/gerar-checksums.mjs` only if verification exposes a bug
- Generated only, not committed: `dist/*.zip`, `dist/SHA256SUMS.txt`

**Interfaces:**
- Consumes: 63 snapshots locais e os 8 pacotes cadastrados.
- Produces: prova E2E de que um checkout isolado do `DevKitTools` monta tudo sem acesso ao `utilidades`.

- [ ] **Step 1: Add E2E assertions**

Teste deve montar um kit real da árvore em diretório temporário e afirmar que o ZIP contém `produto/`. Para pacotes, afirmar que cada bundle contém somente ZIPs canônicos dos kits listados.

- [ ] **Step 2: Run E2E tests**

Run: `node --test test/empacotamento.test.mjs test/pacotes.test.mjs`

Expected: PASS.

- [ ] **Step 3: Build all kits in QA mode from DevKitTools only**

Sem checkout, variável ou rede para `utilidades`:

```bash
rm -rf dist
npm run montar:todos -- --todos --dist dist
npm run montar:pacotes -- --todos
npm run checksums
```

Expected: um ZIP por kit habilitado, 8 ZIPs de pacote e `SHA256SUMS.txt`; nenhuma referência operacional ao `utilidades`.

- [ ] **Step 4: Verify deterministic rebuild**

Salvar checksums, limpar `dist`, repetir a montagem e comparar `SHA256SUMS.txt`.

Expected: arquivos idênticos para a mesma revisão do repositório.

- [ ] **Step 5: Commit any test-only adjustments**

```bash
git add test scripts/gerar-checksums.mjs
git commit -m "test: prova distribuicao autocontida dos kits"
```

Não versionar `dist/`.

---

### Task 9: Atualizar documentação operacional e remover linguagem de dependência

**Files:**
- Modify: `README.md`
- Modify: `docs/DESENVOLVIMENTO.md`
- Modify: `docs/LICENCIAMENTO-E-DISTRIBUICAO.md`
- Modify: `docs/COMO-ADICIONAR-UM-KIT.md`
- Create: `docs/ATUALIZAR-SNAPSHOT.md`
- Modify: `test/workflows.test.mjs` or create `test/documentacao.test.mjs`

**Interfaces:**
- Consumes: fluxo final autocontido.
- Produces: instruções que não ensinam o operador a usar token/checkout externo no build/release.

- [ ] **Step 1: Add a documentation regression test**

Nos arquivos operacionais de build/release (`README.md`, `docs/DESENVOLVIMENTO.md`, `docs/LICENCIAMENTO-E-DISTRIBUICAO.md`), impedir instruções que exijam `UTILIDADES_REPO_TOKEN` ou `UTILIDADES_PATH`. `docs/ATUALIZAR-SNAPSHOT.md` pode citar uma origem local apenas no contexto explícito de manutenção.

- [ ] **Step 2: Verify RED**

Run: `node --test test/documentacao.test.mjs`

Expected: FAIL enquanto os docs ainda descrevem o fluxo antigo.

- [ ] **Step 3: Rewrite operational docs**

README deve explicar: `produto/` é o código vendável; `utilidades` é apenas proveniência. Documentar comandos de validação, QA (`--todos`), build comercial padrão e atualização explícita de snapshot.

- [ ] **Step 4: Run documentation/full tests**

Run: `node --test test/documentacao.test.mjs && npm test`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add README.md docs test/documentacao.test.mjs
git commit -m "docs: documenta fluxo autocontido dos kits"
```

---

### Task 10: Gate final, PR e verificação de integração

**Files:**
- No product-code changes expected; only fixes uncovered by verification.

**Interfaces:**
- Consumes: Tasks 1–9.
- Produces: branch pronta para revisão/merge, com evidência reproduzível.

- [ ] **Step 1: Run clean install and complete validation**

```bash
npm ci
npm test
npm run validar
npm run validar:snapshots
npm run verificar:secrets
npm run matriz
git diff --exit-code -- catalogo/MATRIZ-KITS.md
```

Expected: PASS em todos.

- [ ] **Step 2: Search for forbidden operational dependencies**

Run:

```bash
git grep -nE 'UTILIDADES_REPO_TOKEN|UTILIDADES_PATH|--origem _origem/utilidades' -- ':!docs/superpowers/**' ':!docs/ATUALIZAR-SNAPSHOT.md'
```

Expected: nenhum resultado em build, release, scripts ou documentação operacional.

- [ ] **Step 3: Run isolated QA build**

Em checkout que contenha somente `DevKitTools`:

```bash
rm -rf dist
npm run montar:todos -- --todos --dist dist
npm run montar:pacotes -- --todos
npm run checksums
```

Expected: sucesso sem acesso ao `utilidades`.

- [ ] **Step 4: Verify GitHub Actions on the exact branch head**

Push da branch `feat/kits-autocontidos`, abrir PR contra `main`, aguardar `Validar catálogo e kits` concluir `success` e revisar logs para contagem de 63 kits/snapshots.

- [ ] **Step 5: Whole-branch review**

Revisar `main...feat/kits-autocontidos` com foco em: licença, dados sensíveis, arquivos de snapshot faltantes, regressão do gate `pronto`, e qualquer dependência operacional restante do upstream.

- [ ] **Step 6: Present merge decision to the user**

Não fazer merge automaticamente. Informar PR, SHA exato validado e evidências; merge somente após decisão explícita do usuário.
