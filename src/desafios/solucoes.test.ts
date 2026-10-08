import { describe, expect, it } from 'vitest'
import { carregarDesafios } from '.'
import { carregarCatalogo } from '../catalogo'
import { avaliarDesafio } from '../motor'
import { remontarBuild, resolverIds } from '../persistencia/remontar'

// Soluções de referência: ficam no teste para não irem ao bundle como "resposta".
const SOLUCOES: Record<string, string[]> = {
  'primeiro-pc': [
    'placa-mae-b760m-ds3h-ddr4',
    'cpu-core-i5-12400',
    'ram-corsair-16gb-ddr4-3200',
    'armazenamento-sata-480gb',
    'fonte-mwe-450',
    'gabinete-kmex-matx',
  ],
  'escritorio-video-integrado': [
    'placa-mae-b760m-ds3h-ddr4',
    'cpu-core-i5-12400',
    'ram-kingston-32gb-ddr4-3200',
    'armazenamento-sata-480gb',
    'fonte-mwe-450',
    'gabinete-kmex-matx',
  ],
  'gamer-de-entrada': [
    'placa-mae-b760m-ds3h-ddr4',
    'cpu-core-i5-12400f',
    'ram-corsair-16gb-ddr4-3200',
    'gpu-rx-6600',
    'armazenamento-sata-480gb',
    'fonte-cx550',
    'gabinete-kmex-matx',
  ],
  'orcamento-apertado': [
    'placa-mae-a520m-k',
    'cpu-ryzen-5-5600',
    'ram-corsair-16gb-ddr4-3200',
    'gpu-rx-6600',
    'armazenamento-sata-480gb',
    'fonte-cx550',
    'gabinete-kmex-matx',
  ],
  'refrigeracao-de-verdade': [
    'placa-mae-b760m-ds3h-ddr4',
    'cpu-core-i5-12400f',
    'cooler-deepcool-ak400',
    'ram-corsair-16gb-ddr4-3200',
    'gpu-rx-6600',
    'armazenamento-sata-480gb',
    'fonte-cx550',
    'gabinete-kmex-matx',
  ],
  'custo-beneficio': [
    'placa-mae-b650m-aorus-elite',
    'cpu-ryzen-5-7600',
    'ram-kingston-16gb-ddr5-5200',
    'gpu-rtx-4060',
    'armazenamento-sata-480gb',
    'fonte-cx550',
    'gabinete-kmex-matx',
  ],
  'estacao-de-trabalho': [
    'placa-mae-b760m-ds3h-ddr4',
    'cpu-core-i7-14700k',
    'cooler-deepcool-ak400',
    'ram-kingston-32gb-ddr4-3200',
    'gpu-rtx-3050-6gb',
    'armazenamento-nvme-1tb',
    'fonte-cx650',
    'gabinete-kmex-matx',
  ],
  equilibrado: [
    'placa-mae-b760m-ds3h-ddr4',
    'cpu-core-i7-14700k',
    'cooler-deepcool-ak400',
    'ram-kingston-32gb-ddr4-3200',
    'gpu-rx-6600',
    'armazenamento-sata-480gb',
    'fonte-cx650',
    'gabinete-kmex-matx',
  ],
  streamer: [
    'placa-mae-b760m-ds3h-ddr4',
    'cpu-core-i7-14700k',
    'cooler-deepcool-ak400',
    'ram-kingston-32gb-ddr4-3200',
    'gpu-rx-7800-xt',
    'armazenamento-sata-480gb',
    'fonte-rm850x',
    'gabinete-kmex-matx',
  ],
  'gamer-topo': [
    'placa-mae-b650m-aorus-elite',
    'cpu-ryzen-7-7800x3d',
    'cooler-deepcool-ak400',
    'ram-corsair-32gb-ddr5-6000',
    'gpu-rtx-4070-super',
    'armazenamento-nvme-1tb',
    'fonte-cx650',
    'gabinete-kmex-matx',
  ],
}

const desafios = carregarDesafios()
const { pecas } = carregarCatalogo()

describe('soluções de referência', () => {
  it('todo Desafio tem uma solução de referência', () => {
    expect(Object.keys(SOLUCOES).sort()).toEqual(desafios.map((d) => d.id).sort())
  })

  it.each(desafios.map((d) => [d.id, d] as const))('%s é possível', (id, desafio) => {
    const { pecas: solucao, desconhecidos } = resolverIds(SOLUCOES[id] ?? [], pecas)
    expect(desconhecidos).toEqual([])
    const { build, recusadas } = remontarBuild(solucao)
    expect(recusadas).toEqual([])
    const avaliacao = avaliarDesafio(desafio, build)
    expect(avaliacao.criterios.filter((c) => !c.cumprido)).toEqual([])
    expect(avaliacao.cumprido).toBe(true)
  })
})
