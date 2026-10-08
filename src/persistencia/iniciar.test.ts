import { describe, expect, it } from 'vitest'
import { carregarCatalogo } from '../catalogo'
import { ESTADO_INICIAL } from '../estado/build'
import { pecasDaBuild } from '../motor'
import { peca } from '../motor/teste-pecas'
import { iniciarEstado } from './iniciar'

const catalogo = carregarCatalogo()
const placaAm5 = peca('placa-mae-b650m-aorus-elite', 'placa-mae')
const cpuAm5 = peca('cpu-ryzen-5-7600', 'cpu')
const ramDdr5 = peca('ram-corsair-32gb-ddr5-6000', 'ram')
const ids = (pecas: { id: string }[]) => pecas.map((p) => p.id)

describe('iniciarEstado', () => {
  it('sem estado salvo e sem hash começa vazio', () => {
    expect(iniciarEstado({ hash: '', catalogo })).toEqual(ESTADO_INICIAL)
  })

  it('restaura Build, Bandeja e Meta com as Peças do Catálogo atual e chaves novas', () => {
    const r = iniciarEstado({
      salvo: {
        versao: 1,
        build: [cpuAm5.id, placaAm5.id],
        bandeja: [ramDdr5.id, ramDdr5.id],
        meta: 5000,
      },
      hash: '',
      catalogo,
    })
    expect(ids(pecasDaBuild(r.build))).toEqual([cpuAm5.id, placaAm5.id])
    expect(r.build.cpu).toBe(cpuAm5)
    expect(r.bandeja.map((i) => i.peca)).toEqual([ramDdr5, ramDdr5])
    expect(new Set(r.bandeja.map((i) => i.chave)).size).toBe(2)
    expect(r.meta).toBe(5000)
    expect(r.aviso).toBeUndefined()
  })

  it('com IDs salvos que sumiram do Catálogo restaura o resto e avisa', () => {
    const r = iniciarEstado({
      salvo: { versao: 1, build: [placaAm5.id, 'cpu-sumiu'], bandeja: ['ram-sumiu'] },
      hash: '',
      catalogo,
    })
    expect(ids(pecasDaBuild(r.build))).toEqual([placaAm5.id])
    expect(r.bandeja).toEqual([])
    expect(r.aviso).toMatchObject({
      tom: 'info',
      texto: '2 Peças salvas não existem mais no Catálogo.',
    })
  })

  it('um link sobre um estado salvo diferente traz Build e Meta do link e guarda a salva na Bandeja', () => {
    const placaDdr4 = peca('placa-mae-b760m-ds3h-ddr4', 'placa-mae')
    const r = iniciarEstado({
      salvo: { versao: 1, build: [placaDdr4.id], bandeja: [], meta: 3000 },
      hash: `#b=${placaAm5.id},${cpuAm5.id},cpu-sumiu&m=6000`,
      catalogo,
    })
    expect(ids(pecasDaBuild(r.build))).toEqual([cpuAm5.id, placaAm5.id])
    expect(r.meta).toBe(6000)
    expect(r.bandeja.map((i) => i.peca)).toEqual([placaDdr4])
    expect(r.aviso?.texto).toBe(
      'Build do link carregada. A Build anterior foi para a Bandeja. 1 Peça do link não existe mais no Catálogo.',
    )
  })
})
