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

Isso garante que uma versão vendida permaneça reproduzível mesmo se o repositório de origem mudar ou deixar de existir.

## 4. Estratégia escolhida: snapshot comercial por kit

### 4.1 Alternativas consideradas

1. **Espelhar todo o `utilidades` dentro do `DevKitTools`**
   - simples de copiar;
   - carrega referências e ferramentas que não pertencem aos produtos vendidos;
   - aumenta ruído, risco de licença e tamanho do repositório.

2. **Git subtree/submodule**
   - preserva histórico ou vínculo externo;
   - mantém dependência conceitual e operacional entre repositórios;
   - conflita com a intenção de o `DevKitTools` ser autocontido.

3. **Snapshot comercial por kit — escolhido**
   - copia somente o necessário para cada produto;
   - cada ZIP fica independente;
   - facilita auditoria de licença e segurança;
   - mantém proveniência sem depender da origem na hora de vender.

## 5. Migração inicial dos 63 kits

A migração deve percorrer os 63 kits já registrados em `catalogo/kits.json`.

Para cada kit:

1. localizar o módulo técnico de origem indicado em `kit.origem.caminho`;
2. copiar os arquivos permitidos para `kits/<slug>/produto/`;
3. remover qualquer conteúdo proibido;
4. registrar o commit de origem usado no snapshot;
5. validar que o conteúdo copiado possui os arquivos necessários ao módulo;
6. executar testes locais do módulo quando houver comando conhecido;
7. manter as licenças e avisos de terceiros aplicáveis;
8. somente após passar nos gates, considerar o snapshot técnico aceito.

A migração é uma operação de desenvolvimento. O resultado versionado dentro do `DevKitTools` é o que passa a ser vendido.

## 6. Regras de cópia

### 6.1 Arquivos normalmente permitidos

Copiar quando existirem e forem necessários:

- `src/**`
- `lib/**`
- `bin/**`
- `examples/**`
- `test/**`
- `tests/**`
- `fixtures/**` somente quando sintéticos e necessários a testes
- `package.json`
- lockfile aplicável quando necessário à reprodução
- `module.json`
- arquivos de configuração de build/teste
- `LICENSE`
- `NOTICE`
- documentação técnica necessária ao uso do módulo

### 6.2 Arquivos sempre proibidos

Não copiar:

- `.env`
- `.env.*` com valores reais
- chaves privadas (`*.pem`, `*.key`, certificados privados)
- credenciais ou tokens
- bancos reais (`*.db`, `*.sqlite`, dumps de produção)
- logs
- dados de clientes
- `node_modules`
- caches
- builds temporários
- diretórios `.git`
- artefatos locais sem necessidade de distribuição
- arquivos que contenham segredos detectados pelo gate de segurança

`.env.example` pode ser mantido desde que contenha somente placeholders.

## 7. Proveniência

Cada kit continuará registrando a origem histórica, mas ela deixa de ser dependência operacional.

O `kit.json` deve manter:

```json
{
  "origem": {
    "repositorio": "nutricionistaalmeidavh-spec/utilidades",
    "caminho": "modules/artisys-...",
    "commitSnapshot": "<sha-do-commit-importado>",
    "importadoEm": "<data-ISO>"
  }
}
```

Esse dado serve para auditoria e atualização futura, não para a montagem do ZIP.

## 8. Empacotamento após a migração

O fluxo atual que exige `UTILIDADES_PATH` deve ser removido.

### Novo fluxo

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

O ZIP deve conter uma pasta raiz com o slug do kit e, dentro dela:

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

O `MANIFESTO-BUILD.json` deve registrar ao menos:

- SKU;
- ID técnico;
- slug;
- versão;
- commit do `DevKitTools` quando disponível;
- commit de origem do snapshot;
- lista de arquivos incluídos;
- SHA-256 do ZIP calculado externamente após a geração.

## 9. Mudanças nos scripts

### 9.1 `scripts/montar-kit.mjs`

Remover:

- `--origem`;
- `UTILIDADES_PATH`;
- qualquer leitura obrigatória do repositório `utilidades`.

Passar a montar a partir de:

`kits/<slug>/produto/`

### 9.2 `scripts/lib/empacotamento.mjs`

`montarKit()` deve receber apenas dados do kit e caminhos internos do `DevKitTools`.

O conteúdo técnico deve ser lido do diretório `produto/` do kit.

### 9.3 `scripts/importar-do-utilidades.mjs`

Deixa de ser parte do build/release.

Deve ser substituído ou renomeado para uma ferramenta explícita de manutenção, por exemplo:

`scripts/atualizar-snapshot.mjs`

Essa ferramenta pode receber uma origem local durante desenvolvimento para atualizar um snapshot, mas nunca deve ser necessária para montar ou vender um kit.

### 9.4 `scripts/montar-todos.mjs`

Deve conseguir montar todos os kits elegíveis usando somente o checkout atual do `DevKitTools`.

## 10. GitHub Actions

### 10.1 `validar.yml`

Deve validar:

- schemas;
- 63 kits registrados;
- existência de `produto/` para cada kit que tenha build habilitado;
- ausência de segredos;
- consistência `kit.json` ↔ catálogo;
- matriz determinística;
- testes globais;
- testes de cada módulo quando configurados.

### 10.2 `montar-kits.yml`

Remover:

- clone do `utilidades`;
- `UTILIDADES_REPO_TOKEN`;
- qualquer dependência externa privada para montar kits.

O workflow deve:

