# DevKitTools — Arquitetura Autocontida dos Kits Comerciais

Data: 2026-09-27
Status: aprovado em conversa; aguardando revisão do documento
Branch: `feat/kits-autocontidos`

## 1. Objetivo

Transformar o `DevKitTools` no repositório-fonte dos produtos comerciais vendidos, eliminando a dependência do repositório `utilidades` para montar, testar ou publicar kits.

O `utilidades` passa a ser apenas a origem histórica/upstream de parte do código. Depois da migração, cada kit deve possuir dentro do próprio `DevKitTools` todo o conteúdo necessário para ser validado e empacotado de forma independente.

## 2. Resultado esperado

Cada kit comercial deve ser autocontido:

```text
DevKitTools/
└── kits/
    └── <slug-do-kit>/
        ├── kit.json
        ├── README.md
        ├── INSTALACAO.md
        ├── INTEGRACAO.md
        ├── CHANGELOG.md
        ├── TERCEIROS-E-LICENCAS.md
        └── produto/
            ├── src/
            ├── test/ ou tests/
            ├── examples/        # quando existir
            ├── bin/             # quando existir
            ├── package.json     # quando existir
            ├── module.json      # snapshot técnico, quando existir
            ├── LICENSE          # quando aplicável
            └── demais arquivos necessários ao funcionamento
```

O comando de montagem deve usar somente `kits/<slug>/produto/` e a documentação do próprio kit.

## 3. Princípio de propriedade do código

Após a migração:

- `DevKitTools` é a fonte canônica do produto comercial;
- `utilidades` não é requisito de build, teste, release ou venda;
- mudanças futuras no `utilidades` não alteram automaticamente um kit já vendido;
- atualizações de um kit são feitas por migração explícita/revisada de um novo snapshot;
- a versão comercial do kit é controlada pelo `kit.json` no `DevKitTools`.

Uma versão vendida deve permanecer reproduzível mesmo se a origem mudar ou deixar de existir.

## 4. Estratégia escolhida: snapshot comercial por kit

Alternativas consideradas:

1. **Espelhar todo o `utilidades`**: simples, mas leva conteúdo que não pertence aos produtos e amplia riscos de licença, segurança e tamanho.
2. **Git subtree/submodule**: preserva vínculo externo, mas mantém a dependência conceitual e operacional entre repositórios.
3. **Snapshot comercial por kit — escolhido**: copia somente o necessário, mantém cada ZIP independente e permite auditoria por produto.

## 5. Migração inicial dos 63 kits

A migração deve percorrer os 63 kits registrados em `catalogo/kits.json`.

Para cada kit:

1. localizar o módulo indicado em `kit.origem.caminho`;
2. copiar os arquivos permitidos para `kits/<slug>/produto/`;
3. excluir conteúdo proibido;
4. registrar o commit de origem usado no snapshot;
5. validar a estrutura mínima do módulo;
6. executar testes locais quando houver comando conhecido;
7. preservar licenças e avisos de terceiros;
8. aceitar o snapshot somente depois dos gates técnicos e de segurança.

A importação é uma operação de desenvolvimento. O resultado versionado no `DevKitTools` passa a ser o produto.

## 6. Regras de cópia

### 6.1 Normalmente permitido

Copiar quando existir e for necessário:

- `src/**`
- `lib/**`
- `bin/**`
- `examples/**`
- `test/**`
- `tests/**`
- `fixtures/**` apenas quando sintéticos e necessários
- `package.json`
- lockfile aplicável quando necessário à reprodução
- `module.json`
- configurações de build/teste
- `LICENSE`
- `NOTICE`
- documentação técnica necessária

### 6.2 Sempre proibido

Não copiar:

- `.env`
- `.env.*` com valores reais
- chaves privadas (`*.pem`, `*.key` e certificados privados)
- credenciais ou tokens
- bancos reais (`*.db`, `*.sqlite`, dumps)
- logs
- dados de clientes
- `node_modules`
- caches
- builds temporários
- `.git`
- artefatos locais sem necessidade de distribuição
- arquivos sinalizados pelo gate de secrets

`.env.example` é permitido somente com placeholders.

## 7. Proveniência

A origem histórica continua registrada no `kit.json`, mas deixa de ser dependência operacional.

Campos esperados em `origem`:

- `repositorio`: origem histórica;
- `caminho`: diretório original;
- `commitSnapshot`: SHA usado na importação;
- `importadoEm`: data ISO da importação.

Esses campos servem para auditoria e atualização futura. O build não pode consultá-los para localizar código em outro repositório.

