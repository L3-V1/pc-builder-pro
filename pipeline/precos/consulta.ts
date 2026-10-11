import type { Normalizada } from '../normalizar'
import { kebab } from '../slug'

// Nomes de família que os títulos do ML costumam omitir ("Placa de Vídeo RX 6600").
const FAMILIAS_GPU = new Set(['geforce', 'radeon'])
// Sufixos que mudam o modelo quando aparecem como palavra separada ("RX 6600 XT").
const VARIANTES = ['xt', 'xtx', 'ti', 'super', 'gre']

export const palavras = (texto: string): string[] => kebab(texto).split('-').filter(Boolean)

export type Tokens = { obrigatorios: string[]; proibidos: string[] }

// Palavras que o título de um Anúncio precisa ter (e não pode ter) para ser da Peça.
export function tokensModelo(peca: Normalizada): Tokens {
  let obrigatorios: string[] = []
  if (peca.categoria === 'cpu') obrigatorios = palavras(peca.nome)
  if (peca.categoria === 'gpu')
    obrigatorios = palavras(peca.chave ?? '').filter((p) => !FAMILIAS_GPU.has(p))
  return { obrigatorios, proibidos: VARIANTES.filter((v) => !obrigatorios.includes(v)) }
}

// O que se digita na busca do ML. Na GPU, o nome comercial da placa ("Challenger D … 8GB")
// restringe demais: marca da placa + chipset acha os Anúncios da mesma placa.
export function textoBusca(peca: Normalizada): string {
  const modelo = peca.categoria === 'gpu' ? (peca.chave ?? peca.nome) : peca.nome
  const repetida = modelo.toLowerCase().startsWith(`${peca.marca.toLowerCase()} `)
  return repetida ? modelo : `${peca.marca} ${modelo}`
}
