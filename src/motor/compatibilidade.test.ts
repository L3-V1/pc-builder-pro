import { describe, expect, it } from 'vitest'
import { criarBuild, encaixar } from './build'
import { verificarEncaixe } from './compatibilidade'
import { montar, peca } from './teste-pecas'

const placaAm5 = peca('placa-mae-b650m-aorus-elite', 'placa-mae')
const placaDdr4 = peca('placa-mae-a520m-k', 'placa-mae')
const cpuAm5 = peca('cpu-ryzen-5-7600', 'cpu')
const cpuAm4 = peca('cpu-ryzen-5-5600', 'cpu')
const ramDdr4 = peca('ram-corsair-16gb-ddr4-3200', 'ram')
const ramDdr5 = peca('ram-corsair-32gb-ddr5-6000', 'ram')
const nvme = peca('armazenamento-nvme-1tb', 'armazenamento')
const sata = peca('armazenamento-sata-480gb', 'armazenamento')

describe('Bloqueantes', () => {
  it('CPU de socket diferente da placa-mãe é bloqueada com regra socket', () => {
    const b = verificarEncaixe(montar(placaAm5), cpuAm4)
    expect(b).toHaveLength(1)
    expect(b[0]).toMatchObject({ regra: 'socket', severidade: 'bloqueante' })
    expect(b[0].pecas).toEqual([cpuAm4.id, placaAm5.id])
  })

  it('CPU do mesmo socket passa', () => {
    expect(verificarEncaixe(montar(placaAm5), cpuAm5)).toEqual([])
  })

  it('RAM DDR4 em placa DDR5 é bloqueada com regra tipo-ram', () => {
    const b = verificarEncaixe(montar(placaAm5), ramDdr4)
    expect(b.map((i) => i.regra)).toEqual(['tipo-ram'])
    expect(verificarEncaixe(montar(placaAm5), ramDdr5)).toEqual([])
  })

  it('gabinete que não aceita o form factor da placa é bloqueado com form-factor', () => {
    const atx = peca('placa-mae-b650-tomahawk-wifi', 'placa-mae')
    const gabinete = peca('gabinete-kmex-matx', 'gabinete')
    const b = verificarEncaixe(montar(atx), gabinete)
    expect(b.map((i) => i.regra)).toEqual(['form-factor'])
    expect(verificarEncaixe(montar(placaAm5), gabinete)).toEqual([])
  })

  it('pentes acima de slotsDimm são bloqueados com slots-dimm; dentro do limite passa', () => {
    const placa2 = placaDdr4
    expect(verificarEncaixe(montar(placa2), ramDdr4)).toEqual([])
    const b = verificarEncaixe(montar(placa2, ramDdr4), ramDdr4)
    expect(b.map((i) => i.regra)).toEqual(['slots-dimm'])
  })

  it('M.2 acima de slotsM2 é bloqueado com slots-m2; SATA 2.5 não conta', () => {
    const cheia = montar(placaDdr4, nvme)
    expect(verificarEncaixe(cheia, nvme).map((i) => i.regra)).toEqual(['slots-m2'])
    expect(verificarEncaixe(cheia, sata)).toEqual([])
  })

  it('sem placa-mãe, CPU, RAM e M.2 entram sem bloqueio nem limite', () => {
    const b = montar(ramDdr4, ramDdr4, ramDdr4, nvme, nvme, nvme)
    expect(verificarEncaixe(b, cpuAm4)).toEqual([])
    expect(verificarEncaixe(b, ramDdr5)).toEqual([])
    expect(verificarEncaixe(b, nvme)).toEqual([])
  })

  it('encaixar bloqueado devolve ok false, IDs e mensagem em pt-BR; a Build não muda', () => {
    const build = montar(placaAm5)
    const r = encaixar(build, cpuAm4)
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.bloqueios[0].pecas).toContain(cpuAm4.id)
    expect(r.bloqueios[0].mensagem).toMatch(/socket/i)
    expect(build).toEqual(montar(placaAm5))
  })

  it('substituir CPU checa a nova contra a placa, ignorando a que sai', () => {
    const build = montar(cpuAm5, placaAm5)
    expect(verificarEncaixe(build, cpuAm4).map((i) => i.regra)).toEqual(['socket'])
    expect(verificarEncaixe(build, peca('cpu-ryzen-7-7800x3d', 'cpu'))).toEqual([])
  })

  it('placa-mãe nunca é bloqueada', () => {
    expect(verificarEncaixe(montar(cpuAm5, ramDdr5, nvme), placaDdr4)).toEqual([])
  })

  it('substituir gabinete usa a Build sem o gabinete antigo', () => {
    const atx = peca('placa-mae-b650-tomahawk-wifi', 'placa-mae')
    const build = montar(atx, peca('gabinete-nzxt-h5-flow', 'gabinete'))
    expect(verificarEncaixe(build, peca('gabinete-corsair-4000d', 'gabinete'))).toEqual([])
  })

  it('sem CPU e sem gabinete nada a comparar para a placa', () => {
    expect(verificarEncaixe(criarBuild(), placaAm5)).toEqual([])
  })
})
