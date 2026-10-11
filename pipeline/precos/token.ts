import { ML_API } from '../config'

export type Ambiente = Record<string, string | undefined>
// O ML invalida o refresh token a cada uso: quem chama precisa gravar o novo.
export type Token = { accessToken: string; refreshToken?: string }

const OBRIGATORIAS = ['ML_CLIENT_ID', 'ML_CLIENT_SECRET'] as const

// Com ML_REFRESH_TOKEN (obtido uma vez por `autorizar-ml.ts`), troca-o; sem ele, tenta
// client_credentials, que não precisa de rotação.
export async function obterToken(
  env: Ambiente,
  fetch: typeof globalThis.fetch = globalThis.fetch,
): Promise<Token> {
  const faltam = OBRIGATORIAS.filter((nome) => !env[nome])
  if (faltam.length > 0)
    throw new Error(
      `Faltam variáveis de ambiente do Mercado Livre: ${faltam.join(', ')}. Veja .env.example.`,
    )
  const credenciais = {
    client_id: env.ML_CLIENT_ID ?? '',
    client_secret: env.ML_CLIENT_SECRET ?? '',
  }
  const concessao = env.ML_REFRESH_TOKEN
    ? { grant_type: 'refresh_token', ...credenciais, refresh_token: env.ML_REFRESH_TOKEN }
    : { grant_type: 'client_credentials', ...credenciais }
  const r = await fetch(`${ML_API}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams(concessao).toString(),
  })
  const corpo = (await r.json()) as Record<string, string | undefined>
  if (!r.ok)
    throw new Error(
      `Falha ao obter token do Mercado Livre (HTTP ${r.status}): ${corpo.error}: ${corpo.message}`,
    )
  return {
    accessToken: corpo.access_token ?? '',
    ...(corpo.refresh_token ? { refreshToken: corpo.refresh_token } : {}),
  }
}
