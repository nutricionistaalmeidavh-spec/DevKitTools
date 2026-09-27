# Como adicionar um kit

1. Registre o módulo técnico no `utilidades`.
2. Garanta nome, categoria e descrição em português.
3. Atualize `catalogo/semente-modulos.tsv` ou use `scripts/importar-do-utilidades.mjs` quando os catálogos técnicos estiverem reconciliados.
4. Execute `npm run gerar:catalogo`.
5. Execute `npm run preparar:kits`.
6. Revise README, instalação, integração e licenças do kit.
7. Execute `npm run matriz`, `npm test`, `npm run validar` e `npm run verificar:secrets`.
8. Marque o kit como `qa` e, depois da homologação, `pronto` com preço, documentação e licenças conferidas.
9. Gere o ZIP canônico e o SHA-256 usando o checkout autorizado do `utilidades`.

IDs técnicos `artisys-*` não são renomeados. O comprador vê prioritariamente o nome comercial em português.
