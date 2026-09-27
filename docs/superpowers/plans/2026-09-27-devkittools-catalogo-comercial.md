# DevKitTools — Catálogo Comercial Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar `DevKitTools` no centro reprodutível de catálogo, validação, montagem e distribuição dos kits ArtiSys, com nomes comerciais em português, um ZIP versionado por kit, matriz central e GitHub Actions.

**Architecture:** O repositório manterá metadados comerciais, documentação, schemas, testes e scripts de empacotamento. O código técnico continuará tendo `utilidades` como fonte de verdade; a montagem recebe um checkout local desse repositório, copia somente a pasta allowlisted do módulo, aplica documentação comercial local, gera ZIP determinístico e SHA-256. A matriz humana em Markdown será sempre derivada de `catalogo/kits.json`, evitando divergência manual.

**Tech Stack:** Node.js 22+, ESM, `node:test`, Ajv, semver, JSZip, GitHub Actions, PowerShell 5.1+ para o wrapper Windows.

**Spec:** `docs/superpowers/specs/2026-09-27-devkittools-catalogo-comercial-design.md`

## Global Constraints

- Nomes comerciais, categorias, documentação e mensagens destinadas ao comprador devem estar em português (pt-BR).
- IDs técnicos `artisys-*` permanecem imutáveis.
- Todo kit vendável usa SemVer e gera exatamente `<slug>-v<versao>.zip`.
- `dist/` é gerado e nunca versionado no Git.
- Todo ZIP recebe SHA-256 em `dist/SHA256SUMS.txt`.
- O core não pode exigir serviço pago obrigatório; integrações pagas são opcionais e explícitas.
- Nenhum pacote pode incluir `.env` real, chaves, tokens, bancos reais, dados de clientes, logs locais, caches, `node_modules/` ou `.git/`.
- A origem técnica é `nutricionistaalmeidavh-spec/utilidades`; a revisão/commit usada deve ser registrada no manifesto de build.
- O repositório permanece público durante o desenvolvimento; workflows de release comercial não publicam conteúdo vendável automaticamente enquanto `MODO_DISTRIBUICAO` não for explicitamente alterado para `privado`.
- GitHub Actions que precisarem ler `utilidades` privado usam somente o secret `UTILIDADES_REPO_TOKEN`, com permissão mínima de leitura.
- `stable`/`implemented` são estados técnicos; `planejado`/`preparando`/`qa`/`pronto`/`pausado`/`descontinuado` são estados comerciais independentes.

## Review Focus

1. **Catálogos divergentes:** se `modules.json` contiver ID sem nome pt-BR ou vice-versa, a sincronização deve falhar explicitamente e listar os IDs divergentes.
2. **Tentativa de empacotar arquivo sensível:** qualquer caminho proibido ou padrão de segredo deve abortar o build antes de criar o ZIP.
3. **Slug/SKU duplicado:** validação deve rejeitar duplicidade mesmo quando os IDs técnicos forem diferentes.
4. **Build sem checkout de `utilidades`:** validação de catálogo deve continuar funcionando, mas montagem de ZIP deve falhar com mensagem acionável informando `--origem`/`UTILIDADES_PATH`.
5. **Reprodutibilidade:** duas montagens do mesmo kit, com a mesma revisão de origem e metadados, devem produzir a mesma lista lógica de arquivos, mesmo que o timestamp do workflow seja diferente.

---

## Mapa de arquivos

### Raiz
- `package.json` — scripts npm, Node 22 e dependências de desenvolvimento.
- `.gitignore` — ignora `node_modules/`, `dist/`, `_origem/`, temporários e caches.
- `README.md` — catálogo principal em português e comandos de desenvolvimento.

### Schemas e catálogo
- `schemas/kit.schema.json` — contrato de `kit.json`/entradas de `catalogo/kits.json`.
- `schemas/pacote.schema.json` — contrato de bundles comerciais.
- `schemas/catalogo.schema.json` — contrato do arquivo central.
- `catalogo/kits.json` — fonte comercial central editável.
- `catalogo/pacotes.json` — bundles e versões próprias.
- `catalogo/categorias.json` — categorias pt-BR e prefixos de SKU.
- `catalogo/MATRIZ-KITS.md` — saída gerada, nunca editada manualmente.
- `catalogo/origem/modules.snapshot.json` — snapshot técnico mínimo para validar sem acesso ao repo privado.
- `catalogo/origem/module-display.pt-BR.snapshot.json` — snapshot de nomes amigáveis.