## 8. Empacotamento após a migração

O fluxo que exige `UTILIDADES_PATH` deve ser removido.

```text
kits/<slug>/
  ├── documentação comercial
  └── produto/
        ↓
validação
        ↓
ZIP determinístico
        ↓
SHA-256
        ↓
dist/<slug>-v<versao>.zip
```

O ZIP deve conter:

```text
<slug>/
├── README.md
├── INSTALACAO.md
├── INTEGRACAO.md
├── CHANGELOG.md
├── TERCEIROS-E-LICENCAS.md
├── kit.json
├── produto/
│   └── ...
└── MANIFESTO-BUILD.json
```

O manifesto deve registrar SKU, ID técnico, slug, versão, commit do `DevKitTools` quando disponível, commit de origem do snapshot e lista dos arquivos incluídos. O SHA-256 do ZIP é calculado após a geração.

## 9. Mudanças nos scripts

### `scripts/montar-kit.mjs`

Remover:

- `--origem`;
- `UTILIDADES_PATH`;
- leitura obrigatória do `utilidades`.

Passar a montar exclusivamente de `kits/<slug>/produto/`.

### `scripts/lib/empacotamento.mjs`

`montarKit()` deve receber somente dados e caminhos internos do `DevKitTools`.

### `scripts/importar-do-utilidades.mjs`

Sai do fluxo de build/release. Deve virar uma ferramenta explícita de manutenção, por exemplo `scripts/atualizar-snapshot.mjs`, usada somente quando o proprietário decidir importar uma nova revisão.

### `scripts/montar-todos.mjs`

Deve montar todos os kits elegíveis usando somente o checkout atual do `DevKitTools`.

## 10. GitHub Actions

### `validar.yml`

Deve validar:

- schemas;
- 63 kits registrados;
- presença de `produto/` para cada kit com build habilitado;
- ausência de secrets;
- consistência `kit.json` ↔ catálogo;
- matriz determinística;
- testes globais;
- testes individuais quando configurados.

### `montar-kits.yml`

Remover:

- clone do `utilidades`;
- `UTILIDADES_REPO_TOKEN`;
- qualquer dependência privada externa para montar kits.

O workflow passa a fazer checkout, validar, montar itens comerciais elegíveis, gerar ZIPs/checksums e publicar artifacts de CI quando aplicável.

### `release-kits.yml`

O release comercial continua bloqueado enquanto o repositório estiver público. Quando ele for privado, o release deve funcionar sem qualquer token do `utilidades`.

## 11. Estado comercial

Código em `produto/` não torna o kit automaticamente vendável.

Para `estadoComercial = "pronto"`, continuam obrigatórios:

- preço definido;
- documentação conferida;
- licenças conferidas;
- snapshot técnico presente;
- testes aplicáveis aprovados;
- nenhum arquivo proibido;
- ZIP gerado com sucesso;
- checksum calculado.

Itens em `preparando` podem ser versionados e testados, mas não entram na montagem comercial padrão.

## 12. Licenciamento e terceiros

A migração deve preservar todas as licenças aplicáveis.

Classificações práticas:

- **código próprio**: segue a política comercial escolhida pelo proprietário;
- **dependência permissiva**: preservar licença/atribuição exigida;
- **copyleft/forte copyleft**: revisar obrigações antes de marcar o kit como pronto;
- **ferramenta externa não redistribuída**: documentar como requisito quando necessário.

Nenhum kit pode ficar `pronto` enquanto `licencasConferidas` for falso. Copiar um arquivo para o `DevKitTools` não altera a licença original dele.

### 12.1 Fronteira de licença do repositório

O `DevKitTools` possui atualmente uma licença Apache 2.0 na raiz. Antes de importar código comercial para `kits/*/produto/`, a implementação deve eliminar a ambiguidade de escopo dessa licença.

A regra será:

- a licença raiz não pode ser interpretada automaticamente como relicenciamento de todos os snapshots comerciais;
- cada kit deve declarar explicitamente a licença aplicável ao seu `produto/`;
- licenças de terceiros já existentes devem ser preservadas sem alteração;
- para código próprio que não deva ser Apache 2.0, a pasta do kit deve conter a licença/aviso comercial aplicável;
- o README raiz e a documentação de licenciamento devem explicar que o repositório possui componentes sob licenças diferentes e que a licença de cada kit prevalece sobre a classificação do seu conteúdo;
- nenhum código cuja titularidade/licença seja incerta pode ser marcado `pronto`.

