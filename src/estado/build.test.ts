import { describe, expect, it } from 'vitest'
import type { Peca } from '../catalogo'
import { pecasDaBuild } from '../motor'
import { montar, peca } from '../motor/teste-pecas'
import { ESTADO_INICIAL, reduzirBuild, subtotalBandeja } from './build'
import type { EstadoBuild } from './build'

const placaAm5 = peca('placa-mae-b650m-aorus-elite', 'placa-mae')
const cpuAm5 = peca('cpu-ryzen-5-7600', 'cpu')
const ramDdr5 = peca('ram-corsair-32gb-ddr5-6000', 'ram')
const placaDdr4 = peca('placa-mae-b760m-ds3h-ddr4', 'placa-mae')

const estadoCom = (...pecas: Parameters<typeof montar>): EstadoBuild => ({
  ...ESTADO_INICIAL,
  build: montar(...pecas),
})
const ids = (e: EstadoBuild) => pecasDaBuild(e.build).map((p) => p.id)

const comBandeja = (estado: EstadoBuild, ...pecas: Peca[]) =>
  pecas.reduce((e, p) => reduzirBuild(e, { tipo: 'guardar', peca: p }), estado)

describe('reduzirBuild', () => {
  it('encaixar a mesma Peça que já está na Build não muda nada', () => {
    const estado = estadoCom(placaAm5, cpuAm5)
    expect(reduzirBuild(estado, { tipo: 'encaixar', peca: cpuAm5 })).toBe(estado)
  })

  it('desencaixar a placa-mãe leva junto as dependentes e deixa gabinete e fonte', () => {
    const gabinete = peca('gabinete-nzxt-h5-flow', 'gabinete')
    const fonte = peca('fonte-cx650', 'fonte')
    const cooler = peca('cooler-deepcool-ak400', 'cooler')
    const gpu = peca('gpu-rtx-4060', 'gpu')
    const ssd = peca('armazenamento-nvme-1tb', 'armazenamento')
    const estado = estadoCom(placaAm5, cpuAm5, cooler, ramDdr5, gpu, ssd, gabinete, fonte)
    const r = reduzirBuild(estado, { tipo: 'desencaixar', pecaId: placaAm5.id })
    expect(ids(r)).toEqual([fonte.id, gabinete.id])
    expect(r.bandeja.map((i) => i.peca.id).sort()).toEqual(
      [placaAm5, cpuAm5, cooler, ramDdr5, gpu, ssd].map((p) => p.id).sort(),
    )
  })

  it('desencaixar manda a Peça para a Bandeja', () => {
    const r = reduzirBuild(estadoCom(placaAm5, cpuAm5), { tipo: 'desencaixar', pecaId: cpuAm5.id })
    expect(ids(r)).toEqual([placaAm5.id])
    expect(r.bandeja.map((i) => i.peca)).toEqual([cpuAm5])
  })

  it('trocar AM5/DDR5 por LGA1700/DDR4 aplica na hora e manda placa, CPU e RAM para a Bandeja', () => {
    const r = reduzirBuild(estadoCom(placaAm5, cpuAm5, ramDdr5), {
      tipo: 'encaixar',
      peca: placaDdr4,
    })
    expect(ids(r)).toEqual([placaDdr4.id])
    expect(r.bandeja.map((i) => i.peca)).toEqual([placaAm5, cpuAm5, ramDdr5])
    expect(r.aviso).toMatchObject({
      tom: 'info',
      texto: `${placaDdr4.nome} encaixada na Build. 3 Peças foram para a Bandeja.`,
    })
  })

  it('substituir a CPU manda a CPU antiga para a Bandeja', () => {
    const nova = peca('cpu-ryzen-7-7800x3d', 'cpu')
    const r = reduzirBuild(estadoCom(placaAm5, cpuAm5), { tipo: 'encaixar', peca: nova })
    expect(ids(r)).toEqual([nova.id, placaAm5.id])
    expect(r.bandeja.map((i) => i.peca)).toEqual([cpuAm5])
  })

  it('encaixar daBandeja tira o item da Bandeja', () => {
    const estado = comBandeja(estadoCom(placaAm5), ramDdr5, cpuAm5)
    const [ram, cpu] = estado.bandeja
    const r = reduzirBuild(estado, { tipo: 'encaixar', peca: cpuAm5, daBandeja: cpu.chave })
    expect(ids(r)).toContain(cpuAm5.id)
    expect(r.bandeja).toEqual([ram])
  })

  it('encaixar Peça bloqueada não muda Build nem Bandeja e avisa com a mensagem do motor', () => {
    const estado = estadoCom(placaAm5)
    const r = reduzirBuild(estado, { tipo: 'encaixar', peca: peca('cpu-core-i5-12400', 'cpu') })
    expect(r.build).toBe(estado.build)
    expect(r.bandeja).toBe(estado.bandeja)
    expect(r.aviso).toMatchObject({ tom: 'erro', texto: expect.stringMatching(/socket/) })
  })

  it('encaixar daBandeja sem placa-mãe só avisa e não duplica o item', () => {
    const estado = comBandeja(ESTADO_INICIAL, cpuAm5)
    const chave = estado.bandeja[0].chave
    const r = reduzirBuild(estado, { tipo: 'encaixar', peca: cpuAm5, daBandeja: chave })
    expect(r.bandeja).toEqual(estado.bandeja)
    expect(r.aviso?.texto).toBe('Encaixe uma placa-mãe primeiro')
  })

  it('encaixar CPU sem placa-mãe a manda para a Bandeja com aviso', () => {
    const r = reduzirBuild(ESTADO_INICIAL, { tipo: 'encaixar', peca: cpuAm5 })
    expect(ids(r)).toEqual([])
    expect(r.bandeja.map((i) => i.peca)).toEqual([cpuAm5])
    expect(r.aviso).toMatchObject({ texto: 'Encaixe uma placa-mãe primeiro', tom: 'info' })
  })

  it('encaixar com sucesso avisa que a Peça foi encaixada na Build', () => {
    const r = reduzirBuild(estadoCom(placaAm5), { tipo: 'encaixar', peca: cpuAm5 })
    expect(r.aviso).toMatchObject({ tom: 'info', texto: 'Ryzen 5 7600 encaixada na Build' })
  })

  it('encaixar Peça livre a coloca na Build sem mexer na Bandeja', () => {
    const estado = comBandeja(estadoCom(placaAm5), ramDdr5)
    const r = reduzirBuild(estado, { tipo: 'encaixar', peca: cpuAm5 })
    expect(ids(r)).toEqual([cpuAm5.id, placaAm5.id])
    expect(r.bandeja).toBe(estado.bandeja)
  })

  it('descartar remove só o item daquela chave', () => {
    const cheia = [ramDdr5, ramDdr5, cpuAm5].reduce(
      (e, p) => reduzirBuild(e, { tipo: 'guardar', peca: p }),
      ESTADO_INICIAL,
    )
    const [, segunda] = cheia.bandeja
    const r = reduzirBuild(cheia, { tipo: 'descartar', chave: segunda.chave })
    expect(r.bandeja).toEqual([cheia.bandeja[0], cheia.bandeja[2]])
  })

  it('guardar adiciona à Bandeja com chave nova e aceita Peças repetidas', () => {
    const uma = reduzirBuild(ESTADO_INICIAL, { tipo: 'guardar', peca: ramDdr5 })
    const duas = reduzirBuild(uma, { tipo: 'guardar', peca: ramDdr5 })
    expect(duas.bandeja.map((i) => i.peca)).toEqual([ramDdr5, ramDdr5])
    expect(new Set(duas.bandeja.map((i) => i.chave)).size).toBe(2)
    expect(duas.build).toBe(ESTADO_INICIAL.build)
  })
})

