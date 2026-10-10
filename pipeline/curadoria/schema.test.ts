import { describe, expect, it } from 'vitest'
import { IndicesCpu, IndicesGpu, ParesLegado } from './schema'

describe('curadoria', () => {
  it('aceita Índices de CPU, com ou sem vídeo integrado, e de GPU com fonte recomendada', () => {
    expect(
      IndicesCpu.safeParse({
        'ryzen-5-5600': { jogos: 62, produtividade: 26 },
        'ryzen-5-7600': {
          jogos: 76,
          produtividade: 36,
          indiceVideoIntegrado: { jogos: 2, produtividade: 2 },
        },
      }).success,
    ).toBe(true)
    expect(
      IndicesGpu.safeParse({
        'GeForce RTX 4060': { jogos: 60, produtividade: 40, fonteRecomendadaW: 550 },
      }).success,
    ).toBe(true)
  })

  it.each([-1, 101, 50.5])('rejeita Índice %s, fora de 0–100 inteiro', (jogos) => {
    expect(IndicesCpu.safeParse({ x: { jogos, produtividade: 10 } }).success).toBe(false)
    expect(
      IndicesGpu.safeParse({ x: { jogos, produtividade: 10, fonteRecomendadaW: 500 } }).success,
    ).toBe(false)
  })

  it('rejeita par com opendb_id repetido e ID antigo repetido', () => {
    const par = (idAntigo: string, opendbId: string) => ({ idAntigo, opendbId })
    expect(ParesLegado.safeParse([par('cpu-a', 'x1'), par('cpu-b', 'x2')]).success).toBe(true)
    const repetido = ParesLegado.safeParse([par('cpu-a', 'x1'), par('cpu-b', 'x1')])
    expect(repetido.success).toBe(false)
    expect(repetido.error?.issues[0].message).toBe('opendb_id repetido: "x1"')
    expect(ParesLegado.safeParse([par('cpu-a', 'x1'), par('cpu-a', 'x2')]).success).toBe(false)
  })
})
