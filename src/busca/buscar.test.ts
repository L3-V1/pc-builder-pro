import { describe, expect, it } from 'vitest'
import { catalogoFixture } from '../teste/catalogo'
import { criarBuscaLocal } from './buscar'
import { FILTROS_INICIAIS, pesquisarPecas } from './filtrar'
import type { FiltrosPesquisa } from './filtrar'

const { pecas } = catalogoFixture
const { soCompativeis: _, ...iniciais } = FILTROS_INICIAIS

describe('criarBuscaLocal', () => {
  it('resolve com o mesmo resultado de pesquisarPecas para os mesmos filtros', async () => {
    const filtros: FiltrosPesquisa = { ...iniciais, texto: 'ryzen', ordenacao: 'preco-asc' }
    const buscar = criarBuscaLocal(pecas)
    const resultado = await buscar(filtros, new AbortController().signal)
    expect(resultado.length).toBeGreaterThan(0)
    expect(resultado).toEqual(pesquisarPecas(pecas, filtros))
  })

  it('com o signal já abortado rejeita com AbortError', async () => {
    const controle = new AbortController()
    controle.abort()
    await expect(criarBuscaLocal(pecas)(iniciais, controle.signal)).rejects.toMatchObject({
      name: 'AbortError',
    })
  })
})