1. fazer checkout do `DevKitTools`;
2. instalar dependências da ferramenta de empacotamento;
3. validar;
4. montar somente itens comerciais elegíveis;
5. gerar ZIPs e checksums;
6. publicar artifacts de CI quando aplicável.

### 10.3 `release-kits.yml`

O release continua bloqueado enquanto o repositório estiver público, conforme a decisão comercial atual.

Quando o repositório for privado, o release deve continuar funcionando sem token do `utilidades`.

## 11. Estado comercial

A existência de código em `produto/` não torna automaticamente o kit vendável.

Para `estadoComercial = "pronto"`, continuam obrigatórios:

- preço definido;
- documentação conferida;
- licenças conferidas;
- snapshot técnico presente;
- testes aplicáveis aprovados;
- nenhum arquivo proibido;
- ZIP gerado com sucesso;
- checksum calculado.

Itens em `preparando` podem existir no repositório e serem testados, mas não entram na montagem comercial padrão.

## 12. Licenciamento e terceiros

A migração deve preservar todas as licenças necessárias.

Classificações práticas:

- **código próprio**: pode usar a política comercial definida pela ArtiSys;
- **dependência permissiva**: manter licença/atribuição exigida;
- **copyleft/forte copyleft**: revisar as obrigações antes de marcar o kit como pronto;
- **ferramenta externa não redistribuída**: documentar como requisito opcional quando aplicável.

Nenhum kit deve ser marcado `pronto` enquanto `licencasConferidas` for falso.

A cópia de um arquivo para o `DevKitTools` não altera a licença original desse arquivo.

## 13. Repositório público durante desenvolvimento

Por decisão do proprietário, o `DevKitTools` permanece público durante esta fase para aproveitar GitHub Actions.

Consequência aceita no design:

- qualquer código commitado em `kits/*/produto/` fica publicamente visível enquanto o repositório for público;
- privatizar o repositório depois não apaga automaticamente cópias/forks que terceiros tenham feito durante a fase pública;
- por isso, não devem ser commitados segredos, dados de cliente ou qualquer material que dependa de confidencialidade durante essa fase.

O gate de release comercial permanece bloqueado enquanto o repositório estiver público, mas esse gate não deve ser tratado como mecanismo de confidencialidade do código-fonte.

## 14. Atualizações futuras de um kit

Atualizar um kit deve ser uma operação explícita:

1. selecionar o kit;
2. escolher a nova origem/versão de código;
3. gerar novo snapshot em `produto/`;
4. revisar diff;
5. executar testes;
6. revisar licenças quando dependências mudarem;
7. atualizar versão SemVer;
8. gerar novo ZIP;
9. registrar changelog.

Não haverá sincronização automática silenciosa com `utilidades`.

## 15. Pacotes/bundles

Os 8 pacotes comerciais continuam sendo compostos por ZIPs de kits individuais.

Isso mantém o princípio:

`kit independente → ZIP independente → pacote agrega ZIPs independentes`

Nenhum pacote deve depender diretamente do `utilidades`.

## 16. Testes obrigatórios

A implementação deve incluir testes que provem:

1. `montarKit()` funciona sem `UTILIDADES_PATH`;
2. um kit sem `produto/` falha com mensagem acionável;
3. arquivos proibidos dentro de `produto/` bloqueiam o build;
4. `.env.example` continua permitido;
5. o ZIP inclui `produto/` e documentação;
6. o ZIP é determinístico;
7. o checksum é estável para conteúdo idêntico;
8. o manifesto contém proveniência do snapshot;
9. `montar-todos` não usa `utilidades`;
10. workflows não referenciam `UTILIDADES_REPO_TOKEN`;
11. somente itens `pronto` entram na montagem comercial padrão;
12. os 63 kits têm snapshot quando `build.habilitado = true`;
13. os 8 pacotes continuam referenciando apenas kits válidos.

## 17. Migração sem perda de rastreabilidade

Antes de substituir o fluxo atual, registrar para cada kit:

- commit de origem;
- lista de arquivos importados;
- versão técnica anterior;
- versão comercial atual;
- licença detectada;
- resultado dos testes de origem quando executáveis.

A migração deve ser auditável e reproduzível, mas o produto final não deve depender de repetir a importação.

## 18. Critérios de aceitação

A arquitetura estará concluída quando:

- [ ] os 63 kits possuírem estrutura comercial válida;
- [ ] todos os kits com build habilitado possuírem `produto/` autocontido;
- [ ] nenhum script de build exigir `utilidades`;
- [ ] `UTILIDADES_PATH` não for necessário para montagem;
- [ ] `UTILIDADES_REPO_TOKEN` não for necessário para CI/build/release;
- [ ] `npm test` estiver verde;
- [ ] o catálogo estiver válido;
- [ ] a varredura de segurança estiver verde;
- [ ] a matriz for reproduzível;
- [ ] cada kit elegível gerar seu próprio ZIP;
- [ ] os 8 pacotes gerarem ZIP agregador corretamente;
- [ ] o release permanecer bloqueado enquanto o repositório estiver público;
- [ ] um checkout isolado do `DevKitTools`, sem acesso ao `utilidades`, conseguir montar os kits comerciais elegíveis.

## 19. Fora de escopo desta migração

Não faz parte desta fase:

- criação de marketplace/checkout;
- automação de envio por e-mail ao comprador;
- definição final de preço dos 63 kits;
- privatização do repositório;
- alteração das funcionalidades internas dos módulos, salvo correções necessárias para torná-los autocontidos;
- transformar dependências externas grandes em código vendorizado sem necessidade.

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