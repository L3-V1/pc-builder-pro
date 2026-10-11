import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export type OpcoesCliente = {
  base: string
  token: string
  // Uma pasta por dia: rodar de novo no mesmo dia não gasta requisições.
  cacheDir: string
  concorrencia: number
  fetch?: typeof globalThis.fetch
  esperar?: (ms: number) => Promise<void>
}

export type ClienteMl = { get(caminho: string): Promise<unknown> }

const TENTATIVAS = 5
const repetivel = (status: number) => status === 429 || status >= 500

async function lerCache(arquivo: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(arquivo, 'utf8'))
  } catch {
    return undefined
  }
}

// Executa no máximo `limite` tarefas ao mesmo tempo; as demais esperam na fila.
function limitar(limite: number) {
  let ativas = 0
  const fila: (() => void)[] = []
  return async <T>(tarefa: () => Promise<T>): Promise<T> => {
    // Quem termina passa a vaga direto para o próximo da fila, sem liberá-la no meio.
    if (ativas < limite) ativas++
    else await new Promise<void>((r) => fila.push(r))
    try {
      return await tarefa()
    } finally {
      const proxima = fila.shift()
      if (proxima) proxima()
      else ativas--
    }
  }
}

export function criarClienteMl(opcoes: OpcoesCliente): ClienteMl {
  const fetch = opcoes.fetch ?? globalThis.fetch
  const esperar = opcoes.esperar ?? ((ms) => new Promise((r) => setTimeout(r, ms)))
  const naVez = limitar(opcoes.concorrencia)

  async function buscar(caminho: string): Promise<unknown> {
    const url = `${opcoes.base}${caminho}`
    for (let tentativa = 1; ; tentativa++) {
      const r = await fetch(url, { headers: { Authorization: `Bearer ${opcoes.token}` } })
      if (r.ok) return r.json()
      if (!repetivel(r.status)) throw new Error(`GET ${caminho} falhou: HTTP ${r.status}`)
      if (tentativa === TENTATIVAS)
        throw new Error(`GET ${caminho} falhou após ${TENTATIVAS} tentativas: HTTP ${r.status}`)
      await esperar(1000 * 2 ** (tentativa - 1))
    }
  }

  return {
    async get(caminho) {
      // O caminho tem "?", "&" e "/": o nome do arquivo é o hash dele.
      const nome = createHash('sha1').update(caminho).digest('hex')
      const arquivo = join(opcoes.cacheDir, `${nome}.json`)
      const emCache = await lerCache(arquivo)
      if (emCache !== undefined) return emCache
      const dados = await naVez(() => buscar(caminho))
      await mkdir(opcoes.cacheDir, { recursive: true })
      await writeFile(arquivo, JSON.stringify(dados))
      return dados
    },
  }
}
