import { criarBuild } from './build'
import { describe, expect, it } from 'vitest'
import { calcularChecklist } from './checklist'
import { montar, peca } from './teste-pecas'

const TODAS = ['cpu', 'placa-mae', 'ram', 'gpu', 'armazenamento', 'fonte', 'gabinete', 'cooler']

describe('calcularChecklist', () => {
  it('Build vazia lista todas as Categorias e não está completa', () => {
    expect(calcularChecklist(criarBuild())).toEqual({ faltando: TODAS, completa: false })
  })

  it('CPU com vídeo integrado tira a GPU; com cooler box tira o cooler', () => {
    const { faltando } = calcularChecklist(montar(peca('cpu-ryzen-5-7600', 'cpu')))
    expect(faltando).toEqual(['placa-mae', 'ram', 'armazenamento', 'fonte', 'gabinete'])
  })

  it('CPU sem vídeo integrado e sem cooler box mantém GPU e cooler', () => {
    const sem = calcularChecklist(montar(peca('cpu-ryzen-5-5600', 'cpu'))).faltando
    expect(sem).toContain('gpu')
    expect(sem).not.toContain('cooler')
    const x3d = calcularChecklist(montar(peca('cpu-ryzen-7-7800x3d', 'cpu'))).faltando
    expect(x3d).toContain('cooler')
    expect(x3d).not.toContain('gpu')
  })

  it('Build completa e compatível tem faltando vazio e completa true', () => {
    const build = montar(
      peca('cpu-ryzen-5-7600', 'cpu'),
      peca('placa-mae-b650m-aorus-elite', 'placa-mae'),
      peca('ram-corsair-32gb-ddr5-6000', 'ram'),
      peca('armazenamento-nvme-1tb', 'armazenamento'),
      peca('fonte-cx650', 'fonte'),
      peca('gabinete-kmex-matx', 'gabinete'),
    )
    expect(calcularChecklist(build)).toEqual({ faltando: [], completa: true })
  })
})