### Scripts
- `scripts/lib/arquivos.mjs` — leitura recursiva, ordenação canônica, cópia allowlisted e denylist.
- `scripts/lib/catalogo.mjs` — carregar/validar/reconciliar catálogos e detectar duplicidades.
- `scripts/lib/empacotamento.mjs` — montar árvore de staging, gerar ZIP determinístico e hash.
- `scripts/importar-do-utilidades.mjs` — reconciliar origem técnica com overrides comerciais.
- `scripts/gerar-matriz.mjs` — gerar Markdown a partir de `kits.json`.
- `scripts/validar-catalogo.mjs` — validação global e integridade comercial.
- `scripts/montar-kit.mjs` — CLI para um kit.
- `scripts/montar-todos.mjs` — CLI para todos os kits elegíveis.
- `scripts/montar-pacotes.mjs` — CLI para bundles compostos.
- `scripts/gerar-checksums.mjs` — reconstruir/validar `SHA256SUMS.txt`.
- `scripts/montar-todos.ps1` — wrapper PowerShell sem sintaxe incompatível com Windows PowerShell 5.1.

### Kits e pacotes
- `kits/<slug>/kit.json` — manifesto comercial individual.
- `kits/<slug>/README.md` — descrição para comprador.
- `kits/<slug>/INSTALACAO.md` — instalação.
- `kits/<slug>/INTEGRACAO.md` — integração.
- `kits/<slug>/CHANGELOG.md` — histórico comercial.
- `kits/<slug>/TERCEIROS-E-LICENCAS.md` — notices; gate obrigatório para `pronto`.
- `kits/<slug>/conteudo-extra/` — overlay comercial permitido, sem duplicar o módulo técnico inteiro.
- `pacotes/<slug>/pacote.json` — composição e versão do bundle.
- `pacotes/<slug>/README.md` — documentação comercial do bundle.

### Testes
- `test/catalogo.test.mjs` — schemas, reconciliação, pt-BR, duplicidades e estados.
- `test/arquivos.test.mjs` — allowlist/denylist e segurança de caminhos.
- `test/empacotamento.test.mjs` — ZIP, checksum, conteúdo e reprodutibilidade lógica.
- `test/matriz.test.mjs` — Markdown gerado de forma determinística.
- `test/pacotes.test.mjs` — referências, versões e montagem de bundles.
- `test/fixtures/utilidades/` — catálogo e módulos mínimos fictícios para CI sem segredo.

### GitHub Actions
- `.github/workflows/validar.yml` — PR/push: testes, schemas, matriz, segredos e consistência.
- `.github/workflows/montar-kits.yml` — manual: checkout da origem e artifacts de desenvolvimento.
- `.github/workflows/release-kits.yml` — tag/release; bloqueado para conteúdo comercial enquanto repo estiver em modo público.

---

### Task 1: Fundação Node e contratos JSON

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `schemas/kit.schema.json`
- Create: `schemas/pacote.schema.json`
- Create: `schemas/catalogo.schema.json`
- Create: `test/catalogo.test.mjs`

**Interfaces:**
- Consumes: spec aprovada.
- Produces: `npm test`, `npm run validar`, schemas JSON e contrato de dados usado por todas as tarefas seguintes.

- [ ] **Step 1: Escrever testes que carregam os três schemas e validam um kit/pacote mínimo correto e rejeitam versão inválida, slug com acento e estado comercial desconhecido.**
- [ ] **Step 2: Rodar `npm test` e confirmar falha por ausência dos arquivos/schemas.**
- [ ] **Step 3: Criar `package.json` com `type: module`, `engines.node >=22`, scripts `test`, `validar`, `matriz`, `montar:kit`, `montar:todos`, `montar:pacotes` e devDependencies `ajv`, `ajv-formats`, `jszip`, `semver`.**
- [ ] **Step 4: Implementar schemas com `additionalProperties: false` nos objetos comerciais principais e enums exatos de estado técnico/comercial.**
- [ ] **Step 5: Rodar `npm ci && npm test`; esperado: PASS.**
- [ ] **Step 6: Commit `chore: prepara contratos e testes do DevKitTools`.**

### Task 2: Reconciliação do catálogo `utilidades` e nomes em português

**Files:**
- Create: `scripts/lib/catalogo.mjs`
- Create: `scripts/importar-do-utilidades.mjs`
- Create: `catalogo/categorias.json`
- Create: `catalogo/origem/modules.snapshot.json`
- Create: `catalogo/origem/module-display.pt-BR.snapshot.json`
- Modify: `test/catalogo.test.mjs`

**Interfaces:**
- Consumes: `loadJson(path)`, schemas da Task 1.
- Produces: `reconciliarCatalogos({ tecnico, apresentacao, overrides }) -> { kits, divergencias }` e CLI `node scripts/importar-do-utilidades.mjs --origem <path> --escrever-snapshots`.

