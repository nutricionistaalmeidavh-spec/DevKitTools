# DevKitTools — Catálogo Comercial e Distribuição de Kits

Data: 2026-09-27

## 1. Objetivo

Transformar o repositório `DevKitTools` no centro de organização, validação, empacotamento e distribuição dos kits técnicos vendáveis da ArtiSys.

Cada kit vendável deverá possuir:

- nome comercial em português;
- identificador técnico estável;
- versão semântica;
- pasta própria;
- manifesto próprio;
- documentação em português;
- exemplo mínimo funcional quando aplicável;
- testes e/ou validação automatizada;
- relação explícita de dependências e upstreams;
- avisos de terceiros/licenças quando aplicável;
- um arquivo ZIP correspondente e versionado;
- SHA-256 do ZIP;
- registro na matriz comercial central.

O repositório permanecerá público durante o desenvolvimento para aproveitar GitHub Actions públicos. Antes da venda efetiva dos pacotes fechados, a estratégia de visibilidade/licenciamento deve ser revista e o repositório poderá ser tornado privado.

## 2. Contexto atual

O `DevKitTools` foi criado vazio, contendo apenas `README.md` e `LICENSE`.

A principal origem técnica dos kits será o repositório `utilidades`, especialmente:

- `catalog/module-display.pt-BR.json` — nomes amigáveis em português, categorias e descrições;
- `catalog/modules.json` — ID técnico, versão, estado, modo de execução, upstreams e consumidores recomendados;
- `modules/artisys-*` — implementação e testes dos módulos;
- referências, upstreams e documentação de licenças já curados no `utilidades`.

Os IDs técnicos `artisys-*` não serão renomeados. O usuário final verá prioritariamente os nomes comerciais em português.

## 3. Abordagens consideradas

### A. Copiar tudo manualmente para o DevKitTools

Vantagem: simples de entender.

Problema: gera divergência entre `utilidades` e `DevKitTools`, versões duplicadas e manutenção manual.

### B. DevKitTools somente como catálogo, sem conteúdo empacotável

Vantagem: quase nenhuma duplicação.

Problema: não atende ao requisito de um ZIP por kit nem cria um processo comercial reproduzível.

### C. Catálogo comercial + staging dos kits + geração automatizada de ZIPs

Selecionada.

O `utilidades` continua sendo a origem técnica dos módulos; o `DevKitTools` mantém os metadados comerciais, documentação de venda, staging do conteúdo liberado, scripts de montagem, matriz e workflows. O pacote final é gerado de forma determinística.

Isso permite atualizar o código-fonte sem perder rastreabilidade da versão vendida.

## 4. Arquitetura do repositório

```text
DevKitTools/
├── README.md
├── LICENSE
├── .gitignore
├── package.json
├── catalogo/
│   ├── MATRIZ-KITS.md
│   ├── kits.json
│   ├── pacotes.json
│   └── categorias.json
│
├── kits/
│   ├── backup-e-restauracao/
│   │   ├── kit.json
│   │   ├── README.md
│   │   ├── CHANGELOG.md
│   │   ├── TERCEIROS-E-LICENCAS.md
│   │   ├── fonte/
│   │   ├── exemplo/
│   │   └── testes/
│   └── ...
│
├── pacotes/
│   ├── base-desktop/
│   ├── base-empresarial/
│   ├── base-pdv/
│   ├── documentos/
│   ├── operacoes/
│   ├── ativos-e-manutencao/
│   ├── saas/
│   └── engenharia/
│
├── scripts/
│   ├── importar-do-utilidades.mjs
│   ├── validar-catalogo.mjs
│   ├── montar-kit.mjs
│   ├── montar-todos.mjs
│   ├── gerar-matriz.mjs
│   ├── gerar-checksums.mjs
│   └── montar-todos.ps1
│
├── schemas/
│   ├── kit.schema.json
│   ├── catalogo.schema.json
│   └── pacote.schema.json
│
├── dist/                  # gerado; não versionado
│   ├── <slug>-vX.Y.Z.zip
│   └── SHA256SUMS.txt
│
└── .github/
    └── workflows/
        ├── validar.yml
        ├── montar-kits.yml
        └── release-kits.yml
```

## 5. Nomenclatura

### 5.1 Nome comercial

Sempre em português e orientado ao benefício.

Exemplos:

- `artisys-backup` → **Backup e Restauração**
- `artisys-auth-rbac` → **Acesso e Permissões**
- `artisys-licensing` → **Licenciamento Offline**
- `artisys-inventory` → **Estoque e Movimentações**
- `artisys-printing` → **Impressão, Cupons e Etiquetas**
- `artisys-bim` → **Leitura e Processamento BIM/IFC**

### 5.2 Slug de pasta e ZIP

O slug será em português simples, minúsculo, sem acentos e separado por hífens.

