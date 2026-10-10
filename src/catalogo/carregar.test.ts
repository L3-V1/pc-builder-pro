import { describe, expect, it, vi } from 'vitest'
import { buscarFixture, catalogoFixture, respostaDados } from '../teste/catalogo'
import { ARQUIVOS_DADOS, carregarCatalogo, mensagemErro } from './carregar'
import type { ErroCarregamento } from './carregar'

const arquivoDe = (url: unknown) => /dados\/([^/]+)\.json$/.exec(String(url))?.[1] ?? ''

// Responde com a fixture, exceto no arquivo em que `falha` devolver uma resposta própria.
function buscarCom(falha: (arquivo: string) => Response | Promise<Response> | undefined) {
  return vi.fn<typeof fetch>(async (url, init) => {
    return (await falha(arquivoDe(url))) ?? buscarFixture(url, init)
  })
}

describe('carregarCatalogo', () => {
  it('Cenário: busca os 9 arquivos em <base>dados/ e devolve as Peças na ordem das Categorias', async () => {
    // Dado um servidor que responde os 9 arquivos com a fixture
    const buscar = vi.fn(buscarFixture)
    // Quando o Catálogo é carregado com uma base
    const r = await carregarCatalogo({ buscar, base: '/sub/' })
    // Então busca cada arquivo uma vez em <base>dados/<arquivo>.json
    const urls = buscar.mock.calls.map(([url]) => String(url))
    expect(urls.toSorted()).toEqual(
      ['meta', ...ARQUIVOS_DADOS].map((a) => `/sub/dados/${a}.json`).toSorted(),
    )
    // E devolve as Peças na ordem das Categorias com a data do meta.json
    expect(r).toEqual({ ok: true, catalogo: catalogoFixture })
    expect(r.ok && r.catalogo.dataReferencia).toBe('2026-10')
  })

  it('Cenário: sem base explícita usa a BASE_URL do Vite', async () => {
    const buscar = vi.fn(buscarFixture)
    await carregarCatalogo({ buscar })
    expect(String(buscar.mock.calls[0][0])).toMatch(
      new RegExp(String.raw`^${import.meta.env.BASE_URL}dados/[a-z-]+\.json$`),
    )
  })

  it('Cenário: repassa o signal para cada fetch', async () => {
    const buscar = vi.fn(buscarFixture)
    const { signal } = new AbortController()
    await carregarCatalogo({ buscar, signal })
    expect(buscar).toHaveBeenCalledTimes(9)
    for (const [, init] of buscar.mock.calls) expect(init?.signal).toBe(signal)
  })

  it('Cenário: fetch rejeitado vira erro de rede com o arquivo, sem rejeitar a Promise', async () => {
    const buscar = buscarCom((a) =>
      a === 'gpu' ? Promise.reject(new TypeError('offline')) : undefined,
    )
    await expect(carregarCatalogo({ buscar })).resolves.toEqual({
      ok: false,
      erro: { tipo: 'rede', arquivo: 'gpu', mensagem: 'offline' },
    })
  })

  it.each([404, 500])(
    'Cenário: resposta %i vira erro http com arquivo e status',
    async (status) => {
      const buscar = buscarCom((a) => (a === 'meta' ? new Response('x', { status }) : undefined))
      await expect(carregarCatalogo({ buscar })).resolves.toEqual({
        ok: false,
        erro: { tipo: 'http', arquivo: 'meta', status },
      })
    },
  )

  it('Cenário: corpo que não é JSON vira erro json com o arquivo', async () => {
    const buscar = buscarCom((a) => (a === 'ram' ? new Response('<html>') : undefined))
    await expect(carregarCatalogo({ buscar })).resolves.toEqual({
      ok: false,
      erro: { tipo: 'json', arquivo: 'ram' },
    })
  })

  it('Cenário: Peça inválida vira erro de validação com o caminho', async () => {
    const [primeira, ...resto] = respostaDados('cpu') as Record<string, unknown>[]
    const buscar = buscarCom((a) =>
      a === 'cpu' ? Response.json([{ ...primeira, nucleos: -1 }, ...resto]) : undefined,
    )
    const r = await carregarCatalogo({ buscar })
    expect(r.ok).toBe(false)
    if (r.ok || r.erro.tipo !== 'validacao') throw new Error('esperava erro de validação')
    expect(r.erro.erros.map((e) => e.caminho)).toContain('pecas[0].nucleos')
  })

  it('Cenário: ID duplicado vira erro de validação com o caminho', async () => {
    const cpus = respostaDados('cpu') as unknown[]
    const buscar = buscarCom((a) => (a === 'cpu' ? Response.json([...cpus, cpus[0]]) : undefined))
    const r = await carregarCatalogo({ buscar })
    if (r.ok || r.erro.tipo !== 'validacao') throw new Error('esperava erro de validação')
    expect(r.erro.erros).toEqual([
      { caminho: `pecas[${cpus.length}].id`, mensagem: expect.stringContaining('ID duplicado') },
    ])
  })

  it('Cenário: sem memoização, cada chamada refaz o fetch', async () => {
    const buscar = vi.fn(buscarFixture)
    await carregarCatalogo({ buscar })
    await carregarCatalogo({ buscar })
    expect(buscar).toHaveBeenCalledTimes(18)
  })
})

describe('mensagemErro', () => {
  it.each<[ErroCarregamento, RegExp]>([
    [{ tipo: 'rede', arquivo: 'gpu', mensagem: 'offline' }, /baixar o arquivo "gpu".*conexão/],
    [{ tipo: 'http', arquivo: 'meta', status: 404 }, /erro 404.*"meta"/],
    [{ tipo: 'json', arquivo: 'ram' }, /"ram".*corrompido/],
    [{ tipo: 'validacao', erros: [{ caminho: 'x', mensagem: 'y' }] }, /inválidos \(1 problema/],
  ])('Cenário: produz texto pt-BR para o erro %o', (erro, esperado) => {
    expect(mensagemErro(erro)).toMatch(esperado)
  })
})
