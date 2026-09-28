function tipoValido(tipo, valor) {
  if (tipo === 'null') return valor === null;
  if (tipo === 'array') return Array.isArray(valor);
  if (tipo === 'object') return valor !== null && typeof valor === 'object' && !Array.isArray(valor);
  if (tipo === 'integer') return Number.isInteger(valor);
  return typeof valor === tipo;
}

function dateTimeValido(valor) {
  if (typeof valor !== 'string') return false;
  const padrao = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
  return padrao.test(valor) && Number.isFinite(Date.parse(valor));
}

export function validarContraSchema(schema, valor, caminho = '$') {
  const erros = [];
  const tipos = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : [];
  if (tipos.length && !tipos.some((tipo) => tipoValido(tipo, valor))) {
    return [`${caminho}: tipo inválido`];
  }
  if (schema.enum && !schema.enum.includes(valor)) erros.push(`${caminho}: valor fora do enum`);
  if (typeof valor === 'string' && schema.pattern && !(new RegExp(schema.pattern).test(valor))) {
    erros.push(`${caminho}: formato inválido`);
  }
  if (typeof valor === 'string' && schema.format === 'date-time' && !dateTimeValido(valor)) {
    erros.push(`${caminho}: date-time inválido`);
  }
  if (typeof valor === 'number' && schema.minimum !== undefined && valor < schema.minimum) {
    erros.push(`${caminho}: abaixo do mínimo`);
  }
  if (Array.isArray(valor) && schema.items) {
    valor.forEach((item, i) => erros.push(...validarContraSchema(schema.items, item, `${caminho}[${i}]`)));
    if (schema.uniqueItems) {
      const serializados = valor.map((x) => JSON.stringify(x));
      if (new Set(serializados).size !== serializados.length) erros.push(`${caminho}: itens duplicados`);
    }
  }
  if (valor !== null && typeof valor === 'object' && !Array.isArray(valor)) {
    const props = schema.properties ?? {};
    for (const req of schema.required ?? []) {
      if (!(req in valor)) erros.push(`${caminho}.${req}: obrigatório`);
    }
    if (schema.additionalProperties === false) {
      for (const chave of Object.keys(valor)) {
        if (!(chave in props)) erros.push(`${caminho}.${chave}: propriedade não permitida`);
      }
    }
    for (const [chave, sub] of Object.entries(props)) {
      if (chave in valor) erros.push(...validarContraSchema(sub, valor[chave], `${caminho}.${chave}`));
    }
  }
  return erros;
}
