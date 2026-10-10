import { describe, expect, it } from 'vitest'
import { lerCatalogoPublicado } from '../teste/dadosPublicados'
import { CATEGORIAS, FORM_FACTORS, SOCKETS, TIPOS_RAM } from './schema'
import { validarCatalogo } from './validar'

const { dataReferencia, pecas } = lerCatalogoPublicado()

// Links compartilhados e soluções dos Desafios dependem destes IDs.
const IDS_ANTERIORES_A_FASE_8 = [
  'cpu-ryzen-5-5600',
  'cpu-ryzen-5-7600',
  'cpu-ryzen-7-7800x3d',
  'cpu-core-i5-12400f',
  'cpu-core-i5-12400',
  'cpu-core-i7-14700k',
  'placa-mae-a520m-k',
  'placa-mae-b650m-aorus-elite',
  'placa-mae-b650-tomahawk-wifi',
  'placa-mae-b650i-aorus-ultra',
  'placa-mae-b760m-ds3h-ddr4',
  'placa-mae-z790-pro-atx-ddr4',
  'ram-corsair-16gb-ddr4-3200',
  'ram-kingston-32gb-ddr4-3200',
  'ram-kingston-16gb-ddr5-5200',
  'ram-corsair-32gb-ddr5-6000',
  'ram-gskill-64gb-ddr5-6000',
  'gpu-rtx-3050-6gb',
  'gpu-rx-6600',
  'gpu-rtx-4060',
  'gpu-rx-7800-xt',
  'gpu-rtx-4070-super',
  'armazenamento-nvme-500gb',
  'armazenamento-nvme-1tb',
  'armazenamento-nvme-2tb',
  'armazenamento-sata-480gb',
  'armazenamento-sata-1tb',
  'fonte-mwe-450',
  'fonte-cx550',
  'fonte-cx650',
  'fonte-rm750e',
  'fonte-rm850x',
  'gabinete-kmex-matx',
  'gabinete-nzxt-h5-flow',
  'gabinete-corsair-4000d',
  'gabinete-lian-li-a4-h2o',
  'gabinete-pichau-ventus',
  'cooler-deepcool-ak400',
  'cooler-deepcool-ak620',
  'cooler-cooler-master-hyper-212-am4',
  'cooler-corsair-h100i-elite',
  'cooler-arctic-lf3-360',
]

