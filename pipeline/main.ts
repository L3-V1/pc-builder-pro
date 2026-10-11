// `npm run pipeline`: OpenDB fixado + curadoria + preços do Mercado Livre → public/dados/.
// Sem ML_CLIENT_ID e ML_CLIENT_SECRET (ou com `--sem-coleta`): só as legadas com a Faixa de preço
// legada. `--exigir-coleta` (workflow agendado) falha em vez de cair nesse modo.
// Sai com código ≠ 0 sem gravar nada se algum ID antigo não resolve ou a saída é inválida.
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import type { z } from 'zod'
import type { Categoria } from '../src/catalogo'
import { CATEGORIAS } from '../src/catalogo/schema'
import { validarCatalogo } from '../src/catalogo/validar'
import { CAMINHOS, CONCORRENCIA_ML, ML_API } from './config'
import { IndicesCpu, IndicesGpu, ParesLegado, Selecao } from './curadoria/schema'
import { escreverDados } from './escrever'
import { lerLegado } from './legado'
import { ErroMontagem, montarCatalogo } from './montar'
import type { EntradaMontagem, Relatorio } from './montar'
import { NORMALIZADORES } from './normalizar'
import type { Normalizada } from './normalizar'
import { baixarOpenDb } from './opendb/baixar'
import { lerOpenDb } from './opendb/ler'
import { escolherModoColeta, gravarVariavel } from './precos/ambiente'
import { criarBuscarAnuncios } from './precos/anuncios'
import { criarClienteMl } from './precos/cliente'
import { coletar } from './precos/coletar'
import { obterToken } from './precos/token'

function lerCuradoria<T extends z.ZodType>(arquivo: string, schema: T): z.infer<T> {
  const bruto: unknown = JSON.parse(readFileSync(new URL(arquivo, CAMINHOS.curadoria), 'utf8'))
  const r = schema.safeParse(bruto)
  if (!r.success) {
    const detalhes = r.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')
    throw new Error(`Curadoria inválida em ${arquivo}:\n${detalhes}`)
  }
  return r.data
}

const somar = (contagem: Record<string, number>) =>
  Object.values(contagem).reduce((a, b) => a + b, 0)

function porMotivo(contagem: Record<string, number>): [string, number][] {
  const curtos = new Map<string, number>()
  for (const [motivo, n] of Object.entries(contagem)) {
    const curto = motivo.split(':')[0]
    curtos.set(curto, (curtos.get(curto) ?? 0) + n)
  }
  return [...curtos].sort((a, b) => b[1] - a[1])
}

// "socket não suportado: AM3+" e "socket não suportado: sTR5" somam no mesmo motivo.
function resumir(relatorio: Relatorio, publicadas: Record<string, number>): void {
  const colunas = ['normalizadas', 'descartadas', 'sem preço', 'com preço', 'sem anúncio']
  console.log(`\nCategoria       ${colunas.map((c) => c.padStart(12)).join('')}  publicadas`)
  for (const [categoria, r] of Object.entries(relatorio)) {
    const valores = [r.normalizadas, somar(r.descartadas), r.semPreco, r.comPreco, r.semAnuncio]
    console.log(
      `${categoria.padEnd(16)}${valores.map((v) => String(v).padStart(12)).join('')}` +
        `${String(publicadas[categoria] ?? 0).padStart(12)}`,
    )
    for (const [motivo, n] of porMotivo(r.descartadas))
      console.log(`    ${String(n).padStart(5)}  ${motivo}`)
    for (const [motivo, n] of porMotivo(r.descartesAnuncio))
      console.log(`    ${String(n).padStart(5)}  Anúncio: ${motivo}`)
    if (r.precoLegado.length > 0)
      console.log(`    ${String(r.precoLegado.length).padStart(5)}  legadas com preço legado`)
  }
}

async function gravarRelatorio(relatorio: Relatorio): Promise<void> {
  await mkdir(CAMINHOS.cache, { recursive: true })
  await writeFile(CAMINHOS.relatorio, `${JSON.stringify(relatorio, null, 2)}\n`)
  console.log(`\nRelatório completo em ${fileURLToPath(CAMINHOS.relatorio)}`)
}

function normalizadasOk(registros: Record<Categoria, unknown[]>): Normalizada[] {
  return CATEGORIAS.flatMap((c) =>
    registros[c].flatMap((registro) => {
      const r = NORMALIZADORES[c](registro)
      return r.ok ? [r.peca] : []
    }),
  )
}

// O dia da coleta no fuso do Brasil, em AAAA-MM-DD.
const hoje = () =>
  new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(new Date())

async function coletarPrecos(
  entrada: EntradaMontagem,
  registros: Record<Categoria, unknown[]>,
): Promise<NonNullable<EntradaMontagem['coleta']>> {
  const token = await obterToken(process.env)
  if (token.refreshToken) gravarVariavel(CAMINHOS.envLocal, 'ML_REFRESH_TOKEN', token.refreshToken)
  const data = hoje()
  const cliente = criarClienteMl({
    base: ML_API,
    token: token.accessToken,
    cacheDir: fileURLToPath(CAMINHOS.cacheMl(data)),
    concorrencia: CONCORRENCIA_ML,
  })
  const { precos, consultadas } = await coletar({
    normalizadas: normalizadasOk(registros),
    selecao: lerCuradoria('selecao.json', Selecao),
    indices: entrada.indices,
    pareados: new Set(entrada.pares.map((p) => p.opendbId)),
    buscar: criarBuscarAnuncios(cliente),
  })
  console.log(`${consultadas} Peças consultadas no Mercado Livre em ${data}`)
  return { data, precos }
}

async function main(): Promise<number> {
  const registros = lerOpenDb(await baixarOpenDb())
  const entrada: EntradaMontagem = {
    registros,
    indices: {
      cpu: lerCuradoria('indices-cpu.json', IndicesCpu),
      gpu: lerCuradoria('indices-gpu.json', IndicesGpu),
    },
    pares: lerCuradoria('pares-legado.json', ParesLegado),
    legado: lerLegado(),
  }
  if (existsSync(CAMINHOS.envLocal)) process.loadEnvFile(fileURLToPath(CAMINHOS.envLocal))
  let modo
  try {
    modo = escolherModoColeta(process.argv.slice(2), process.env)
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e))
    return 1
  }
  if (!modo.coletar) {
    console.warn(
      `Sem coleta de preços (${modo.motivo}): só as legadas, com a Faixa de preço legada.`,
    )
  } else {
    try {
      entrada.coleta = await coletarPrecos(entrada, registros)
    } catch (e) {
      console.error(`\nColeta de preços falhou: ${e instanceof Error ? e.message : String(e)}`)
      console.error('Para gerar só as legadas com o preço legado: npm run pipeline -- --sem-coleta')
      return 1
    }
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
