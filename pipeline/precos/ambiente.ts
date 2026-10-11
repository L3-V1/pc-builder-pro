import { readFileSync, writeFileSync } from 'node:fs'
import type { Ambiente } from './token'

// Troca (ou acrescenta no fim) `NOME=valor` num arquivo .env, sem mexer nas outras linhas.
export function definirVariavel(conteudo: string, nome: string, valor: string): string {
  const semQuebraFinal = conteudo.replace(/\r?\n$/, '')
  const linhas = semQuebraFinal === '' ? [] : semQuebraFinal.split(/\r?\n/)
  const i = linhas.findIndex((l) => l.startsWith(`${nome}=`))
  if (i >= 0) linhas[i] = `${nome}=${valor}`
  else linhas.push(`${nome}=${valor}`)
  return `${linhas.join('\n')}\n`
}

// O ML invalida o refresh token a cada uso: o novo precisa substituir o antigo no .env.local.
export function gravarVariavel(arquivo: URL, nome: string, valor: string): void {
  let conteudo = ''
  try {
    conteudo = readFileSync(arquivo, 'utf8')
  } catch {
    // Arquivo ainda não existe: será criado.
  }
  writeFileSync(arquivo, definirVariavel(conteudo, nome, valor))
}

export type ModoColeta = { coletar: true } | { coletar: false; motivo: string }

// Sem o app do Mercado Livre configurado (ID e secret vazios), o pipeline cai sozinho no modo sem
// coleta. Só uma das duas preenchida é erro de configuração e segue para `obterToken`, que falha.
// `--exigir-coleta` (workflow agendado) desliga esse fallback; `--sem-coleta` o força.
export function escolherModoColeta(args: readonly string[], env: Ambiente): ModoColeta {
  const sem = args.includes('--sem-coleta')
  const exigir = args.includes('--exigir-coleta')
  if (sem && exigir) throw new Error('--sem-coleta e --exigir-coleta não podem ser usadas juntas.')
  if (sem) return { coletar: false, motivo: '--sem-coleta' }
  if (!exigir && !env.ML_CLIENT_ID && !env.ML_CLIENT_SECRET)
    return { coletar: false, motivo: 'ML_CLIENT_ID e ML_CLIENT_SECRET vazios, veja .env.example' }
  return { coletar: true }
}
