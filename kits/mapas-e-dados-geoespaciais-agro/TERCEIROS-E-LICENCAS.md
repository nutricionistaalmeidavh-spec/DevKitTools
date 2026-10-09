# Terceiros e licenças — Mapas e Dados Geoespaciais Agro

## Separação entre código do kit e dados de terceiros

O código deste kit (normalização GeoJSON, validação WGS84 e topológica, snapshots espaciais e planejamento de download PMTiles) foi generalizado pela ArtiSys a partir do SistemaLavoura. A licença de distribuição do código de titularidade ArtiSys desta versão está em `produto/LICENSE`; isso não apaga licenças de versões anteriores ou direitos de terceiros.

**O ZIP deste kit não contém** mapas `.pmtiles`, `.osm.pbf`, `.mbtiles`, extratos OpenStreetMap nem arquivos cartográficos de terceiros. Os mapas podem ser baixados separadamente de uma origem escolhida pela aplicação consumidora.

## Dados do OpenStreetMap e mapas brasileiros

- Fonte de dados quando utilizada: OpenStreetMap e seus contribuidores.
- Licença dos dados: **Open Database License (ODbL) 1.0**, com obrigações de atribuição e condições aplicáveis a bases derivadas.
- Crédito usual na aplicação ao exibir esses dados: **© OpenStreetMap contributors** — https://www.openstreetmap.org/copyright
- Referência de distribuição mantida pela ArtiSys: `nutricionistaalmeidavh-spec/mapasbrasilrelease`, com `LICENSE-DATA.md` e `NOTICE.md`. A licença dos dados não se confunde com a do código do kit.
- Informações de origem e transformação, assim como eventuais obrigações de distribuição das bases de dados, devem acompanhar os mapas efetivamente utilizados.

## Formato PMTiles e bibliotecas opcionais

O uso do formato PMTiles não significa que pacotes de mapas ou a biblioteca PMTiles tenham sido incluídos neste ZIP.

`@xmldom/xmldom`, `@tmcw/togeojson`, `fflate`, `shpjs` e `isoxml` são citados no manifesto como adaptadores **opcionais**; nenhum deles consta como dependência obrigatória em `produto/package.json`. Quem optar por instalar e distribuir qualquer biblioteca ou componente externo deve conferir a licença da versão efetivamente utilizada e manter os avisos exigidos.

## Conferência de distribuição

- [x] Código GIS deste snapshot inspecionado: somente arquivos do próprio módulo.
- [x] Ausência de pacotes de mapas ou bibliotecas de terceiros vendidas como parte do ZIP.
- [x] Fonte e licença dos dados OpenStreetMap documentadas.
- [x] Termos de uso comercial do código autoral separados dos direitos de terceiros.
- [ ] Conferência final pelo titular sobre autoria, histórico de contribuições e direitos de terceiros antes de declarar este item comercialmente homologado.

A origem técnica `SistemaLavoura` tem histórico sob AGPL-3.0-only; a possibilidade de oferecer separadamente o código autoral sob licença comercial pressupõe titularidade ou autorização adequada. Direitos preexistentes de destinatários de versões AGPL não são revogados.