- [ ] **Step 1: Adicionar testes `rejeita_id_tecnico_sem_nome_ptbr`, `rejeita_nome_ptbr_sem_id_tecnico`, `preserva_id_versao_status_upstreams` e `nome_comercial_e_categoria_vem_da_apresentacao`.**
- [ ] **Step 2: Rodar testes e confirmar falha das novas funções.**
- [ ] **Step 3: Implementar `scripts/lib/catalogo.mjs` com leitura JSON, mapa por ID, detecção de IDs divergentes e preservação dos campos comerciais já existentes.**
- [ ] **Step 4: Implementar CLI de importação aceitando checkout real ou fixtures; snapshots armazenam somente metadados técnicos/comerciais, nunca fonte vendável.**
- [ ] **Step 5: Importar snapshots da revisão atual do `utilidades` e garantir que IDs presentes no catálogo técnico tenham nome pt-BR; divergência vira erro não silencioso.**
- [ ] **Step 6: Rodar `npm test`; esperado: PASS.**
- [ ] **Step 7: Commit `feat: reconcilia catalogos do utilidades`.**

### Task 3: Catálogo comercial, SKUs e matriz central

**Files:**
- Create: `catalogo/kits.json`
- Create: `scripts/gerar-matriz.mjs`
- Create: `scripts/validar-catalogo.mjs`
- Create: `test/matriz.test.mjs`
- Modify: `test/catalogo.test.mjs`

**Interfaces:**
- Consumes: resultado reconciliado da Task 2.
- Produces: `validarCatalogo(catalogo) -> { ok, erros }`; `gerarMatrizMarkdown(catalogo) -> string`; `catalogo/MATRIZ-KITS.md`.

- [ ] **Step 1: Testar SKU, slug e ID técnico únicos; nome/categoria não vazios; SemVer válido; `pronto` exige preço, documentação/licenças conferidas e configuração de build.**
- [ ] **Step 2: Testar que a matriz contém colunas SKU, Nome, Categoria, Versão, Estado técnico, Estado comercial, Preço, ZIP e Origem, ordenadas por categoria/nome.**
- [ ] **Step 3: Implementar `validarCatalogo` e CLI com exit code 1 em qualquer erro.**
- [ ] **Step 4: Gerar catálogo inicial para todos os módulos reconciliados, usando nomes pt-BR e estado comercial inicial `preparando`; SKUs determinísticos por categoria e sequência.**
- [ ] **Step 5: Implementar gerador de Markdown e versionar `catalogo/MATRIZ-KITS.md`.**
- [ ] **Step 6: Rodar `npm run validar && npm run matriz && git diff --exit-code catalogo/MATRIZ-KITS.md`; esperado: sem divergência.**
- [ ] **Step 7: Commit `feat: cria matriz comercial dos kits`.**

### Task 4: Estrutura individual e documentação dos kits

**Files:**
- Create: `scripts/preparar-kits.mjs`
- Create: `kits/<slug>/kit.json` para cada entrada reconciliada
- Create: `kits/<slug>/README.md`
- Create: `kits/<slug>/INSTALACAO.md`
- Create: `kits/<slug>/INTEGRACAO.md`
- Create: `kits/<slug>/CHANGELOG.md`
- Create: `kits/<slug>/TERCEIROS-E-LICENCAS.md`
- Create: `test/preparar-kits.test.mjs`

**Interfaces:**
- Consumes: `catalogo/kits.json`.
- Produces: `prepararKit(kit, destino) -> caminhosCriados[]`, sem sobrescrever conteúdo manual existente.

- [ ] **Step 1: Testar geração de estrutura para fixture, nomes em português e idempotência sem destruir alterações manuais.**
- [ ] **Step 2: Implementar templates mínimos derivados do manifesto, deixando `TERCEIROS-E-LICENCAS.md` explícito sobre upstreams e status de conferência.**
- [ ] **Step 3: Executar `node scripts/preparar-kits.mjs` para todos os kits reais.**
- [ ] **Step 4: Rodar `npm test && npm run validar`; esperado: PASS.**
- [ ] **Step 5: Commit `feat: prepara estrutura comercial dos kits`.**

### Task 5: Segurança de arquivos e montagem determinística de um kit

**Files:**
- Create: `scripts/lib/arquivos.mjs`
- Create: `scripts/lib/empacotamento.mjs`
- Create: `scripts/montar-kit.mjs`
- Create: `test/arquivos.test.mjs`
- Create: `test/empacotamento.test.mjs`
- Create: `test/fixtures/utilidades/modules/artisys-backup/`

