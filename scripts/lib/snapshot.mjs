import fs from 'node:fs/promises';
import path from 'node:path';
import {existe, listarArquivosPermitidos} from './arquivos.mjs';

async function copiarArquivos(rootOrigem, rootDestino, arquivos) {
  for (const rel of arquivos) {
    const origem = path.join(rootOrigem, ...rel.split('/'));
    const destino = path.join(rootDestino, ...rel.split('/'));
    await fs.mkdir(path.dirname(destino), {recursive: true});
    await fs.copyFile(origem, destino);
  }
}

export async function copiarSnapshot({origemModulo, destinoProduto}) {
  if (!origemModulo || !(await existe(origemModulo))) {
    throw new Error(`Origem do snapshot não encontrada: ${origemModulo ?? '(não informada)'}`);
  }

  const arquivos = await listarArquivosPermitidos(origemModulo);
  const temporario = `${destinoProduto}.tmp-${process.pid}-${Date.now()}`;
  await fs.rm(temporario, {recursive: true, force: true});
  await fs.mkdir(temporario, {recursive: true});

  try {
    await copiarArquivos(origemModulo, temporario, arquivos);
    await fs.rm(destinoProduto, {recursive: true, force: true});
    await fs.mkdir(path.dirname(destinoProduto), {recursive: true});
    await fs.rename(temporario, destinoProduto);
  } catch (error) {
    await fs.rm(temporario, {recursive: true, force: true});
    throw error;
  }

  return {arquivos};
}

export async function validarSnapshotKit({kit, kitDir}) {
  if (!kit?.build?.habilitado) return {arquivos: []};

  const produto = path.join(kitDir, 'produto');
  if (!(await existe(produto))) {
    throw new Error(`Kit ${kit.slug}: diretório produto/ ausente.`);
  }

  const arquivos = await listarArquivosPermitidos(produto);
  if (arquivos.length === 0) {
    throw new Error(`Kit ${kit.slug}: diretório produto/ está vazio.`);
  }

  return {arquivos};
}
