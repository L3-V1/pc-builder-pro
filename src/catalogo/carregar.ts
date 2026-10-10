import type { Catalogo } from './schema'
import { validarCatalogo } from './validar'
import type { ErroCatalogo } from './validar'

// Um arquivo por Categoria, na ordem em que as Peças entram no Catálogo; mais o `meta`.
export const ARQUIVOS_DADOS = [
  'cpu',
  'placa-mae',
  'ram',
  'gpu',
  'armazenamento',
  'fonte',
  'gabinete',
  'cooler',
] as const

export type ErroCarregamento =
  | { tipo: 'rede'; arquivo: string; mensagem: string }
  | { tipo: 'http'; arquivo: string; status: number }
  | { tipo: 'json'; arquivo: string }
  | { tipo: 'validacao'; erros: ErroCatalogo[] }

export type ResultadoCarregamento =
  { ok: true; catalogo: Catalogo } | { ok: false; erro: ErroCarregamento }

type OpcoesCarregamento = { buscar?: typeof fetch; base?: string; signal?: AbortSignal }
type Contexto = { buscar: typeof fetch; base: string; signal?: AbortSignal }

class FalhaArquivo extends Error {
  readonly erro: ErroCarregamento
  constructor(erro: ErroCarregamento) {
    super(erro.tipo)
    this.erro = erro
  }
}

async function lerArquivo(arquivo: string, { buscar, base, signal }: Contexto): Promise<unknown> {
  let resposta: Response
  try {
    resposta = await buscar(`${base}dados/${arquivo}.json`, { signal })
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : String(e)
    throw new FalhaArquivo({ tipo: 'rede', arquivo, mensagem })
  }
  if (!resposta.ok) throw new FalhaArquivo({ tipo: 'http', arquivo, status: resposta.status })
  try {
    return await resposta.json()
  } catch {
    throw new FalhaArquivo({ tipo: 'json', arquivo })
  }
}

// Nunca rejeita: toda falha vira `{ ok: false, erro }`. Sem memoização, para "Tentar de novo".
export async function carregarCatalogo(
  opcoes: OpcoesCarregamento = {},
): Promise<ResultadoCarregamento> {
  const contexto: Contexto = {
    buscar: opcoes.buscar ?? ((...args: Parameters<typeof fetch>) => fetch(...args)),
    base: opcoes.base ?? import.meta.env.BASE_URL,
    signal: opcoes.signal,
  }
  try {
    const [meta, ...porCategoria] = await Promise.all(
      ['meta', ...ARQUIVOS_DADOS].map((arquivo) => lerArquivo(arquivo, contexto)),
    )
    const dataReferencia =
      typeof meta === 'object' && meta !== null && 'dataReferencia' in meta
        ? meta.dataReferencia
        : undefined
    const pecas = porCategoria.flatMap((lista) => (Array.isArray(lista) ? lista : [lista]))
    const resultado = validarCatalogo({ dataReferencia, pecas })
    if (!resultado.ok) return { ok: false, erro: { tipo: 'validacao', erros: resultado.erros } }
    return { ok: true, catalogo: resultado.catalogo }
  } catch (e) {
    if (e instanceof FalhaArquivo) return { ok: false, erro: e.erro }
    const mensagem = e instanceof Error ? e.message : String(e)
    return { ok: false, erro: { tipo: 'rede', arquivo: 'desconhecido', mensagem } }
  }
}

export function mensagemErro(erro: ErroCarregamento): string {
  switch (erro.tipo) {
    case 'rede':
      return `Não foi possível baixar o arquivo "${erro.arquivo}" do Catálogo. Confira sua conexão.`
    case 'http':
      return `O servidor respondeu com erro ${erro.status} ao baixar o arquivo "${erro.arquivo}" do Catálogo.`
    case 'json':
      return `O arquivo "${erro.arquivo}" do Catálogo veio corrompido.`
    case 'validacao':
      return `Os dados do Catálogo estão inválidos (${erro.erros.length} ${
        erro.erros.length === 1 ? 'problema encontrado' : 'problemas encontrados'
      }).`
  }
}
