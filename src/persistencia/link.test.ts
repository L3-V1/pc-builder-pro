import { describe, expect, it } from 'vitest'
import { codificarLink, decodificarLink } from './link'

describe('link', () => {
  it('ida e volta preserva IDs, ordem, quantidade e Meta', () => {
    const ids = ['placa-mae-b650m-aorus-elite', 'cpu-ryzen-5-7600', 'gpu-rtx-4060']
    expect(decodificarLink(codificarLink(ids, 5000))).toEqual({ ids, meta: 5000, invalidos: 0 })
  })

  it('agrupa IDs repetidos em id*n e decodifica id*2 em dois IDs', () => {
    const ram = 'ram-corsair-32gb-ddr5-6000'
    expect(codificarLink(['placa-mae-a520m-k', ram, ram])).toBe(`b=placa-mae-a520m-k,${ram}*2`)
    expect(decodificarLink(`b=${ram}*2`)?.ids).toEqual([ram, ram])
  })

  it('sem Meta não tem m, e só com Meta tem m sem b', () => {
    expect(codificarLink(['gpu-rtx-4060'])).toBe('b=gpu-rtx-4060')
    expect(codificarLink([], 3000)).toBe('m=3000')
    expect(decodificarLink('b=gpu-rtx-4060')).toEqual({ ids: ['gpu-rtx-4060'], invalidos: 0 })
    expect(decodificarLink('m=3000')).toEqual({ ids: [], meta: 3000, invalidos: 0 })
  })

  it('aceita o hash com ou sem #', () => {
    expect(decodificarLink('#b=gpu-rtx-4060&m=3000')).toEqual(
      decodificarLink('b=gpu-rtx-4060&m=3000'),
    )
  })

  it('ignora tokens malformados e os conta em invalidos', () => {
    const hash =
      'b=gpu-rtx-4060,fonte-cx650*0,fonte-cx650*x,fonte-cx650*99,,GPU-RTX,gpu_rtx,fonte-cx650*2'
    expect(decodificarLink(hash)).toEqual({
      ids: ['gpu-rtx-4060', 'fonte-cx650', 'fonte-cx650'],
      invalidos: 6,
    })
  })

  it.each(['-5', '0', '10.5', 'abc', '1000001', ''])('ignora m=%s', (m) => {
    expect(decodificarLink(`b=gpu-rtx-4060&m=${m}`)).toEqual({
      ids: ['gpu-rtx-4060'],
      invalidos: 0,
    })
  })

  it('aceita m=1000000', () => {
    expect(decodificarLink('m=1000000')?.meta).toBe(1_000_000)
  })

  it.each(['', '#', '#sobre', 'm=abc', 'b='])('hash "%s" não é link', (hash) => {
    expect(decodificarLink(hash)).toBeUndefined()
  })

  it('ignora parâmetros desconhecidos', () => {
    expect(decodificarLink('#x=1&b=gpu-rtx-4060&utm=abc&m=3000')).toEqual({
      ids: ['gpu-rtx-4060'],
      meta: 3000,
      invalidos: 0,
    })
  })
})
