import { criarBuild } from './build'
import { describe, expect, it } from 'vitest'
import { calcularOrcamento } from './orcamento'
import { montar, peca } from './teste-pecas'

describe('calcularOrcamento', () => {
  it('Build vazia custa {0, 0, 0}', () => {
    expect(calcularOrcamento(criarBuild())).toEqual({ min: 0, medio: 0, max: 0 })
  })

  it('soma mín, médio e máx de todas as Peças, contando kits repetidos duas vezes', () => {
    const cpu = peca('cpu-ryzen-5-5600', 'cpu')
    const ram = peca('ram-corsair-16gb-ddr4-3200', 'ram')
    const build = montar(cpu, ram, ram)
    const { faixaPreco: c } = cpu
    const { faixaPreco: r } = ram
    expect(calcularOrcamento(build)).toEqual({
      min: c.min + 2 * r.min,
      medio: c.medio + 2 * r.medio,
      max: c.max + 2 * r.max,
    })
  })
})
