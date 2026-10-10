import { describe, expect, it } from 'vitest'
import { catalogoFixture } from '../teste/catalogo'
import { pecasDaBuild } from '../motor'
import { peca } from '../motor/teste-pecas'
import { remontarBuild, resolverIds } from './remontar'

const { pecas: catalogo } = catalogoFixture
const placaAm5 = peca('placa-mae-b650m-aorus-elite', 'placa-mae')
const ramDdr5 = peca('ram-corsair-32gb-ddr5-6000', 'ram')
const cpuAm5 = peca('cpu-ryzen-5-7600', 'cpu')
const ids = (r: ReturnType<typeof remontarBuild>) => pecasDaBuild(r.build).map((p) => p.id)

describe('resolverIds', () => {
  it('separa conhecidos de desconhecidos e preserva repetições', () => {
    const r = resolverIds([placaAm5.id, 'cpu-sumiu', ramDdr5.id, ramDdr5.id], catalogo)
    expect(r.pecas).toEqual([placaAm5, ramDdr5, ramDdr5])
    expect(r.desconhecidos).toEqual(['cpu-sumiu'])
  })
})

describe('remontarBuild', () => {
  it('encaixa a placa-mãe antes, mesmo vindo por último', () => {
    const r = remontarBuild([cpuAm5, ramDdr5, placaAm5])
    expect(ids(r)).toEqual([cpuAm5.id, placaAm5.id, ramDdr5.id])
    expect(r.recusadas).toEqual([])
  })

  it('CPU LGA1700 com placa AM5 vai para recusadas', () => {
    const intel = peca('cpu-core-i5-12400', 'cpu')
    const r = remontarBuild([placaAm5, intel])
    expect(ids(r)).toEqual([placaAm5.id])
    expect(r.recusadas).toEqual([intel])
  })

  it('sem placa-mãe a CPU vai para recusadas, mas gabinete e fonte entram', () => {
    const fonte = peca('fonte-cx650', 'fonte')
    const gabinete = peca('gabinete-nzxt-h5-flow', 'gabinete')
    const r = remontarBuild([cpuAm5, fonte, gabinete])
    expect(ids(r)).toEqual([fonte.id, gabinete.id])
    expect(r.recusadas).toEqual([cpuAm5])
  })

  it('três kits de 2 módulos numa placa com 4 DIMMs: dois entram e um vai para recusadas', () => {
    const r = remontarBuild([ramDdr5, ramDdr5, ramDdr5, placaAm5])
    expect(r.build.ram).toEqual([ramDdr5, ramDdr5])
    expect(r.recusadas).toEqual([ramDdr5])
  })

  it('com duas CPUs na lista a última fica e a outra vai para recusadas', () => {
    const outra = peca('cpu-ryzen-7-7800x3d', 'cpu')
    const r = remontarBuild([placaAm5, cpuAm5, outra])
    expect(r.build.cpu).toEqual(outra)
    expect(r.recusadas).toEqual([cpuAm5])
  })
})
