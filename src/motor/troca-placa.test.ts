import { describe, expect, it } from 'vitest'
import { encaixar } from './build'
import { pecasIncompativeisComPlaca, verificarEncaixe } from './compatibilidade'
import { montar, peca } from './teste-pecas'

const placaAm5 = peca('placa-mae-b650m-aorus-elite', 'placa-mae')
const placaLga = peca('placa-mae-b760m-ds3h-ddr4', 'placa-mae')
const cpu = peca('cpu-ryzen-5-7600', 'cpu')
const ramDdr5 = peca('ram-corsair-32gb-ddr5-6000', 'ram')
const ramDdr4 = peca('ram-corsair-16gb-ddr4-3200', 'ram')
const nvme = peca('armazenamento-nvme-1tb', 'armazenamento')
const nvme2 = peca('armazenamento-nvme-2tb', 'armazenamento')

describe('pecasIncompativeisComPlaca', () => {
  it('lista CPU de outro socket, RAM de outro tipo e gabinete incompatível', () => {
    const atx = peca('placa-mae-b650-tomahawk-wifi', 'placa-mae')
    const gabinete = peca('gabinete-nzxt-h5-flow', 'gabinete')
    const build = montar(cpu, ramDdr5, gabinete, atx)
    const miniItx = peca('placa-mae-b650i-aorus-ultra', 'placa-mae')
    expect(pecasIncompativeisComPlaca(build, placaLga)).toEqual([cpu, ramDdr5])
    expect(pecasIncompativeisComPlaca(build, miniItx)).toEqual([])
    const kmex = peca('gabinete-kmex-matx', 'gabinete')
    expect(pecasIncompativeisComPlaca(montar(kmex), atx)).toEqual([kmex])
  })

  it('lista pentes e M.2 excedentes, mantendo os encaixados primeiro', () => {
    const ram2 = peca('ram-kingston-32gb-ddr4-3200', 'ram')
    const build = montar(ramDdr4, ram2, nvme, nvme2)
    const sata = peca('armazenamento-sata-480gb', 'armazenamento')
    const placaUmM2 = peca('placa-mae-a520m-k', 'placa-mae')
    expect(pecasIncompativeisComPlaca(build, placaUmM2)).toEqual([ram2, nvme2])
    expect(pecasIncompativeisComPlaca(montar(sata, nvme), placaUmM2)).toEqual([])
  })
})

describe('encaixar placa-mãe', () => {
  it('troca AM5/DDR5 por LGA1700/DDR4: CPU, RAM e placa antiga saem; o resto fica', () => {
    const gabinete = peca('gabinete-kmex-matx', 'gabinete')
    const fonte = peca('fonte-cx650', 'fonte')
    const gpu = peca('gpu-rtx-4060', 'gpu')
    const build = montar(cpu, placaAm5, ramDdr5, nvme, gabinete, fonte, gpu)
    const r = encaixar(build, placaLga)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.removidas).toEqual([placaAm5, cpu, ramDdr5])
    expect(r.build).toEqual(montar(nvme, gabinete, fonte, gpu, placaLga))
  })

  it('primeira placa encaixada numa Build com Peças incompatíveis também desloca', () => {
    const r = encaixar(montar(cpu, ramDdr5), placaLga)
    expect(r).toMatchObject({ ok: true, removidas: [cpu, ramDdr5] })
  })

  it('verificarEncaixe de placa-mãe devolve sempre []', () => {
    expect(verificarEncaixe(montar(cpu, ramDdr5, nvme), placaLga)).toEqual([])
  })
})
