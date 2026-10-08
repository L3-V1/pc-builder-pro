import { describe, expect, it } from 'vitest'
import { peca } from '../motor/teste-pecas'
import { ROTULOS_CATEGORIA, specsPrincipais } from './specs'

describe('specsPrincipais', () => {
  it('CPU traz socket, núcleos/threads, vídeo integrado e cooler box quando houver', () => {
    expect(specsPrincipais(peca('cpu-ryzen-5-7600', 'cpu'))).toEqual([
      'AM5',
      '6 núcleos / 12 threads',
      'Vídeo integrado',
      'Cooler box',
    ])
    expect(specsPrincipais(peca('cpu-ryzen-5-5600', 'cpu'))).toEqual([
      'AM4',
      '6 núcleos / 12 threads',
      'Cooler box',
    ])
    expect(specsPrincipais(peca('cpu-ryzen-7-7800x3d', 'cpu'))).toEqual([
      'AM5',
      '8 núcleos / 16 threads',
      'Vídeo integrado',
    ])
  })

  it('demais Categorias trazem suas specs principais', () => {
    expect(specsPrincipais(peca('placa-mae-b650m-aorus-elite', 'placa-mae'))).toEqual([
      'AM5',
      'DDR5',
      'Micro-ATX',
    ])
    expect(specsPrincipais(peca('ram-corsair-32gb-ddr5-6000', 'ram'))).toEqual([
      '32 GB',
      'DDR5',
      '2 pentes',
      '6000 MHz',
    ])
    expect(specsPrincipais(peca('gpu-rtx-4060', 'gpu'))).toEqual(['8 GB VRAM', '115 W'])
    expect(specsPrincipais(peca('fonte-cx650', 'fonte'))).toEqual(['650 W', 'Bronze'])
    expect(specsPrincipais(peca('gabinete-nzxt-h5-flow', 'gabinete'))).toEqual([
      'ATX',
      'Micro-ATX',
      'Mini-ITX',
    ])
    expect(specsPrincipais(peca('armazenamento-nvme-1tb', 'armazenamento'))).toEqual([
      '1000 GB',
      'M.2',
      'NVMe',
    ])
    expect(specsPrincipais(peca('cooler-deepcool-ak400', 'cooler'))).toEqual(['Ar'])
    expect(specsPrincipais(peca('cooler-corsair-h100i-elite', 'cooler'))).toEqual(['Water cooler'])
  })

  it('rótulos de Categoria em pt-BR', () => {
    expect(ROTULOS_CATEGORIA['placa-mae']).toBe('Placa-mãe')
    expect(ROTULOS_CATEGORIA.cpu).toBe('CPU')
  })
})
