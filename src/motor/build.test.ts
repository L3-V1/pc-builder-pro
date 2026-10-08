import { describe, expect, it } from 'vitest'
import { criarBuild, encaixar, pecasDaBuild, remover } from './build'
import type { Build } from './build'
import { peca } from './teste-pecas'

const ryzen5600 = peca('cpu-ryzen-5-5600', 'cpu')
const ryzen7600 = peca('cpu-ryzen-5-7600', 'cpu')
const kitDdr4 = peca('ram-corsair-16gb-ddr4-3200', 'ram')

function encaixado(build: Build, p: Parameters<typeof encaixar>[1]): Build {
  const r = encaixar(build, p)
  if (!r.ok) throw new Error('encaixe bloqueado no setup do teste')
  return r.build
}

describe('criarBuild', () => {
  it('devolve Build vazia: sem Peças únicas, ram e armazenamento vazios', () => {
    expect(criarBuild()).toEqual({ ram: [], armazenamento: [] })
  })
})

describe('encaixar', () => {
  it('encaixa CPU numa Build vazia sem alterar a original', () => {
    const vazia = criarBuild()
    const r = encaixar(vazia, ryzen5600)
    expect(r).toEqual({
      ok: true,
      build: { cpu: ryzen5600, ram: [], armazenamento: [] },
      removidas: [],
    })
    expect(vazia).toEqual({ ram: [], armazenamento: [] })
  })

  it('substitui a CPU anterior, que vem em removidas', () => {
    const r = encaixar(encaixado(criarBuild(), ryzen5600), ryzen7600)
    expect(r).toMatchObject({ ok: true, build: { cpu: ryzen7600 }, removidas: [ryzen5600] })
  })

  it('acumula RAM e armazenamento, inclusive o mesmo kit duas vezes', () => {
    const nvme = peca('armazenamento-nvme-1tb', 'armazenamento')
    let b = encaixado(criarBuild(), kitDdr4)
    b = encaixado(b, kitDdr4)
    b = encaixado(b, nvme)
    b = encaixado(b, nvme)
    expect(b.ram).toEqual([kitDdr4, kitDdr4])
    expect(b.armazenamento).toEqual([nvme, nvme])
  })
})

describe('remover', () => {
  it('tira a Peça única pelo ID', () => {
    const b = encaixado(criarBuild(), ryzen5600)
    expect(remover(b, ryzen5600.id)).toEqual(criarBuild())
  })

  it('em RAM tira só uma ocorrência', () => {
    const b = encaixado(encaixado(criarBuild(), kitDdr4), kitDdr4)
    expect(remover(b, kitDdr4.id).ram).toEqual([kitDdr4])
  })

  it('ID ausente devolve Build equivalente', () => {
    const b = encaixado(criarBuild(), ryzen5600)
    expect(remover(b, 'nao-existe')).toEqual(b)
  })
})

describe('pecasDaBuild', () => {
  it('lista todas as Peças encaixadas', () => {
    const placa = peca('placa-mae-a520m-k', 'placa-mae')
    let b = encaixado(criarBuild(), ryzen5600)
    b = encaixado(b, placa)
    b = encaixado(b, kitDdr4)
    expect(pecasDaBuild(b)).toEqual([ryzen5600, placa, kitDdr4])
  })
})
