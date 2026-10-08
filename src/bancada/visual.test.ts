import { describe, expect, it } from 'vitest'
import { peca } from '../motor/teste-pecas'
import { PALETA, variacaoVisual } from './visual'

describe('variacaoVisual', () => {
  it('a mesma marca sempre gera a mesma cor, e a cor está na paleta', () => {
    const a = variacaoVisual(peca('fonte-cx650', 'fonte'))
    const b = variacaoVisual(peca('ram-corsair-32gb-ddr5-6000', 'ram'))
    expect(a.cor).toBe(b.cor)
    expect(PALETA).toContain(a.cor)
  })

  it('placa ATX é g, Micro-ATX m e Mini-ITX p', () => {
    const tamanho = (id: string) => variacaoVisual(peca(id, 'placa-mae')).tamanho
    expect(tamanho('placa-mae-b650-tomahawk-wifi')).toBe('g')
    expect(tamanho('placa-mae-b650m-aorus-elite')).toBe('m')
    expect(tamanho('placa-mae-b650i-aorus-ultra')).toBe('p')
  })

  it('GPU com 115 W é p e com 263 W é g', () => {
    expect(variacaoVisual(peca('gpu-rtx-4060', 'gpu')).tamanho).toBe('p')
    expect(variacaoVisual(peca('gpu-rx-7800-xt', 'gpu')).tamanho).toBe('g')
  })

  it('fonte e gabinete variam de tamanho pela potência e pelo maior form factor', () => {
    expect(variacaoVisual(peca('fonte-mwe-450', 'fonte')).tamanho).toBe('p')
    expect(variacaoVisual(peca('fonte-rm850x', 'fonte')).tamanho).toBe('g')
    expect(variacaoVisual(peca('gabinete-nzxt-h5-flow', 'gabinete')).tamanho).toBe('g')
    expect(variacaoVisual(peca('gabinete-lian-li-a4-h2o', 'gabinete')).tamanho).toBe('p')
  })

  it('cooler tem forma ar ou water, e armazenamento M.2 ou 2.5', () => {
    expect(variacaoVisual(peca('cooler-deepcool-ak400', 'cooler')).forma).toBe('ar')
    expect(variacaoVisual(peca('cooler-arctic-lf3-360', 'cooler')).forma).toBe('water')
    expect(variacaoVisual(peca('armazenamento-nvme-1tb', 'armazenamento')).forma).toBe('M.2')
    expect(variacaoVisual(peca('armazenamento-sata-1tb', 'armazenamento')).forma).toBe('2.5')
  })
})
