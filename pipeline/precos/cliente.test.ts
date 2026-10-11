import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { criarClienteMl } from './cliente'

const resposta = (status: number, corpo: unknown = {}) =>
  new Response(JSON.stringify(corpo), { status })

let cacheDir: string
beforeEach(async () => {
  cacheDir = await mkdtemp(join(tmpdir(), 'cliente-ml-'))
})

function criar(fetch: typeof globalThis.fetch, esperas: number[] = []) {
  return criarClienteMl({
    base: 'https://api.ml.test',
    token: 'tk',
    cacheDir,
    concorrencia: 2,
    fetch,
    esperar: async (ms) => {
      esperas.push(ms)
    },
  })
}

describe('criarClienteMl', () => {
  it('repete após 429 e 5xx com backoff exponencial e manda o token', async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(resposta(429))
      .mockResolvedValueOnce(resposta(503))
      .mockResolvedValueOnce(resposta(200, { results: [1] }))
    const esperas: number[] = []
    expect(await criar(fetch, esperas).get('/products/search?q=x')).toEqual({ results: [1] })
    expect(esperas).toEqual([1000, 2000])
    expect(fetch).toHaveBeenCalledTimes(3)
    expect(fetch).toHaveBeenCalledWith('https://api.ml.test/products/search?q=x', {
      headers: { Authorization: 'Bearer tk' },
    })
  })

  it('desiste após 5 tentativas com erro que diz o caminho e o último status', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(async () => resposta(429))
    const esperas: number[] = []
    await expect(criar(fetch, esperas).get('/x')).rejects.toThrow(
      'GET /x falhou após 5 tentativas: HTTP 429',
    )
    expect(fetch).toHaveBeenCalledTimes(5)
    expect(esperas).toEqual([1000, 2000, 4000, 8000])
  })

  it('grava a resposta em disco e, na segunda vez, lê do cache sem chamar o fetch', async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockImplementation(async () => resposta(200, { id: 'MLB1' }))
    await criar(fetch).get('/products/MLB1/items?limit=50')
    const outroCliente = criar(fetch)
    expect(await outroCliente.get('/products/MLB1/items?limit=50')).toEqual({ id: 'MLB1' })
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('com erro não repetível (403), lança na hora e não grava no cache', async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(resposta(403, { message: 'forbidden' }))
      .mockResolvedValueOnce(resposta(200, { ok: true }))
    await expect(criar(fetch).get('/sites/MLB/search?q=x')).rejects.toThrow(
      'GET /sites/MLB/search?q=x falhou: HTTP 403',
    )
    expect(await criar(fetch).get('/sites/MLB/search?q=x')).toEqual({ ok: true })
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('nunca tem mais requisições simultâneas que a concorrência configurada', async () => {
    let emAndamento = 0
    let pico = 0
    const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(async () => {
      pico = Math.max(pico, ++emAndamento)
      await new Promise((r) => setTimeout(r, 5))
      emAndamento--
      return resposta(200)
    })
    const cliente = criar(fetch)
    await Promise.all(['/a', '/b', '/c', '/d', '/e'].map((c) => cliente.get(c)))
    expect(fetch).toHaveBeenCalledTimes(5)
    expect(pico).toBe(2)
  })
})