Exemplo:

```text
backup-e-restauracao/
backup-e-restauracao-v0.2.0.zip
```

### 5.3 ID técnico

Preservado no manifesto:

```json
{
  "idTecnico": "artisys-backup",
  "nome": "Backup e Restauração"
}
```

## 6. Matriz comercial central

A matriz será fonte de consulta humana e deverá existir em Markdown e JSON.

Colunas mínimas:

| Campo | Finalidade |
|---|---|
| SKU | Identificador comercial único |
| Nome em português | Nome exibido ao comprador |
| ID técnico | Correspondência com `artisys-*` |
| Categoria | Agrupamento comercial |
| Versão | Versão vendida |
| Origem | Caminho/repositório técnico de origem |
| Estado técnico | `stable`, `implemented` etc. |
| Estado comercial | `planejado`, `preparando`, `qa`, `pronto`, `pausado` |
| Preço sugerido | Valor de referência |
| ZIP | Nome esperado do artefato |
| SHA-256 | Integridade do ZIP |
| Runtime | Node, browser, Electron, Python etc. |
| Dependência paga obrigatória | Sim/Não |
| Dependências opcionais | Integrações opcionais |
| Upstreams | Projetos terceiros relevantes |
| Licenças conferidas | Sim/Não |
| Exemplo incluído | Sim/Não |
| Testes | Estado da validação |
| Último QA | Data |
| Observações | Restrições e notas comerciais |

A matriz Markdown será gerada automaticamente a partir do JSON para evitar divergência.

## 7. Manifesto de cada kit

Cada `kit.json` deverá conter, no mínimo:

```json
{
  "schemaVersion": 1,
  "sku": "DKT-PLAT-001",
  "idTecnico": "artisys-backup",
  "slug": "backup-e-restauracao",
  "nome": "Backup e Restauração",
  "categoria": "Plataforma e Dados",
  "versao": "0.2.0",
  "estadoTecnico": "implemented",
  "estadoComercial": "preparando",
  "origem": {
    "repositorio": "nutricionistaalmeidavh-spec/utilidades",
    "caminho": "modules/artisys-backup"
  },
  "runtime": [],
  "dependenciaPagaObrigatoria": false,
  "upstreams": [],
  "inclui": [],
  "naoInclui": [],
  "comandosValidacao": [],
  "precoSugeridoBRL": null
}
```

## 8. Conteúdo obrigatório do ZIP

Um kit comercial só pode ser marcado como `pronto` se o ZIP contiver, quando aplicável:

```text
<NOME-DO-KIT>/
├── README.md
├── INSTALACAO.md
├── INTEGRACAO.md
├── CHANGELOG.md
├── LICENCA-COMERCIAL.txt ou licença aplicável
├── TERCEIROS-E-LICENCAS.md
├── kit.json
├── src/ ou fonte/
├── exemplo/
└── testes/ ou verificacao/
```

O ZIP não deve conter:

- `.git/`;
- `.env` real;
- tokens, chaves ou segredos;
- `node_modules/`;
- caches;
- artefatos temporários;
- bancos com dados reais;
- arquivos de clientes;
- dados internos sem relação com o kit.

## 9. Regra de um ZIP por kit

Para cada item vendável da matriz deve existir exatamente um nome canônico de ZIP:

```text
<slug>-v<versao>.zip
```

Exemplos:

```text
backup-e-restauracao-v0.2.0.zip
acesso-e-permissoes-v0.2.0.zip
licenciamento-offline-v0.1.0.zip
estoque-e-movimentacoes-v0.2.0.zip
```

Pacotes compostos também terão ZIP próprio:

```text
base-desktop-v1.0.0.zip
base-empresarial-v1.0.0.zip
base-pdv-v1.0.0.zip
```

## 10. Pacotes compostos iniciais

### Base Desktop

- Estrutura Base para Aplicativos Desktop
- Armazenamento de Dados
- Configurações do Sistema
- Backup e Restauração
- Licenciamento Offline
- Histórico e Auditoria

### Base Empresarial

- Acesso e Permissões
- Histórico e Auditoria
- Importação de Dados
- Exportação de Dados
- Relatórios e Indicadores
- Ativação Controlada de Funcionalidades
- Alertas e Notificações

### Base PDV

- Estoque e Movimentações
- Catálogo de Produtos e Serviços
- Preços, Descontos e Combos
- Impressão, Cupons e Etiquetas
- Integração com Dispositivos Seriais

### Documentos

- Geração e Leitura de PDFs
- Reconhecimento de Texto (OCR)
- Leitura e Processamento de Documentos
- Documentos e Planilhas Office
- Conversão de Documentos
- Anotações em Imagens e PDFs

### Operações

