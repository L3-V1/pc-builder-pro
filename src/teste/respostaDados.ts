// Sem imports de módulos do app: os e2e (tsconfig.node) também importam este arquivo.
import fixture from './catalogo.json' with { type: 'json' }

// Fatia a fixture no mesmo formato de `dados/<arquivo>.json` servido em produção.
export function respostaDados(arquivo: string): unknown {
  if (arquivo === 'meta') return { dataReferencia: fixture.dataReferencia }
  return fixture.pecas.filter((p) => p.categoria === arquivo)
}

export function faixaPrecoFixture(id: string) {
  const p = fixture.pecas.find((x) => x.id === id)
  if (!p) throw new Error(`Peça ${id} não existe na fixture`)
  return p.faixaPreco
}
