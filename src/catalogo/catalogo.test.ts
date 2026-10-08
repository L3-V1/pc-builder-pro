import { describe, expect, it } from 'vitest'
import { carregarCatalogo } from '.'
import { CATEGORIAS } from './schema'
import { validarCatalogo } from './validar'

const { dataReferencia, pecas } = carregarCatalogo()

describe('Catálogo real', () => {
  it('passa em validarCatalogo sem erros', () => {
    const resultado = validarCatalogo({ dataReferencia, pecas })
    expect(resultado).toEqual({ ok: true, catalogo: { dataReferencia, pecas } })
  })

  it('tem de 4 a 6 peças por categoria e cerca de 40 no total', () => {
    for (const categoria of CATEGORIAS) {
      const total = pecas.filter((p) => p.categoria === categoria).length
      expect(total, categoria).toBeGreaterThanOrEqual(4)
      expect(total, categoria).toBeLessThanOrEqual(6)
    }
    expect(pecas.length).toBeGreaterThanOrEqual(36)
    expect(pecas.length).toBeLessThanOrEqual(44)
  })

  it('tem placas-mãe AM5/DDR5 e LGA1700/DDR4 com CPUs e RAM compatíveis', () => {
    const placas = pecas.filter((p) => p.categoria === 'placa-mae')
    for (const [socket, tipoRam] of [
      ['AM5', 'DDR5'],
      ['LGA1700', 'DDR4'],
    ] as const) {
      expect(
        placas.some((p) => p.socket === socket && p.tipoRam === tipoRam),
        socket,
      ).toBe(true)
      expect(
        pecas.some((p) => p.categoria === 'cpu' && p.socket === socket),
        socket,
      ).toBe(true)
      expect(
        pecas.some((p) => p.categoria === 'ram' && p.tipoRam === tipoRam),
        tipoRam,
      ).toBe(true)
    }
  })

  it('cobre os casos de borda da Fase 2', () => {
    expect(pecas.some((p) => p.categoria === 'cpu' && !p.videoIntegrado)).toBe(true)
    expect(pecas.some((p) => p.categoria === 'cpu' && !p.coolerBox)).toBe(true)
    expect(
      pecas.some((p) => p.categoria === 'gabinete' && !p.formFactorsSuportados.includes('ATX')),
    ).toBe(true)
    expect(pecas.some((p) => p.categoria === 'armazenamento' && p.interface === 'SATA')).toBe(true)
  })

  it('carregarCatalogo devolve a data de referência 2026-10 e as peças dos JSONs', () => {
    expect(dataReferencia).toBe('2026-10')
    expect(pecas.length).toBeGreaterThan(0)
  })
})
