# Licenciamento e distribuição

## Durante o desenvolvimento público

A licença existente na raiz rege o conteúdo efetivamente publicado sob ela. Tornar o repositório privado posteriormente **não revoga retroativamente** direitos já concedidos sobre versões que foram publicadas.

Por isso, o DevKitTools público contém catálogo, documentação e ferramentas de build, mas não deve receber silenciosamente o código comercial privado do `utilidades`.

## Terceiros

Cada kit possui `TERCEIROS-E-LICENCAS.md`. Licenças, NOTICEs e atribuições obrigatórias dos upstreams devem ser preservados no ZIP. Um kit só deve passar para estado comercial `pronto` depois de `licencasConferidas=true` e revisão humana das obrigações aplicáveis.

## Distribuição comercial

Antes da primeira venda formal, definir os termos comerciais dos componentes próprios ArtiSys separadamente das licenças de terceiros. O workflow de release exige repositório privado, `MODO_DISTRIBUICAO=privado` e token read-only para a origem técnica.
