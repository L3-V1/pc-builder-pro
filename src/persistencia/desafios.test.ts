import { describe, expect, it } from 'vitest'
import type { Desafio } from '../desafios'
import { ESTADO_APP_INICIAL, reduzirApp } from '../estado/app'
import type { AcaoApp, EstadoApp } from '../estado/app'
import { peca } from '../motor/teste-pecas'
import { CHAVE_DESAFIOS, lerDesafiosSalvos, salvarDesafios } from './desafios'

const placaAm5 = peca('placa-mae-b650m-aorus-elite', 'placa-mae')
const cpuAm5 = peca('cpu-ryzen-5-7600', 'cpu')

const desafioA: Desafio = {
  id: 'desafio-a',
  titulo: 'Desafio A',
  descricao: 'Primeiro.',
  orcamentoMaximo: 3000,
  categoriasExigidas: [],
}

const aplicar = (estado: EstadoApp, ...acoes: AcaoApp[]) => acoes.reduce(reduzirApp, estado)

function memoria() {
  const dados = new Map<string, string>()
  return {
    getItem: (chave: string) => dados.get(chave) ?? null,
    setItem: (chave: string, valor: string) => void dados.set(chave, valor),
  }
}

describe('salvarDesafios e lerDesafiosSalvos', () => {
  it('ida e volta preserva tela, Desafio ativo, progresso e concluídos', () => {
    const estado = aplicar(
      ESTADO_APP_INICIAL,
      { tipo: 'abrir-desafio', desafio: desafioA },
      { tipo: 'encaixar', peca: placaAm5 },
      { tipo: 'guardar', peca: cpuAm5 },
      { tipo: 'concluir-desafio', id: 'outro' },
    )
    const storage = memoria()
    salvarDesafios(storage, estado)
    expect(lerDesafiosSalvos(storage)).toEqual({
      versao: 1,
      tela: 'desafio',
      desafioAtivo: 'desafio-a',
      progresso: { 'desafio-a': { build: [placaAm5.id], bandeja: [cpuAm5.id] } },
      concluidos: ['outro'],
    })
  })
})

describe('dados salvos inválidos ou storage que falha', () => {
  const storageCom = (valor: string | null) => ({
    getItem: (chave: string) => (chave === CHAVE_DESAFIOS ? valor : null),
  })
  const falha = () => {
    throw new DOMException('cota cheia', 'QuotaExceededError')
  }

  it.each([
    ['chave ausente', null],
    ['JSON corrompido', '{versao:'],
    [
      'versão diferente',
      JSON.stringify({ versao: 2, tela: 'livre', progresso: {}, concluidos: [] }),
    ],
    ['tela desconhecida', JSON.stringify({ versao: 1, tela: 'x', progresso: {}, concluidos: [] })],
    ['não é objeto', '42'],
  ])('lerDesafiosSalvos devolve undefined com %s', (_caso, valor) => {
    expect(lerDesafiosSalvos(storageCom(valor))).toBeUndefined()
  })

  it('lerDesafiosSalvos devolve undefined quando getItem lança', () => {
    expect(lerDesafiosSalvos({ getItem: falha })).toBeUndefined()
  })

  it('salvarDesafios não lança quando setItem lança', () => {
    expect(() => salvarDesafios({ setItem: falha }, ESTADO_APP_INICIAL)).not.toThrow()
  })
})