describe('Catálogo real', () => {
  it('passa em validarCatalogo sem erros', () => {
    const resultado = validarCatalogo({ dataReferencia, pecas })
    expect(resultado).toEqual({ ok: true, catalogo: { dataReferencia, pecas } })
  })

  it('tem de 140 a 160 Peças e pelo menos 12 por categoria', () => {
    for (const categoria of CATEGORIAS) {
      const total = pecas.filter((p) => p.categoria === categoria).length
      expect(total, categoria).toBeGreaterThanOrEqual(12)
    }
    expect(pecas.length).toBeGreaterThanOrEqual(140)
    expect(pecas.length).toBeLessThanOrEqual(160)
  })

  it.each(SOCKETS)('tem placa-mãe, CPU e cooler para o socket %s', (socket) => {
    expect(pecas.some((p) => p.categoria === 'placa-mae' && p.socket === socket)).toBe(true)
    expect(pecas.some((p) => p.categoria === 'cpu' && p.socket === socket)).toBe(true)
    expect(
      pecas.some((p) => p.categoria === 'cooler' && p.socketsSuportados.includes(socket)),
    ).toBe(true)
  })

  it.each(TIPOS_RAM)('tem placa-mãe e RAM %s', (tipoRam) => {
    expect(pecas.some((p) => p.categoria === 'placa-mae' && p.tipoRam === tipoRam)).toBe(true)
    expect(pecas.some((p) => p.categoria === 'ram' && p.tipoRam === tipoRam)).toBe(true)
  })

  it.each(FORM_FACTORS)('tem placa-mãe %s e gabinete que a aceita', (formFactor) => {
    expect(pecas.some((p) => p.categoria === 'placa-mae' && p.formFactor === formFactor)).toBe(true)
    expect(
      pecas.some((p) => p.categoria === 'gabinete' && p.formFactorsSuportados.includes(formFactor)),
    ).toBe(true)
  })

  it('mantém os IDs das Peças anteriores à Fase 8', () => {
    const ids = new Set(pecas.map((p) => p.id))
    for (const id of IDS_ANTERIORES_A_FASE_8) expect(ids.has(id), id).toBe(true)
  })

  it('cobre os casos de borda da Fase 2', () => {
    expect(pecas.some((p) => p.categoria === 'cpu' && !p.videoIntegrado)).toBe(true)
    expect(pecas.some((p) => p.categoria === 'cpu' && !p.coolerBox)).toBe(true)
    expect(
      pecas.some((p) => p.categoria === 'gabinete' && !p.formFactorsSuportados.includes('ATX')),
    ).toBe(true)
    expect(pecas.some((p) => p.categoria === 'armazenamento' && p.interface === 'SATA')).toBe(true)
  })

  it('tem índices de desempenho coerentes entre as Peças', () => {
    const indices = (id: string) => {
      const p = pecas.find((x) => x.id === id)
      if (p?.categoria !== 'cpu' && p?.categoria !== 'gpu') throw new Error(id)
      return p.indices
    }
    expect(indices('cpu-ryzen-7-7800x3d').jogos).toBeGreaterThan(indices('cpu-ryzen-5-5600').jogos)
    expect(indices('gpu-rtx-4070-super').jogos).toBeGreaterThan(indices('gpu-rtx-3050-6gb').jogos)
    expect(indices('cpu-core-i7-14700k').produtividade).toBeGreaterThan(
      indices('cpu-ryzen-5-7600').produtividade,
    )
    const gpuMaisFraca = Math.min(
      ...pecas.flatMap((p) => (p.categoria === 'gpu' ? [p.indices.jogos] : [])),
    )
    const integrados = pecas.flatMap((p) =>
      p.categoria === 'cpu' && p.indiceVideoIntegrado ? [p.indiceVideoIntegrado.jogos] : [],
    )
    expect(integrados.length).toBeGreaterThan(0)
    for (const jogos of integrados) expect(jogos).toBeLessThan(gpuMaisFraca)
  })

  describe('ordem dos Índices em pares de referência', () => {
    const indices = (id: string) => {
      const p = pecas.find((x) => x.id === id)
      expect(p?.categoria === 'cpu' || p?.categoria === 'gpu', id).toBe(true)
      return p?.categoria === 'cpu' || p?.categoria === 'gpu' ? p.indices : undefined
    }

    it('as Peças de referência do 100 têm Índice 100', () => {
      expect(indices('cpu-ryzen-7-9800x3d')?.jogos).toBe(100)
      expect(indices('cpu-ryzen-9-9950x')?.produtividade).toBe(100)
      expect(indices('gpu-rtx-5090')).toEqual({ jogos: 100, produtividade: 100 })
    })

    it.each([
      ['cpu-ryzen-7-9800x3d', 'cpu-ryzen-7-7800x3d', 'jogos'],
      ['cpu-ryzen-7-7800x3d', 'cpu-ryzen-7-9700x', 'jogos'],
      ['cpu-ryzen-5-7600', 'cpu-ryzen-5-5600', 'jogos'],
      ['cpu-ryzen-9-9950x', 'cpu-core-ultra-9-285k', 'produtividade'],
      ['cpu-core-ultra-9-285k', 'cpu-core-ultra-5-245k', 'produtividade'],
      ['cpu-core-i7-14700k', 'cpu-core-i5-14400f', 'produtividade'],
      ['gpu-rtx-5090', 'gpu-rtx-5080', 'jogos'],
      ['gpu-rtx-5080', 'gpu-rtx-5070-ti', 'jogos'],
      ['gpu-rx-9070-xt', 'gpu-rtx-5070', 'jogos'],
      ['gpu-rtx-5060', 'gpu-rtx-4060', 'jogos'],
      ['gpu-rx-9060-xt-16gb', 'gpu-rx-7600', 'jogos'],
      ['gpu-rtx-5090', 'gpu-rtx-4060', 'produtividade'],
    ] as const)('%s supera %s em %s', (melhor, pior, perfil) => {
      expect(indices(melhor)?.[perfil]).toBeGreaterThan(indices(pior)?.[perfil] ?? 0)
    })
  })

  it('os dados publicados têm a data de referência 2026-10 e Peças', () => {
    expect(dataReferencia).toBe('2026-10')
    expect(pecas.length).toBeGreaterThan(0)
  })
})
