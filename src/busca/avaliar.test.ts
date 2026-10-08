import { describe, expect, it } from 'vitest'
import { criarBuild } from '../motor'
import { montar, peca } from '../motor/teste-pecas'
import { avaliarPeca } from './avaliar'

const placaAm5 = peca('placa-mae-b650m-aorus-elite', 'placa-mae')
const cpuAm5 = peca('cpu-ryzen-5-7600', 'cpu')
const ramDdr5 = peca('ram-corsair-32gb-ddr5-6000', 'ram')

describe('avaliarPeca', () => {
  it('Build vazia: qualquer Peça é livre, sem substituição nem deslocamento', () => {
    expect(avaliarPeca(criarBuild(), cpuAm5)).toEqual({ tipo: 'livre', desloca: [] })
    expect(avaliarPeca(criarBuild(), placaAm5)).toEqual({ tipo: 'livre', desloca: [] })
  })

  it('CPU de socket diferente da placa é bloqueada com o bloqueio de socket', () => {
    const r = avaliarPeca(montar(placaAm5), peca('cpu-core-i5-12400', 'cpu'))
    expect(r.tipo).toBe('bloqueada')
    if (r.tipo === 'bloqueada') expect(r.bloqueios.map((b) => b.regra)).toEqual(['socket'])
  })

  it('CPU de mesmo socket com outra CPU encaixada substitui a atual', () => {
    const r = avaliarPeca(montar(placaAm5, cpuAm5), peca('cpu-ryzen-7-7800x3d', 'cpu'))
    expect(r).toEqual({ tipo: 'livre', substitui: cpuAm5, desloca: [] })
  })

  it('mesma CPU já encaixada é na-build; o mesmo kit de RAM continua livre', () => {
    const build = montar(placaAm5, cpuAm5, ramDdr5)
    expect(avaliarPeca(build, cpuAm5)).toEqual({ tipo: 'na-build' })
    expect(avaliarPeca(build, ramDdr5)).toEqual({ tipo: 'livre', desloca: [] })
  })

  it('placa LGA1700/DDR4 numa Build AM5/DDR5 desloca CPU e RAM e substitui a placa', () => {
    const build = montar(placaAm5, cpuAm5, ramDdr5)
    const r = avaliarPeca(build, peca('placa-mae-b760m-ds3h-ddr4', 'placa-mae'))
    expect(r).toEqual({ tipo: 'livre', substitui: placaAm5, desloca: [cpuAm5, ramDdr5] })
  })

  it('placa compatível com tudo é livre com desloca vazio', () => {
    const build = montar(placaAm5, cpuAm5, ramDdr5)
    const r = avaliarPeca(build, peca('placa-mae-b650-tomahawk-wifi', 'placa-mae'))
    expect(r).toEqual({ tipo: 'livre', substitui: placaAm5, desloca: [] })
  })
})
