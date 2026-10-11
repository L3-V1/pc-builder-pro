import { describe, expect, it, vi } from 'vitest'
import { obterToken } from './token'

const credenciais = { ML_CLIENT_ID: '123', ML_CLIENT_SECRET: 's3cr3t' }
const json = (status: number, corpo: unknown) => new Response(JSON.stringify(corpo), { status })

describe('obterToken', () => {
  it('lança erro listando as variáveis de ambiente que faltam', async () => {
    await expect(obterToken({ ML_CLIENT_ID: '123' })).rejects.toThrow(
      'Faltam variáveis de ambiente do Mercado Livre: ML_CLIENT_SECRET. Veja .env.example.',
    )
    await expect(obterToken({})).rejects.toThrow(': ML_CLIENT_ID, ML_CLIENT_SECRET.')
  })

  it('troca o refresh token por um access token e devolve o refresh token novo', async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(json(200, { access_token: 'APP_USR-a', refresh_token: 'TG-novo' }))
    const token = await obterToken({ ...credenciais, ML_REFRESH_TOKEN: 'TG-velho' }, fetch)
    expect(token).toEqual({ accessToken: 'APP_USR-a', refreshToken: 'TG-novo' })
    const [url, init] = fetch.mock.calls[0]
    expect(url).toBe('https://api.mercadolibre.com/oauth/token')
    expect(init?.method).toBe('POST')
    expect(Object.fromEntries(new URLSearchParams(String(init?.body)))).toEqual({
      grant_type: 'refresh_token',
      client_id: '123',
      client_secret: 's3cr3t',
      refresh_token: 'TG-velho',
    })
  })

  it('sem refresh token usa client_credentials', async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(json(200, { access_token: 'APP_USR-b' }))
    expect(await obterToken(credenciais, fetch)).toEqual({ accessToken: 'APP_USR-b' })
    const corpo = new URLSearchParams(String(fetch.mock.calls[0][1]?.body))
    expect(corpo.get('grant_type')).toBe('client_credentials')
  })

  it('lança erro com o status e a mensagem do ML quando a troca falha', async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(json(400, { error: 'invalid_grant', message: 'Error validating grant' }))
    await expect(obterToken({ ...credenciais, ML_REFRESH_TOKEN: 'TG-x' }, fetch)).rejects.toThrow(
      'Falha ao obter token do Mercado Livre (HTTP 400): invalid_grant: Error validating grant',
    )
  })
})
