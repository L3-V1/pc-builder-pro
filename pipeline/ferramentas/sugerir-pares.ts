// Auxiliar da curadoria: para cada Peça do legado, lista os registros do OpenDB mais
// parecidos (specs iguais primeiro, depois nome), para preencher `pares-legado.json`.
// Uso: npx tsx pipeline/ferramentas/sugerir-pares.ts [idAntigo...]
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { Peca } from '../../src/catalogo'
import { CAMINHOS } from '../config'
import { lerLegado } from '../legado'
import { NORMALIZADORES } from '../normalizar'
import type { Normalizada } from '../normalizar'
import { baixarOpenDb } from '../opendb/baixar'
import { lerOpenDb } from '../opendb/ler'
import { kebab } from '../slug'

const IGNORADOS = new Set(['id', 'nome', 'marca', 'faixaPreco', 'indices', 'categoria'])
const IGNORADOS_EXTRA = new Set(['indiceVideoIntegrado', 'fonteRecomendadaW', 'opendbId', 'chave'])

// "500 GB" e "500GB" viram o mesmo token.
const tokens = (s: string) =>
  new Set(
    kebab(s.replace(/(\d)\s+(gb|tb|mm|w)\b/gi, '$1$2'))
      .split('-')
      .filter(Boolean),
  )

function specsIguais(antiga: Peca, n: Normalizada): { iguais: number; total: number } {
  let iguais = 0
  let total = 0
  for (const [k, v] of Object.entries(antiga)) {
    if (IGNORADOS.has(k) || IGNORADOS_EXTRA.has(k)) continue
    total++
    const outro = (n as Record<string, unknown>)[k]
    // Listas (sockets, form factors): basta cobrir o que a Peça antiga suportava.
    if (Array.isArray(v) && Array.isArray(outro)) {
      if (v.every((x) => outro.includes(x))) iguais++
    } else if (v === outro) iguais++
  }
  return { iguais, total }
}

function semelhanca(antiga: Peca, n: Normalizada): number {
  const a = tokens(`${antiga.marca} ${antiga.nome}`)
  const b = tokens(`${n.marca} ${n.nome} ${n.chave ?? ''}`)
  let comuns = 0
  for (const t of a) if (b.has(t)) comuns++
  return comuns / a.size
}

const registros = lerOpenDb(await baixarOpenDb())
const legado = lerLegado()
const filtro = new Set(process.argv.slice(2))

const sugestoes: Record<string, { opendbId: string; nota: string; nome: string }[]> = {}
for (const antiga of legado.pecas) {
  if (filtro.size > 0 && !filtro.has(antiga.id)) continue
  const candidatas = registros[antiga.categoria].flatMap((r) => {
    const n = NORMALIZADORES[antiga.categoria](r)
    return n.ok ? [n.peca] : []
  })
  const ordenadas = candidatas
    .map((n) => ({ n, specs: specsIguais(antiga, n), nome: semelhanca(antiga, n) }))
    .sort(
      (x, y) =>
        y.nome - x.nome || y.specs.iguais - x.specs.iguais || x.n.nome.length - y.n.nome.length,
    )
    .slice(0, 5)
  sugestoes[antiga.id] = ordenadas.map(({ n, specs, nome }) => ({
    opendbId: n.opendbId,
    nota: `specs ${specs.iguais}/${specs.total} · nome ${nome.toFixed(2)}`,
    nome: `${n.marca} | ${n.nome}${n.chave ? ` | ${n.chave}` : ''}`,
  }))
  const melhor = ordenadas[0]
  // Nome incompleto ou spec diferente: precisa de olho humano antes de entrar na curadoria.
  const revisar = !melhor || melhor.nome < 1 || melhor.specs.iguais < melhor.specs.total
  console.log(`\n${revisar ? '⚠ ' : ''}${antiga.id} (${antiga.marca} ${antiga.nome})`)
  for (const s of sugestoes[antiga.id]) console.log(`  ${s.opendbId}  ${s.nota}  ${s.nome}`)
}

const destino = new URL('sugestoes-pares.json', CAMINHOS.cache)
writeFileSync(destino, `${JSON.stringify(sugestoes, null, 2)}\n`)
console.log(`\nSugestões em ${fileURLToPath(destino)}`)
