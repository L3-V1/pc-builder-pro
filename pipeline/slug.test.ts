import { describe, expect, it } from 'vitest'
import { resolverColisoes, slugPeca } from './slug'

describe('slugPeca', () => {
  it('gera categoria-marca-modelo sem acentos nem símbolos', () => {
    expect(slugPeca('cpu', 'AMD', 'Ryzen 5 5600')).toBe('cpu-amd-ryzen-5-5600')
    expect(slugPeca('gabinete', 'Pichau', 'Ventus Ê (Vidro)™ +')).toBe(
      'gabinete-pichau-ventus-e-vidro',
    )
  })

  it('não repete a marca quando o nome já começa com ela', () => {
    expect(slugPeca('gpu', 'ASUS', 'ASUS Dual RTX 4060')).toBe('gpu-asus-dual-rtx-4060')
    expect(slugPeca('cooler', 'Cooler Master', 'cooler master Hyper 212')).toBe(
      'cooler-cooler-master-hyper-212',
    )
    expect(slugPeca('ram', 'G.Skill', 'Trident Z5')).toBe('ram-g-skill-trident-z5')
  })
})

describe('resolverColisoes', () => {
  it('sufixa com o início do opendb_id todas as Peças que colidem, de forma estável', () => {
    const entrada = [
      { id: 'gpu-asus-dual-rtx-4060', opendbId: 'aaaaaaaa-1111-2222-3333-444444444444' },
      { id: 'cpu-amd-ryzen-5-5600', opendbId: 'cccccccc-1111-2222-3333-444444444444' },
      { id: 'gpu-asus-dual-rtx-4060', opendbId: 'BBBBBBBB-1111-2222-3333-444444444444' },
    ]
    const esperado = [
      { id: 'gpu-asus-dual-rtx-4060-aaaaaaaa', opendbId: entrada[0].opendbId },
      { id: 'cpu-amd-ryzen-5-5600', opendbId: entrada[1].opendbId },
      { id: 'gpu-asus-dual-rtx-4060-bbbbbbbb', opendbId: entrada[2].opendbId },
    ]
    expect(resolverColisoes(entrada)).toEqual(esperado)
    expect(resolverColisoes([...entrada].reverse())).toEqual([...esperado].reverse())
  })
})