describe('subtotalBandeja', () => {
  it('soma os preços médios e é 0 para Bandeja vazia', () => {
    expect(subtotalBandeja([])).toBe(0)
    const bandeja = comBandeja(ESTADO_INICIAL, ramDdr5, ramDdr5, cpuAm5).bandeja
    expect(subtotalBandeja(bandeja)).toBe(2 * ramDdr5.faixaPreco.medio + cpuAm5.faixaPreco.medio)
  })
})

describe('avisar', () => {
  it('troca o aviso e incrementa o id para o leitor de tela repetir a mensagem', () => {
    const um = reduzirBuild(ESTADO_INICIAL, { tipo: 'avisar', texto: 'Link copiado', tom: 'info' })
    const dois = reduzirBuild(um, { tipo: 'avisar', texto: 'Link copiado', tom: 'info' })
    expect(um.aviso).toEqual({ id: 1, texto: 'Link copiado', tom: 'info' })
    expect(dois.aviso?.id).toBe(2)
    expect(dois.build).toBe(ESTADO_INICIAL.build)
  })
})

describe('meta', () => {
  it('definir-meta grava e remove a Meta sem mexer na Build', () => {
    const estado = estadoCom(placaAm5, cpuAm5)
    const comMeta = reduzirBuild(estado, { tipo: 'definir-meta', valor: 5000 })
    expect(comMeta.meta).toBe(5000)
    expect(comMeta.build).toBe(estado.build)
    const semMeta = reduzirBuild(comMeta, { tipo: 'definir-meta' })
    expect(semMeta.meta).toBeUndefined()
    expect(semMeta.build).toBe(estado.build)
  })
})