- Ordens de Serviço
- Motor de Fluxos de Trabalho
- Aprovações
- Checklists e Inspeções
- Contatos e Organizações

### Ativos e Manutenção

- Cadastro de Ativos
- Ciclo de Vida de Ativos
- Custódia e Empréstimos
- Manutenção Preventiva
- Medidores e Leituras

### SaaS

- Multiempresa e Isolamento de Dados
- Acesso e Permissões
- Sincronização de Dados
- Ativação Controlada de Funcionalidades
- Comunicação entre Módulos

### Engenharia

- Leitura e Processamento BIM/IFC
- Geração e Leitura de PDFs
- Anotações em Imagens e PDFs
- Relatórios e Indicadores

## 11. Importação do `utilidades`

O script `importar-do-utilidades.mjs` deverá:

1. ler o catálogo técnico exportado ou disponibilizado pelo `utilidades`;
2. reconciliar `modules.json` com `module-display.pt-BR.json`;
3. preservar `id`, `version`, `status`, `executionMode` e `upstreams`;
4. aplicar nome e categoria em português;
5. detectar módulos técnicos sem nome comercial e falhar com mensagem clara;
6. nunca sobrescrever campos comerciais manuais como preço ou estado comercial;
7. copiar somente arquivos explicitamente permitidos para staging do kit;
8. registrar a revisão/commit de origem usada na montagem.

Durante a implementação inicial, a sincronização poderá ser feita por checkout do repositório `utilidades` no GitHub Actions. Depois que o `DevKitTools` for privado, o acesso deverá ser feito com credencial/recurso autorizado e princípio de menor privilégio.

## 12. GitHub Actions

### `validar.yml`

Executa em PR e push:

- valida schemas JSON;
- garante SKU único;
- garante slug único;
- garante ID técnico único por kit;
- valida versão semântica;
- confere nome comercial em português;
- confere existência dos arquivos mínimos;
- procura segredos acidentais;
- valida referências de pacotes compostos;
- confirma que todo kit `pronto` tem configuração de build.

### `montar-kits.yml`

Executa manualmente e em tags de preparação:

- monta todos os kits elegíveis;
- gera os ZIPs;
- calcula SHA-256;
- verifica que o conteúdo do ZIP respeita allowlist/denylist;
- publica `dist/` como artifact do workflow;
- gera uma matriz resultante com hashes.

### `release-kits.yml`

Somente para releases comerciais aprovadas:

- valida novamente;
- monta a partir do commit fixado;
- gera checksums;
- anexa os ZIPs à GitHub Release;
- gera manifesto de release.

Enquanto o repositório estiver público em desenvolvimento, releases comerciais com conteúdo que não deva ficar público não serão publicadas.

## 13. Versionamento

Cada kit terá versão independente usando SemVer.

- PATCH: correção sem quebra;
- MINOR: nova funcionalidade compatível;
- MAJOR: mudança incompatível.

O pacote composto terá sua própria versão, independente das versões internas.

O manifesto do pacote registra exatamente quais versões de cada kit foram incluídas.

## 14. Estados

### Estado técnico

Vem do `utilidades`:

- `stable`;
- `implemented`;
- outros estados futuros.

### Estado comercial

Controlado no `DevKitTools`:

- `planejado`;
- `preparando`;
- `qa`;
- `pronto`;
- `pausado`;
- `descontinuado`.

`stable` técnico não implica automaticamente `pronto` comercial.

## 15. Licenças e terceiros

O `DevKitTools` atualmente possui Apache-2.0 na raiz. Antes de importar e publicar os kits, a implementação deverá separar claramente:

1. código próprio ArtiSys;
2. código de terceiros incorporado;
3. dependências apenas referenciadas/instaladas;
4. avisos e atribuições obrigatórias.

Cada kit deverá gerar `TERCEIROS-E-LICENCAS.md`.

Nenhum script poderá remover notices de terceiros.

Como o repositório ficará público durante o desenvolvimento, qualquer código efetivamente publicado sob uma licença permissiva já concedida continuará sujeito aos direitos dessa versão mesmo que o repositório fique privado depois. A implementação deve, portanto, evitar tratar a futura mudança para privado como mecanismo retroativo de revogação de licenças já publicadas.

A licença comercial definitiva dos componentes próprios deve ser definida antes da primeira venda formal dos ZIPs.

## 16. Segurança de distribuição

Os workflows deverão impedir inclusão de:

- `.env`;
- arquivos `.pem`, `.key`, credenciais e tokens;
- bancos reais;
- pastas de cliente;
- dados pessoais;
- logs locais;
- segredos do GitHub Actions;
- arquivos fora da allowlist declarada no manifesto.

Cada pacote deverá ter checksum SHA-256.

## 17. Matriz inicial

A matriz inicial será gerada a partir do catálogo do `utilidades` e deverá contemplar, entre outros:

### Qualidade e Entrega
- Testes e Controle de Qualidade
- Segurança Automatizada
- Contratos e Compatibilidade de APIs
- Empacotamento e Publicação
- Validação de Instaladores e Releases
- Validação Completa do Produto
- Testes e Qualidade de IA
- Privacidade e Proteção de Dados

### Documentos e Mídia
- Geração e Leitura de PDFs
- Áudio, Vídeo e Animações
- Documentos e Planilhas Office
- Anotações em Imagens e PDFs
- Leitura e Processamento de Documentos
- Processamento e Edição de Vídeo
- Conversão de Documentos
- Reconhecimento de Texto (OCR)

### Interface e Produtividade
- Fluxos de Trabalho Visuais
- Painéis e Indicadores
- Planejamento e Cronogramas
- Construtor de Interfaces

### Arquivos e Captura
- Captura por Câmera e Códigos
- Envio e Validação de Arquivos
- Organização e Exploração de Arquivos

### Desktop e Hardware
- Integração com Dispositivos Seriais
- Impressão, Cupons e Etiquetas
- Suporte Remoto
- Estrutura Base para Aplicativos Desktop

### Plataforma e Dados
- Backend Local Embutido
- Licenciamento Offline
- Comunicação entre Módulos
- Alertas e Notificações
- Backup e Restauração
- Importação de Dados
- Acesso e Permissões
- Armazenamento de Dados
- Histórico e Auditoria
- Sincronização de Dados
- Configurações do Sistema
- Multiempresa e Isolamento de Dados
- Ativação Controlada de Funcionalidades
- Busca Local
- Exportação de Dados

### Aplicativos Web e Mobile
- Aplicativo Web Instalável e Offline
- Integração Web ↔ Aplicativo
- Abertura de Conversas no WhatsApp

### Gestão e Operação
- Motor Financeiro e Conciliação
- Estoque e Movimentações
- Ordens de Serviço
- Catálogo de Produtos e Serviços
- Preços, Descontos e Combos
- Checklists e Inspeções
- Relatórios e Indicadores
- Motor de Fluxos de Trabalho
- Aprovações
- Contatos e Organizações
- Cadastro de Ativos
- Ciclo de Vida de Ativos
- Custódia e Empréstimos
- Manutenção Preventiva
- Medidores e Leituras

### Engenharia e Agro
- Leitura e Processamento BIM/IFC
- Mapas e Recursos Agro, quando reconciliados no catálogo técnico/comercial

Módulos existentes no diretório técnico, mas ausentes ou divergentes entre `modules.json` e `module-display.pt-BR.json`, deverão entrar em uma etapa automática de reconciliação e nunca ser silenciosamente ignorados.

## 18. Preços

A infraestrutura suportará preço por kit, mas o preço não será usado como critério técnico de build.

Faixas iniciais de referência:

- kit simples: R$ 29–79;
- kit intermediário: R$ 79–149;
- kit avançado: R$ 149–297;
- pacote composto: R$ 197–597.

O preço permanecerá editável em `catalogo/kits.json` sem alterar código do kit.

## 19. README principal

O README deverá apresentar primeiro o que o comprador entende:

- nome do produto;
- categorias;
- kits disponíveis;
- estado comercial;
- versão;
- para que serve;
- links para documentação.

IDs como `artisys-auth-rbac` ficam em segundo plano, como referência técnica.

## 20. Critérios de conclusão da implementação inicial

A primeira implantação do `DevKitTools` estará concluída quando:

1. a estrutura-base existir;
2. os schemas existirem;
3. a matriz JSON e Markdown forem geradas;
4. todos os módulos reconciliados do `utilidades` aparecerem com nomes em português;
5. todo kit possuir manifesto;
6. todo kit elegível puder gerar seu ZIP canônico;
7. ZIPs possuírem SHA-256;
8. workflows de validação e montagem estiverem funcionando;
9. nenhum segredo/dado real puder entrar no ZIP sem falha do gate;
10. os pacotes compostos iniciais estiverem cadastrados;
11. o README principal mostrar o catálogo em português;
12. documentação de licenças/terceiros estiver integrada ao build;
13. `dist/` permanecer fora do Git e for gerado de forma reproduzível;
14. a mesma revisão do código produzir a mesma lista lógica de arquivos e metadados do pacote.

## 21. Fora do escopo inicial

Não faz parte desta primeira implementação:

- checkout/pagamento;
- site de vendas completo;
- sistema de licença do comprador;
- CRM de clientes;
- emissão automática de nota fiscal;
- hospedagem de download protegida fora do GitHub;
- transformação automática de todo upstream open source em produto comercial.

Esses itens podem ser adicionados depois sem mudar o contrato central de `kit → validação → ZIP → checksum → matriz`.