A implementação deve revisar a licença raiz antes do primeiro commit que introduza snapshots comerciais. O objetivo é evitar que a organização do repositório, por si só, conceda permissões diferentes das pretendidas para o código próprio ou para dependências de terceiros.

## 13. Repositório público durante desenvolvimento

Por decisão do proprietário, o `DevKitTools` permanece público durante esta fase para aproveitar GitHub Actions.

Consequências aceitas:

- qualquer código commitado em `kits/*/produto/` fica publicamente visível enquanto o repo for público;
- privatizar depois não apaga automaticamente clones/forks/cópias feitas durante a fase pública;
- não devem ser commitados segredos, dados de cliente ou qualquer material que dependa de confidencialidade.

O gate de release não é mecanismo de confidencialidade do código-fonte.

## 14. Atualizações futuras

Atualizar um kit será operação explícita:

1. selecionar o kit;
2. escolher a nova revisão de código;
3. atualizar o snapshot em `produto/`;
4. revisar o diff;
5. executar testes;
6. revisar licenças se dependências mudarem;
7. atualizar SemVer;
8. gerar novo ZIP;
9. registrar changelog.

Não haverá sincronização silenciosa automática com `utilidades`.

## 15. Pacotes/bundles

Os 8 pacotes comerciais continuam sendo compostos por ZIPs individuais:

`kit independente → ZIP independente → pacote agrega ZIPs independentes`

Nenhum pacote depende diretamente do `utilidades`.

## 16. Testes obrigatórios

A implementação deve provar que:

1. `montarKit()` funciona sem `UTILIDADES_PATH`;
2. kit sem `produto/` falha com mensagem acionável;
3. arquivos proibidos em `produto/` bloqueiam o build;
4. `.env.example` continua permitido;
5. ZIP inclui `produto/` e documentação;
6. ZIP é determinístico;
7. checksum é estável para conteúdo idêntico;
8. manifesto contém a proveniência do snapshot;
9. `montar-todos` não usa `utilidades`;
10. workflows não referenciam `UTILIDADES_REPO_TOKEN`;
11. somente itens `pronto` entram na montagem comercial padrão;
12. os 63 kits têm snapshot quando `build.habilitado = true`;
13. os 8 pacotes referenciam apenas kits válidos;
14. a política de licença de cada `produto/` é explicitamente identificável.

## 17. Rastreabilidade da migração

Para cada kit, registrar:

- commit de origem;
- lista de arquivos importados;
- versão técnica anterior;
- versão comercial atual;
- licença detectada;
- resultado dos testes de origem quando executáveis.

A migração deve ser auditável, mas o produto final não pode depender de repetir a importação.

## 18. Critérios de aceitação

A arquitetura estará concluída quando:

- [ ] os 63 kits possuírem estrutura comercial válida;
- [ ] todos os kits com build habilitado possuírem `produto/` autocontido;
- [ ] nenhum script de build exigir `utilidades`;
- [ ] `UTILIDADES_PATH` não for necessário para montagem;
- [ ] `UTILIDADES_REPO_TOKEN` não for necessário para CI/build/release;
- [ ] a fronteira de licenciamento do repositório estiver explícita;
- [ ] cada kit possuir licença/aviso aplicável ao seu snapshot;
- [ ] `npm test` estiver verde;
- [ ] catálogo, matriz e varredura de segurança estiverem verdes;
- [ ] cada kit elegível gerar seu próprio ZIP;
- [ ] os 8 pacotes gerarem seus ZIPs agregadores;
- [ ] o release permanecer bloqueado enquanto o repositório estiver público;
- [ ] um checkout isolado do `DevKitTools`, sem acesso ao `utilidades`, conseguir montar os kits comerciais elegíveis.

## 19. Fora de escopo

Não faz parte desta fase:

- marketplace/checkout;
- envio automático ao comprador;
- definição final de preço dos 63 kits;
- privatização do repositório;
- alteração funcional dos módulos, salvo correções necessárias para autocontenção;
- vendorizar dependências externas grandes sem necessidade.

## 20. Resumo da decisão

Antes:

```text
DevKitTools → precisa do utilidades → monta o ZIP
```

Depois:

```text
utilidades → snapshot revisado (somente quando atualizar)
                    ↓
              DevKitTools
                    ↓
             kit autocontido
                    ↓
              teste + ZIP
                    ↓
                  venda
```

O `DevKitTools` passa a ser suficiente por si só para manter, testar, versionar e empacotar os produtos comerciais.