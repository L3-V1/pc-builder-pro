import type { FaixaPreco } from '../../src/catalogo'

// Interpolação linear entre os vizinhos: com p = 0,5 é a mediana (média dos dois do meio se par).
function percentil(ordenados: number[], p: number): number {
  const posicao = (ordenados.length - 1) * p
  const abaixo = Math.floor(posicao)
  const acima = Math.ceil(posicao)
  return ordenados[abaixo] + (posicao - abaixo) * (ordenados[acima] - ordenados[abaixo])
}

export const mediana = (precos: number[]): number =>
  percentil(
    precos.toSorted((a, b) => a - b),
    0.5,
  )

// O schema exige reais positivos: centavos não arredondam para zero.
const reais = (valor: number) => Math.max(1, Math.round(valor))

// Faixa de preço dos Anúncios válidos: mín, mediana e p90, em reais inteiros.
export function calcularFaixa(precos: number[], minimo: number): FaixaPreco | null {
  if (precos.length < minimo) return null
  const ordenados = precos.toSorted((a, b) => a - b)
  return {
    min: reais(ordenados[0]),
    medio: reais(percentil(ordenados, 0.5)),
    max: reais(percentil(ordenados, 0.9)),
  }
}
