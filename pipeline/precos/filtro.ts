import type { Normalizada } from '../normalizar'
import type { Anuncio } from './anuncios'
import { palavras, tokensModelo } from './consulta'
import type { Tokens } from './consulta'
import { mediana } from './faixa'

export type Filtragem = { validos: Anuncio[]; descartes: Record<string, number> }

const COMBO = /\bcombo\b/i
const KIT = /\bkit\b/i
const UNIDADES = /\b([2-9]|\d{2,})\s*(unidades|unid|un)\b/i

// Um kit de RAM com vários módulos é a própria Peça: "kit" no título não é descarte.
function ehKit(peca: Normalizada, anuncio: Anuncio): boolean {
  const kitDaPeca = peca.categoria === 'ram' && peca.modulos > 1
  return (
    (anuncio.quantidadeKit ?? 1) > 1 ||
    COMBO.test(anuncio.titulo) ||
    UNIDADES.test(anuncio.titulo) ||
    (!kitDaPeca && KIT.test(anuncio.titulo))
  )
}

function outroModelo({ obrigatorios, proibidos }: Tokens, anuncio: Anuncio): boolean {
  const titulo = new Set(palavras(anuncio.titulo))
  return obrigatorios.some((p) => !titulo.has(p)) || proibidos.some((p) => titulo.has(p))
}

function motivoDescarte(peca: Normalizada, tokens: Tokens, anuncio: Anuncio): string | undefined {
  if (anuncio.condicao !== 'novo') return 'usado'
  if (ehKit(peca, anuncio)) return 'kit'
  if (outroModelo(tokens, anuncio)) return 'modelo diferente'
  return undefined
}

// Cada Anúncio descartado conta no seu motivo, como os descartes do normalizador.
export function filtrarAnuncios(peca: Normalizada, anuncios: Anuncio[]): Filtragem {
  const tokens = tokensModelo(peca)
  const descartes: Record<string, number> = {}
  const descartar = (motivo: string) => (descartes[motivo] = (descartes[motivo] ?? 0) + 1)
  const daPeca: Anuncio[] = []
  for (const anuncio of anuncios) {
    const motivo = motivoDescarte(peca, tokens, anuncio)
    if (motivo === undefined) daPeca.push(anuncio)
    else descartar(motivo)
  }
  // A referência dos outliers é a mediana dos Anúncios que já são da Peça.
  const referencia = daPeca.length > 0 ? mediana(daPeca.map((a) => a.preco)) : 0
  const validos = daPeca.filter((a) => {
    const dentro = a.preco >= referencia * 0.5 && a.preco <= referencia * 2
    if (!dentro) descartar('outlier')
    return dentro
  })
  return { validos, descartes }
}
