import { describe, expect, it } from 'vitest'
import { carregarDesafios } from '.'
import { Desafio, validarDesafios } from './schema'

const minimo = {
  id: 'primeiro-pc',
  titulo: 'Primeiro PC',
  descricao: 'Monte um PC que liga.',
  orcamentoMaximo: 3000,
}

describe('Desafio', () => {
  it('aceita um Desafio mínimo e assume categoriasExigidas vazia', () => {
    const r = Desafio.safeParse(minimo)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.categoriasExigidas).toEqual([])
  })

  it('aceita Pontuação mínima nos limites de 0 a 100', () => {
    const r = Desafio.safeParse({ ...minimo, pontuacaoMinima: { jogos: 0, produtividade: 100 } })
    expect(r.success).toBe(true)
  })

  it('aceita Categorias exigidas do Catálogo', () => {
    const r = Desafio.safeParse({ ...minimo, categoriasExigidas: ['gpu', 'cooler'] })
    expect(r.success).toBe(true)
  })
})

describe('Desafio inválido', () => {
  it.each([
    ['orçamento não inteiro', { orcamentoMaximo: 3000.5 }],
    ['orçamento zero', { orcamentoMaximo: 0 }],
    ['orçamento negativo', { orcamentoMaximo: -1 }],
    ['orçamento acima de 1.000.000', { orcamentoMaximo: 1_000_001 }],
    ['Pontuação mínima acima de 100', { pontuacaoMinima: { jogos: 101 } }],
    ['Pontuação mínima negativa', { pontuacaoMinima: { produtividade: -1 } }],
    ['Categoria inexistente', { categoriasExigidas: ['monitor'] }],
    ['campo desconhecido', { estrelas: 3 }],
    ['Perfil desconhecido', { pontuacaoMinima: { edicao: 10 } }],
    ['ID fora do padrão', { id: 'Primeiro PC' }],
    ['título vazio', { titulo: '' }],
    ['descrição vazia', { descricao: '' }],
    ['Pontuação mínima vazia', { pontuacaoMinima: {} }],
  ])('rejeita %s', (_caso, campos) => {
    expect(Desafio.safeParse({ ...minimo, ...campos }).success).toBe(false)
  })
})

describe('validarDesafios', () => {
  it('devolve os Desafios quando todos são válidos', () => {
    const r = validarDesafios([minimo, { ...minimo, id: 'outro' }])
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.desafios.map((d) => d.id)).toEqual(['primeiro-pc', 'outro'])
  })

  it('rejeita IDs repetidos apontando o caminho', () => {
    const r = validarDesafios([minimo, { ...minimo, titulo: 'Cópia' }])
    expect(r).toEqual({
      ok: false,
      erros: [{ caminho: '[1].id', mensagem: 'ID duplicado: "primeiro-pc"' }],
    })
  })

  it('informa o caminho do campo inválido', () => {
    const r = validarDesafios([minimo, { ...minimo, id: 'b', orcamentoMaximo: 0 }])
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.erros.map((e) => e.caminho)).toEqual(['[1].orcamentoMaximo'])
  })
})

describe('carregarDesafios', () => {
  it('devolve o arquivo real válido, com 8 a 12 Desafios', () => {
    const desafios = carregarDesafios()
    expect(desafios.length).toBeGreaterThanOrEqual(8)
    expect(desafios.length).toBeLessThanOrEqual(12)
    expect(validarDesafios(desafios).ok).toBe(true)
  })
})