**Interfaces:**
- Produces: `listarArquivosPermitidos(root) -> string[]`; `validarCaminhos(paths) -> void`; `montarKit({ kit, origemUtilidades, distDir }) -> { zipPath, sha256, arquivos, origemCommit }`.

- [ ] **Step 1: Testar denylist para `.env`, `.pem`, `.key`, `.git`, `node_modules`, arquivos de banco, `*.log`, caminhos com `..` e nomes de credencial; o erro deve citar o caminho bloqueado.**
- [ ] **Step 2: Testar ausência de `utilidades`: montagem falha com mensagem indicando `--origem` ou `UTILIDADES_PATH`.**
- [ ] **Step 3: Testar ZIP canônico `backup-e-restauracao-v0.2.0.zip`, conteúdo mínimo e hash SHA-256 de 64 hexadecimais.**
- [ ] **Step 4: Testar reprodutibilidade lógica: duas execuções com os mesmos arquivos geram a mesma lista ordenada e metadados internos com timestamp fixo.**
- [ ] **Step 5: Implementar cópia do módulo técnico para staging temporário, sobreposição da documentação comercial, ordenação lexical e JSZip com datas internas fixas.**
- [ ] **Step 6: Implementar CLI `node scripts/montar-kit.mjs --kit <slug> --origem <path> --dist dist`.**
- [ ] **Step 7: Rodar `npm test`; esperado: PASS.**
- [ ] **Step 8: Commit `feat: gera zip seguro e reproduzivel por kit`.**

### Task 6: Montagem de todos os kits, checksums e pacotes compostos

**Files:**
- Create: `scripts/montar-todos.mjs`
- Create: `scripts/gerar-checksums.mjs`
- Create: `catalogo/pacotes.json`
- Create: `scripts/montar-pacotes.mjs`
- Create: `pacotes/base-desktop/pacote.json`
- Create: `pacotes/base-empresarial/pacote.json`
- Create: `pacotes/base-pdv/pacote.json`
- Create: `pacotes/documentos/pacote.json`
- Create: `pacotes/operacoes/pacote.json`
- Create: `pacotes/ativos-e-manutencao/pacote.json`
- Create: `pacotes/saas/pacote.json`
- Create: `pacotes/engenharia/pacote.json`
- Create: `test/pacotes.test.mjs`

**Interfaces:**
- Consumes: `montarKit()` da Task 5.
- Produces: `montarTodos({ estadoMinimo, origem, dist })`; `montarPacote(pacote, kitsMontados)`; `dist/SHA256SUMS.txt`.

- [ ] **Step 1: Testar que pacote rejeita slug inexistente, versão inválida e kit duplicado.**
- [ ] **Step 2: Testar que `SHA256SUMS.txt` é ordenado por nome de arquivo e contém todos os ZIPs gerados.**
- [ ] **Step 3: Implementar os oito bundles definidos na spec, cada um com versão própria `1.0.0` e lista exata de kits por slug.**
- [ ] **Step 4: Implementar montagem de todos os kits `stable`/`implemented` permitidos e montagem de bundles sem duplicar fonte fora dos ZIPs internos/estrutura declarada.**
- [ ] **Step 5: Rodar fixtures completas e verificar ZIPs + checksums.**
- [ ] **Step 6: Commit `feat: adiciona pacotes compostos e checksums`.**

### Task 7: Wrapper PowerShell e experiência local

**Files:**
- Create: `scripts/montar-todos.ps1`
- Modify: `package.json`
- Create: `docs/DESENVOLVIMENTO.md`

**Interfaces:**
- Produces: comando Windows único `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\montar-todos.ps1 -OrigemUtilidades <path>`.

- [ ] **Step 1: Implementar wrapper compatível com Windows PowerShell 5.1, sem `&&`, `chmod` ou continuação Bash.**
- [ ] **Step 2: Documentar clone, `npm ci`, testes, validação, geração da matriz e montagem local.**
- [ ] **Step 3: Rodar `node --check` nos scripts e, em ambiente Windows, executar o wrapper contra fixtures; esperado: exit 0 e `dist/SHA256SUMS.txt`.**
- [ ] **Step 4: Commit `docs: documenta desenvolvimento e build local`.**

### Task 8: GitHub Actions — validação e artifacts de desenvolvimento

**Files:**
- Create: `.github/workflows/validar.yml`
- Create: `.github/workflows/montar-kits.yml`
- Create: `.github/workflows/release-kits.yml`
- Create: `test/workflows.test.mjs`

