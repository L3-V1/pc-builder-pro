import { describe, expect, it } from 'vitest'
import { carregarDesafios } from '.'
import { lerCatalogoPublicado } from '../teste/dadosPublicados'
import { avaliarDesafio } from '../motor'
import { remontarBuild, resolverIds } from '../persistencia/remontar'

// Soluções de referência: ficam no teste para não irem ao bundle como "resposta". Usam os IDs
// anteriores ao pipeline do OpenDB, resolvidos pelos aliases publicados.
const SOLUCOES: Record<string, string[]> = {
  'primeiro-pc': [
    'placa-mae-h610m-k-ddr4',
    'cpu-core-i5-12400',
    'ram-kingston-8gb-ddr4-3200',
    'armazenamento-kingston-a400-240gb',
    'fonte-mwe-450',
    'gabinete-kmex-matx',
  ],
  'escritorio-video-integrado': [
    'placa-mae-a620m-hdv-m2',
    'cpu-ryzen-5-8600g',
    'ram-kingston-16gb-ddr5-5200',
    'armazenamento-kingston-a400-240gb',
    'fonte-mwe-450',
    'gabinete-kmex-matx',
  ],
  'gamer-de-entrada': [
    'placa-mae-a520m-k',
    'cpu-ryzen-5-5500',
    'ram-corsair-16gb-ddr4-3200',
    'gpu-rx-6600',
    'armazenamento-kingston-a400-240gb',
    'fonte-mwe-450',
    'gabinete-kmex-matx',
  ],
  'orcamento-apertado': [
    'placa-mae-a520m-k',
    'cpu-ryzen-5-5500',
    'ram-corsair-16gb-ddr4-3200',
    'gpu-rx-6600',
    'armazenamento-kingston-a400-240gb',
    'fonte-mwe-450',
    'gabinete-kmex-matx',
  ],
  'refrigeracao-de-verdade': [
    'placa-mae-h610m-k-ddr4',
    'cpu-core-i5-12400f',
    'cooler-deepcool-ak400',
    'ram-corsair-16gb-ddr4-3200',
    'gpu-rx-6600',
    'armazenamento-kingston-a400-240gb',
    'fonte-mwe-450',
    'gabinete-kmex-matx',
  ],
  'custo-beneficio': [
    'placa-mae-a520m-k',
    'cpu-ryzen-5-5500',
    'ram-corsair-16gb-ddr4-3200',
    'gpu-rx-9060-xt-8gb',
    'armazenamento-kingston-a400-240gb',
    'fonte-mwe-450',
    'gabinete-kmex-matx',
  ],
  'estacao-de-trabalho': [
    'placa-mae-a620m-hdv-m2',
    'cpu-ryzen-9-9950x',
    'cooler-deepcool-ak400',
    'ram-kingston-16gb-ddr5-5200',
    'armazenamento-kingston-a400-240gb',
    'fonte-mwe-450',
    'gabinete-kmex-matx',
  ],
  equilibrado: [
    'placa-mae-h610m-k-ddr4',
    'cpu-core-i5-14600kf',
    'cooler-deepcool-ak400',
    'ram-corsair-16gb-ddr4-3200',
    'gpu-rtx-4060',
    'armazenamento-kingston-a400-240gb',
    'fonte-msi-mag-a650bn',
    'gabinete-kmex-matx',
  ],
  streamer: [
    'placa-mae-h610m-k-ddr4',
    'cpu-core-i5-14600kf',
    'cooler-deepcool-ak400',
    'ram-corsair-16gb-ddr4-3200',
    'gpu-rx-7800-xt',
    'armazenamento-kingston-a400-240gb',
    'fonte-msi-mag-a750gl',
    'gabinete-kmex-matx',
  ],
  'gamer-topo': [
    'placa-mae-a520m-k',
    'cpu-ryzen-5-5600',
    'ram-corsair-16gb-ddr4-3200',
    'gpu-rx-9070',
    'armazenamento-kingston-a400-240gb',
    'fonte-msi-mag-a650bn',
    'gabinete-kmex-matx',
  ],
}

const desafios = carregarDesafios()
const { pecas, aliases } = lerCatalogoPublicado()

describe('soluções de referência', () => {
  it('todo Desafio tem uma solução de referência', () => {
    expect(Object.keys(SOLUCOES).sort()).toEqual(desafios.map((d) => d.id).sort())
  })

  it.each(desafios.map((d) => [d.id, d] as const))('%s é possível', (id, desafio) => {
    const { pecas: solucao, desconhecidos } = resolverIds(SOLUCOES[id] ?? [], pecas, aliases)
    expect(desconhecidos).toEqual([])
    const { build, recusadas } = remontarBuild(solucao)
    expect(recusadas).toEqual([])
    const avaliacao = avaliarDesafio(desafio, build)
    expect(avaliacao.criterios.filter((c) => !c.cumprido)).toEqual([])
    expect(avaliacao.cumprido).toBe(true)
  })
})
