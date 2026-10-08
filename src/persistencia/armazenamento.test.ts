import { describe, expect, it, vi } from 'vitest'
import { ESTADO_INICIAL, reduzirBuild } from '../estado/build'
import { montar, peca } from '../motor/teste-pecas'
import { CHAVE_ESTADO, lerEstadoSalvo, salvarEstado, serializarEstado } from './armazenamento'

const placaAm5 = peca('placa-mae-b650m-aorus-elite', 'placa-mae')
const ramDdr5 = peca('ram-corsair-32gb-ddr5-6000', 'ram')
const cpuAm5 = peca('cpu-ryzen-5-7600', 'cpu')

const storageCom = (valor: string | null) => ({
  getItem: (chave: string) => (chave === CHAVE_ESTADO ? valor : null),
})

describe('serializarEstado', () => {
  it('guarda IDs da Build com repetições, IDs da Bandeja e a Meta', () => {
    const estado = reduzirBuild(
      { ...ESTADO_INICIAL, build: montar(placaAm5, ramDdr5, ramDdr5), meta: 7000 },
      { tipo: 'guardar', peca: cpuAm5 },
    )
    expect(serializarEstado(estado)).toEqual({
      versao: 1,
      build: [placaAm5.id, ramDdr5.id, ramDdr5.id],
      bandeja: [cpuAm5.id],
      meta: 7000,
    })
  })
})

describe('lerEstadoSalvo', () => {
  it('lê um estado válido', () => {
    const salvo = { versao: 1, build: [placaAm5.id], bandeja: [], meta: 3000 }
    expect(lerEstadoSalvo(storageCom(JSON.stringify(salvo)))).toEqual(salvo)
  })

  it.each([
    ['chave ausente', null],
    ['JSON inválido', '{versao:'],
    ['versão diferente', JSON.stringify({ versao: 2, build: [], bandeja: [] })],
    ['build não é lista', JSON.stringify({ versao: 1, build: 'x', bandeja: [] })],
    ['meta inválida', JSON.stringify({ versao: 1, build: [], bandeja: [], meta: 0 })],
    ['não é objeto', '42'],
  ])('devolve undefined com %s', (_caso, valor) => {
    expect(lerEstadoSalvo(storageCom(valor))).toBeUndefined()
  })
})

describe('acesso ao storage que falha', () => {
  const falha = () => {
    throw new DOMException('cota cheia', 'QuotaExceededError')
  }

  it('lerEstadoSalvo devolve undefined quando getItem lança', () => {
    expect(lerEstadoSalvo({ getItem: falha })).toBeUndefined()
  })

  it('salvarEstado grava o estado serializado e engole a exceção de setItem', () => {
    const setItem = vi.fn()
    const estado = { ...ESTADO_INICIAL, meta: 2000 }
    salvarEstado({ setItem }, estado)
    expect(setItem).toHaveBeenCalledWith(CHAVE_ESTADO, JSON.stringify(serializarEstado(estado)))
    expect(() => salvarEstado({ setItem: falha }, estado)).not.toThrow()
  })
})
