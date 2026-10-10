// `npm run pipeline`: OpenDB fixado + curadoria + Catálogo legado → public/dados/.
// Sai com código ≠ 0 sem gravar nada se algum ID antigo não resolve ou a saída é inválida.
import { readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import type { z } from 'zod'
import { validarCatalogo } from '../src/catalogo/validar'
import { CAMINHOS } from './config'
import { IndicesCpu, IndicesGpu, ParesLegado } from './curadoria/schema'
import { escreverDados } from './escrever'
import { lerLegado } from './legado'
import { ErroMontagem, montarCatalogo } from './montar'
import type { Relatorio } from './montar'
import { baixarOpenDb } from './opendb/baixar'
import { lerOpenDb } from './opendb/ler'

function lerCuradoria<T extends z.ZodType>(arquivo: string, schema: T): z.infer<T> {
  const bruto: unknown = JSON.parse(readFileSync(new URL(arquivo, CAMINHOS.curadoria), 'utf8'))
  const r = schema.safeParse(bruto)
  if (!r.success) {
    const detalhes = r.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')
    throw new Error(`Curadoria inválida em ${arquivo}:\n${detalhes}`)
  }
  return r.data
}

// "socket não suportado: AM3+" e "socket não suportado: sTR5" somam no mesmo motivo.
function resumir(relatorio: Relatorio, publicadas: Record<string, number>): void {
  console.log('\nCategoria       normalizadas  descartadas  sem preço  publicadas')
  for (const [categoria, r] of Object.entries(relatorio)) {
    const descartadas = Object.values(r.descartadas).reduce((a, b) => a + b, 0)
    console.log(
      `${categoria.padEnd(16)}${String(r.normalizadas).padStart(12)}${String(descartadas).padStart(13)}` +
        `${String(r.semPreco).padStart(11)}${String(publicadas[categoria] ?? 0).padStart(12)}`,
    )
    const porMotivo = new Map<string, number>()
    for (const [motivo, n] of Object.entries(r.descartadas)) {
      const curto = motivo.split(':')[0]
      porMotivo.set(curto, (porMotivo.get(curto) ?? 0) + n)
    }
    for (const [motivo, n] of [...porMotivo].sort((a, b) => b[1] - a[1])) {
      console.log(`    ${String(n).padStart(5)}  ${motivo}`)
    }
  }
}

async function gravarRelatorio(relatorio: Relatorio): Promise<void> {
  await mkdir(CAMINHOS.cache, { recursive: true })
  await writeFile(CAMINHOS.relatorio, `${JSON.stringify(relatorio, null, 2)}\n`)
  console.log(`\nRelatório completo em ${fileURLToPath(CAMINHOS.relatorio)}`)
}

async function main(): Promise<number> {
  const registros = lerOpenDb(await baixarOpenDb())
  const entrada = {
    registros,
    indices: {
      cpu: lerCuradoria('indices-cpu.json', IndicesCpu),
      gpu: lerCuradoria('indices-gpu.json', IndicesGpu),
    },
    pares: lerCuradoria('pares-legado.json', ParesLegado),
    legado: lerLegado(),
  }
  let saida
  try {
    saida = montarCatalogo(entrada)
  } catch (e) {
    if (!(e instanceof ErroMontagem)) throw e
    await gravarRelatorio(e.relatorio)
    console.error(`\n${e.message}`)
    return 1
  }
  const validacao = validarCatalogo(saida.catalogo)
  if (!validacao.ok) {
    console.error('\nCatálogo gerado inválido:')
    for (const erro of validacao.erros) console.error(`  ${erro.caminho}: ${erro.mensagem}`)
    return 1
  }
  await escreverDados(CAMINHOS.saida, validacao.catalogo)
  const publicadas: Record<string, number> = {}
  for (const p of validacao.catalogo.pecas)
    publicadas[p.categoria] = (publicadas[p.categoria] ?? 0) + 1
  resumir(saida.relatorio, publicadas)
  await gravarRelatorio(saida.relatorio)
  console.log(
    `\n${validacao.catalogo.pecas.length} Peças e ${Object.keys(validacao.catalogo.aliases).length} aliases em ${fileURLToPath(CAMINHOS.saida)}`,
  )
  return 0
}

process.exitCode = await main()
