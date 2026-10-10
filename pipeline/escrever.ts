import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { format, resolveConfig } from 'prettier'
import type { Catalogo } from '../src/catalogo'
import { ARQUIVOS_DADOS } from '../src/catalogo/carregar'

// Formatado como o resto do repositório, para `npm run lint` passar e o diff ficar legível.
async function gravarJson(pasta: URL, arquivo: string, dados: unknown): Promise<void> {
  const destino = new URL(`${arquivo}.json`, pasta)
  const opcoes = await resolveConfig(fileURLToPath(destino))
  await writeFile(destino, await format(JSON.stringify(dados), { ...opcoes, parser: 'json' }))
}

// Mesmo formato que o app busca: um arquivo por Categoria, `meta.json` e `aliases.json`.
export async function escreverDados(pasta: URL, catalogo: Catalogo): Promise<void> {
  await mkdir(pasta, { recursive: true })
  await gravarJson(pasta, 'meta', { dataReferencia: catalogo.dataReferencia })
  await gravarJson(pasta, 'aliases', catalogo.aliases)
  for (const arquivo of ARQUIVOS_DADOS) {
    await gravarJson(
      pasta,
      arquivo,
      catalogo.pecas.filter((p) => p.categoria === arquivo),
    )
  }
}
