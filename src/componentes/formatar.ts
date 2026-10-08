const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatarReais(valor: number): string {
  return moeda.format(valor)
}

export function formatarDataReferencia(aaaaMm: string): string {
  const [ano, mes] = aaaaMm.split('-').map(Number)
  return new Date(ano, mes - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

const moedaSemCentavos = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

export function formatarReaisSemCentavos(valor: number): string {
  return moedaSemCentavos.format(valor)
}