**Interfaces:**
- `validar.yml`: sem secrets; usa snapshots/fixtures.
- `montar-kits.yml`: usa `UTILIDADES_REPO_TOKEN` para checkout read-only do repo privado em `_origem/utilidades` e publica artifacts de desenvolvimento.
- `release-kits.yml`: exige variável `MODO_DISTRIBUICAO=privado` para anexar ZIPs vendáveis a Release; enquanto público, falha antes de publicar conteúdo comercial.

- [ ] **Step 1: Testar estaticamente que workflows fixam `node-version: 22`, usam `npm ci`, não imprimem secrets e que release contém gate de `MODO_DISTRIBUICAO`.**
- [ ] **Step 2: Implementar `validar.yml` em push/PR: `npm ci`, `npm test`, `npm run validar`, regeneração da matriz + `git diff --exit-code`.**
- [ ] **Step 3: Implementar `montar-kits.yml` com `workflow_dispatch`, checkout do `DevKitTools`, checkout do `utilidades` via secret, montagem e `actions/upload-artifact`.**
- [ ] **Step 4: Implementar `release-kits.yml` com gate público/privado, nova validação, montagem fixada no commit e upload de ZIPs/checksums somente quando permitido.**
- [ ] **Step 5: Rodar `npm test`; esperado: PASS.**
- [ ] **Step 6: Commit `ci: valida e monta kits no GitHub Actions`.**

### Task 9: README comercial em português e política de licenças

**Files:**
- Modify: `README.md`
- Create: `docs/LICENCIAMENTO-E-DISTRIBUICAO.md`
- Create: `docs/COMO-ADICIONAR-UM-KIT.md`

**Interfaces:**
- Consumes: matriz e comandos já implementados.
- Produces: documentação humana para comprador/desenvolvedor sem exigir entendimento dos IDs técnicos.

- [ ] **Step 1: Reescrever README com objetivo, categorias, links para matriz, estados, comandos de validação/montagem e aviso de que artifacts comerciais não são publicados enquanto o repo estiver público.**
- [ ] **Step 2: Documentar diferença entre licença raiz, licenças de terceiros e futura licença comercial; não prometer revogação retroativa de direitos já concedidos.**
- [ ] **Step 3: Documentar processo de inclusão de novo kit: origem → nome pt-BR → catálogo → kit → testes → QA → ZIP → checksum.**
- [ ] **Step 4: Rodar `npm run validar && npm test`; esperado: PASS.**
- [ ] **Step 5: Commit `docs: publica catalogo e regras de distribuicao`.**

### Task 10: Gate final e prova de ponta a ponta

**Files:**
- Modify: `package.json`
- Create: `scripts/verificar-release.mjs`
- Modify: `test/empacotamento.test.mjs`
- Modify: `test/catalogo.test.mjs`

**Interfaces:**
- Produces: `npm run verificar:release` como gate único antes de qualquer distribuição.

- [ ] **Step 1: Criar teste E2E com fixtures: reconciliar catálogos → preparar kit → validar → montar ZIP → gerar checksum → montar pacote → validar matriz.**
- [ ] **Step 2: Implementar `verificar-release.mjs` chamando os gates em ordem e abortando no primeiro erro com mensagem em português.**
- [ ] **Step 3: Adicionar `verificar:release` ao `package.json`.**
- [ ] **Step 4: Rodar `npm ci && npm test && npm run verificar:release`; esperado: todos PASS.**
- [ ] **Step 5: Conferir `git status --short`; esperado: apenas arquivos deliberadamente gerados/versionados, nunca `dist/` ou `_origem/`.**
- [ ] **Step 6: Commit `test: fecha gate comercial do DevKitTools`.**

## Self-review

- Cobertura da spec: estrutura, schemas, matriz, nomes pt-BR, manifests, um ZIP por kit, SHA-256, pacotes compostos, importação do `utilidades`, Actions, SemVer, estados, licenças, segurança, README e gate final estão associados a tarefas específicas.
- Interfaces: `catalogo.mjs` alimenta validação/matriz; `empacotamento.mjs` é usado pelos CLIs; pacotes dependem de kits montados; workflows chamam apenas comandos npm públicos definidos anteriormente.
- Segurança: segredo de leitura do `utilidades` aparece somente como secret do Actions; fixtures/snapshots permitem CI normal sem acesso privado.
- Reprodutibilidade: ZIP usa ordenação lexical e timestamps internos fixos; SHA-256 é calculado após a escrita final.
- Escopo: checkout/pagamento, CRM de compradores, emissão fiscal e hospedagem protegida continuam fora desta implementação, conforme a spec.
