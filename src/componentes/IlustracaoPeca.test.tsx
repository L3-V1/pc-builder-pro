// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { carregarCatalogo } from '../catalogo'
import { CATEGORIAS } from '../catalogo/schema'
import { peca } from '../motor/teste-pecas'
import { IlustracaoPeca } from './IlustracaoPeca'

const { pecas } = carregarCatalogo()
const desenhar = (p: Parameters<typeof IlustracaoPeca>[0]['peca']) =>
  render(<IlustracaoPeca peca={p} />).container.querySelector('svg')

describe('IlustracaoPeca', () => {
  it.each(CATEGORIAS)('desenha %s num SVG decorativo com data-categoria', (categoria) => {
    const p = pecas.find((x) => x.categoria === categoria)
    if (!p) throw new Error(`sem Peça de ${categoria}`)
    const svg = desenhar(p)
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveAttribute('viewBox', '0 0 100 100')
    expect(svg).toHaveAttribute('data-categoria', categoria)
    expect(svg).toHaveAttribute('data-tamanho')
  })

  it('distingue cooler a ar de water cooler e M.2 de 2.5"', () => {
    expect(desenhar(peca('cooler-deepcool-ak400', 'cooler'))).toHaveAttribute('data-forma', 'ar')
    expect(desenhar(peca('cooler-corsair-h100i-elite', 'cooler'))).toHaveAttribute(
      'data-forma',
      'water',
    )
    expect(desenhar(peca('armazenamento-nvme-1tb', 'armazenamento'))).toHaveAttribute(
      'data-forma',
      'M.2',
    )
    expect(desenhar(peca('armazenamento-sata-1tb', 'armazenamento'))).toHaveAttribute(
      'data-forma',
      '2.5',
    )
  })

  it('desenha ventoinhas com pás na GPU, na fonte e no radiador do water cooler', () => {
    const ventoinhas = (p: Parameters<typeof desenhar>[0]) =>
      desenhar(p)?.querySelectorAll('.ilustracao-peca__ventoinha').length
    expect(ventoinhas(peca('gpu-rtx-4060', 'gpu'))).toBe(2)
    expect(ventoinhas(peca('fonte-cx650', 'fonte'))).toBe(1)
    expect(ventoinhas(peca('cooler-arctic-lf3-360', 'cooler'))).toBe(3)
    const pas = desenhar(peca('gpu-rtx-4060', 'gpu'))?.querySelectorAll(
      '.ilustracao-peca__ventoinha path',
    )
    expect(pas?.length).toBeGreaterThanOrEqual(8)
  })
})