describe('substituir', () => {
  it('com a Build vazia monta a Build do link, define a Meta e não mexe na Bandeja', () => {
    const estado = comBandeja(ESTADO_INICIAL, ramDdr5)
    const r = reduzirBuild(estado, {
      tipo: 'substituir',
      pecas: [cpuAm5, placaAm5],
      meta: 6000,
      desconhecidos: 0,
    })
    expect(ids(r)).toEqual([cpuAm5.id, placaAm5.id])
    expect(r.meta).toBe(6000)
    expect(r.bandeja).toEqual(estado.bandeja)
    expect(r.aviso).toMatchObject({ tom: 'info', texto: 'Build do link carregada.' })
  })

  it('com Build diferente manda as Peças antigas para a Bandeja e avisa', () => {
    const estado = comBandeja(estadoCom(placaDdr4), ramDdr5)
    const r = reduzirBuild(estado, {
      tipo: 'substituir',
      pecas: [placaAm5, cpuAm5],
      desconhecidos: 0,
    })
    expect(ids(r)).toEqual([cpuAm5.id, placaAm5.id])
    expect(r.bandeja.map((i) => i.peca)).toEqual([ramDdr5, placaDdr4])
    expect(r.aviso?.texto).toBe('Build do link carregada. A Build anterior foi para a Bandeja.')
  })

  it('com a mesma Build não duplica as Peças na Bandeja', () => {
    const estado = estadoCom(placaAm5, cpuAm5, ramDdr5)
    const r = reduzirBuild(estado, {
      tipo: 'substituir',
      pecas: [ramDdr5, cpuAm5, placaAm5],
      desconhecidos: 0,
    })
    expect(ids(r)).toEqual(ids(estado))
    expect(r.bandeja).toEqual([])
    expect(r.aviso?.texto).toBe('Build do link carregada.')
  })

  it.each([
    [1, 'Build do link carregada. 1 Peça do link não existe mais no Catálogo.'],
    [2, 'Build do link carregada. 2 Peças do link não existem mais no Catálogo.'],
  ])('com %i desconhecidos avisa quantas Peças sumiram', (desconhecidos, texto) => {
    const r = reduzirBuild(ESTADO_INICIAL, { tipo: 'substituir', pecas: [placaAm5], desconhecidos })
    expect(r.aviso?.texto).toBe(texto)
  })

  it('com uma Peça bloqueada a manda para a Bandeja e avisa', () => {
    const intel = peca('cpu-core-i5-12400', 'cpu')
    const r = reduzirBuild(ESTADO_INICIAL, {
      tipo: 'substituir',
      pecas: [placaAm5, intel],
      desconhecidos: 0,
    })
    expect(ids(r)).toEqual([placaAm5.id])
    expect(r.bandeja.map((i) => i.peca)).toEqual([intel])
    expect(r.aviso?.texto).toBe('Build do link carregada. 1 Peça foi para a Bandeja.')
  })

  it('sem meta mantém a Meta atual', () => {
    const estado = { ...ESTADO_INICIAL, meta: 4500 }
    const r = reduzirBuild(estado, { tipo: 'substituir', pecas: [placaAm5], desconhecidos: 0 })
    expect(r.meta).toBe(4500)
  })
})
