# Escopo de licenças do DevKitTools

O `DevKitTools` é um repositório multi-licença.

## Tooling e documentação da raiz

O código de automação, scripts de catálogo, workflows e documentação próprios do DevKitTools, quando estiverem fora de `kits/*/produto/` e não trouxerem aviso específico diferente, usam Apache License 2.0. O texto integral está em `LICENSE-APACHE-2.0`.

## Código dos produtos comerciais

O conteúdo versionado em `kits/*/produto/` não é automaticamente relicenciado sob Apache License 2.0 pela licença da raiz.

Cada snapshot preserva a licença que já se aplica ao código importado. Arquivos `LICENSE`, `NOTICE`, cabeçalhos de copyright e atribuições presentes na origem devem ser mantidos no snapshot e na distribuição quando exigido por sua licença.

Copiar um arquivo para o DevKitTools não altera a licença daquele arquivo.

## Regra de prontidão comercial

Um kit não pode ser marcado como `pronto` enquanto `licencasConferidas = false`.

Antes de alterar `licencasConferidas` para `true`, deve ser conferido ao menos:

- se há `LICENSE` ou `NOTICE` no snapshot;
- se dependências redistribuídas exigem atribuição;
- se há componente copyleft com obrigações adicionais;
- se a documentação `TERCEIROS-E-LICENCAS.md` reflete fatos verificáveis do snapshot.

Essa revisão é independente de o código ser próprio ou de terceiros.
