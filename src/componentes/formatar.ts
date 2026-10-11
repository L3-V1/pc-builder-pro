const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatarReais(valor: number): string {
  return moeda.format(valor)
}

// AAAA-MM vira "outubro de 2026"; AAAA-MM-DD (dia da coleta) vira "11 de outubro de 2026".
export function formatarDataReferencia(data: string): string {
  const [ano, mes, dia] = data.split('-').map(Number)
  return new Date(ano, mes - 1, dia ?? 1).toLocaleDateString('pt-BR', {
    day: dia === undefined ? undefined : 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const moedaSemCentavos = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

export function formatarReaisSemCentavos(valor: number): string {
  return moedaSemCentavos.format(valor)
}
