// Obtém o primeiro refresh token do Mercado Livre e grava em .env.local.
// 1. npx tsx pipeline/ferramentas/autorizar-ml.ts         → imprime a URL de autorização
// 2. Abra a URL, autorize e copie o `code` da URL de retorno (https://localhost/?code=TG-…)
// 3. npx tsx pipeline/ferramentas/autorizar-ml.ts TG-…    → troca o code e grava ML_REFRESH_TOKEN
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { CAMINHOS, ML_API } from '../config'
import { gravarVariavel } from '../precos/ambiente'

const REDIRECT_URI = 'https://localhost'

if (existsSync(CAMINHOS.envLocal)) process.loadEnvFile(fileURLToPath(CAMINHOS.envLocal))
const { ML_CLIENT_ID: clientId, ML_CLIENT_SECRET: clientSecret } = process.env
if (!clientId || !clientSecret) {
  console.error('Preencha ML_CLIENT_ID e ML_CLIENT_SECRET em .env.local (veja .env.example).')
  process.exit(1)
}

const code = process.argv[2]
if (!code) {
  const url = new URL('https://auth.mercadolivre.com.br/authorization')
  url.search = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
  }).toString()
  console.log(
    `Abra e autorize:\n\n  ${url}\n\nDepois rode de novo passando o code da URL de retorno.`,
  )
  process.exit(0)
}

const r = await fetch(`${ML_API}/oauth/token`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: REDIRECT_URI,
  }).toString(),
})
const corpo = (await r.json()) as Record<string, string | undefined>
if (!r.ok || !corpo.refresh_token) {
  console.error(`Falha (HTTP ${r.status}): ${corpo.error}: ${corpo.message}`)
  process.exit(1)
}
gravarVariavel(CAMINHOS.envLocal, 'ML_REFRESH_TOKEN', corpo.refresh_token)
console.log(`ML_REFRESH_TOKEN gravado em ${fileURLToPath(CAMINHOS.envLocal)}`)
