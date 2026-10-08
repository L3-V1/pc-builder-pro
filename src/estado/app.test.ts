import { describe, expect, it } from 'vitest'
import type { Desafio } from '../desafios'
import { pecasDaBuild } from '../motor'
import { peca } from '../motor/teste-pecas'
import { ESTADO_INICIAL } from './build'
import type { EstadoBuild } from './build'
import { ESTADO_APP_INICIAL, estadoAtivo, reduzirApp } from './app'
import type { EstadoApp } from './app'

const desafioA: Desafio = {
  id: 'desafio-a',
  titulo: 'Desafio A',
  descricao: 'Primeiro.',
  orcamentoMaximo: 3000,
  categoriasExigidas: [],
}

const placaAm5 = peca('placa-mae-b650m-aorus-elite', 'placa-mae')
const ids = (e: EstadoBuild) => pecasDaBuild(e.build).map((p) => p.id)
const aplicar = (estado: EstadoApp, ...acoes: Parameters<typeof reduzirApp>[1][]) =>
  acoes.reduce(reduzirApp, estado)

const desafioB: Desafio = {
  ...desafioA,
  id: 'desafio-b',
  titulo: 'Desafio B',
  orcamentoMaximo: 5000,
}
const cpuAm5 = peca('cpu-ryzen-5-7600', 'cpu')

describe('reduzirApp', () => {
  it('abrir-desafio sem progresso cria Build vazia com a Meta do Desafio e não mexe na livre', () => {
    const inicial: EstadoApp = { ...ESTADO_APP_INICIAL, livre: { ...ESTADO_INICIAL, meta: 9000 } }
    const r = reduzirApp(inicial, { tipo: 'abrir-desafio', desafio: desafioA })
    expect(r.tela).toBe('desafio')
    expect(r.desafioAtivo).toBe('desafio-a')
    expect(estadoAtivo(r)).toEqual({ ...ESTADO_INICIAL, meta: 3000 })
    expect(r.livre).toBe(inicial.livre)
  })

  it('encaixar na tela do Desafio muda só a Build dele, e na tela livre só a livre', () => {
    const noDesafio = aplicar(
      ESTADO_APP_INICIAL,
      { tipo: 'abrir-desafio', desafio: desafioA },
      { tipo: 'encaixar', peca: placaAm5 },
    )
    expect(ids(noDesafio.progresso['desafio-a'])).toEqual([placaAm5.id])
    expect(noDesafio.livre).toBe(ESTADO_APP_INICIAL.livre)

    const naLivre = aplicar(ESTADO_APP_INICIAL, { tipo: 'encaixar', peca: placaAm5 })
    expect(ids(naLivre.livre)).toEqual([placaAm5.id])
    expect(naLivre.progresso).toEqual({})
  })

  it('definir-meta no Desafio não muda a Meta', () => {
    const r = aplicar(
      ESTADO_APP_INICIAL,
      { tipo: 'abrir-desafio', desafio: desafioA },
      { tipo: 'definir-meta', valor: 9999 },
    )
    expect(estadoAtivo(r).meta).toBe(3000)
  })

  it('abrir A, montar, abrir B e voltar ao A preserva Build e Bandeja do A', () => {
    const montadoA = aplicar(
      ESTADO_APP_INICIAL,
      { tipo: 'abrir-desafio', desafio: desafioA },
      { tipo: 'encaixar', peca: placaAm5 },
      { tipo: 'guardar', peca: cpuAm5 },
    )
    const r = aplicar(
      montadoA,
      { tipo: 'abrir-desafio', desafio: desafioB },
      { tipo: 'encaixar', peca: placaAm5 },
      { tipo: 'abrir-desafio', desafio: desafioA },
    )
    expect(estadoAtivo(r)).toBe(estadoAtivo(montadoA))
    expect(r.progresso['desafio-b'].meta).toBe(5000)
  })

  it('substituir (link) no Desafio altera a Build livre e volta para a tela livre', () => {
    const noDesafio = aplicar(
      ESTADO_APP_INICIAL,
      { tipo: 'abrir-desafio', desafio: desafioA },
      { tipo: 'encaixar', peca: cpuAm5 },
    )
    const r = reduzirApp(noDesafio, {
      tipo: 'substituir',
      pecas: [placaAm5],
      meta: 7000,
      desconhecidos: 0,
    })
    expect(r.tela).toBe('livre')
    expect(ids(r.livre)).toEqual([placaAm5.id])
    expect(r.livre.meta).toBe(7000)
    expect(r.progresso['desafio-a']).toBe(noDesafio.progresso['desafio-a'])
    expect(r.desafioAtivo).toBe('desafio-a')
  })

  it('concluir-desafio adiciona o ID uma vez só, mesmo repetido', () => {
    const r = aplicar(
      ESTADO_APP_INICIAL,
      { tipo: 'concluir-desafio', id: 'desafio-a' },
      { tipo: 'concluir-desafio', id: 'desafio-a' },
      { tipo: 'concluir-desafio', id: 'desafio-b' },
    )
    expect(r.concluidos).toEqual(['desafio-a', 'desafio-b'])
  })

  it('ir-para alterna entre livre e desafios sem perder o Desafio ativo nem o progresso', () => {
    const noDesafio = aplicar(
      ESTADO_APP_INICIAL,
      { tipo: 'abrir-desafio', desafio: desafioA },
      { tipo: 'encaixar', peca: placaAm5 },
    )
    const naLista = reduzirApp(noDesafio, { tipo: 'ir-para', tela: 'desafios' })
    expect(naLista).toEqual({ ...noDesafio, tela: 'desafios' })
    const naLivre = reduzirApp(naLista, { tipo: 'ir-para', tela: 'livre' })
    expect(naLivre).toEqual({ ...noDesafio, tela: 'livre' })
    expect(estadoAtivo(naLivre)).toBe(noDesafio.livre)
  })
})
