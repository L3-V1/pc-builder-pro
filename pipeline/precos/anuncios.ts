import type { ClienteMl } from './cliente'

// Um Anúncio do Mercado Livre já convertido do formato da API.
export type Anuncio = {
  id: string
  titulo: string
  preco: number
  condicao: 'novo' | 'usado' | 'recondicionado'
  // Unidades por Anúncio, quando a API informa (ex.: "Kit 2 unidades").
  quantidadeKit?: number
}

// Porta: a estratégia (catálogo ou busca) é escolhida no spike e fica atrás desta assinatura.
export type BuscarAnuncios = (consulta: string) => Promise<Anuncio[]>

// AINDA NÃO VALIDADA contra a API real: depende do app no Mercado Livre (passo 1 do plano) e do
// spike (passo 2). Até lá, sem ML_CLIENT_ID e ML_CLIENT_SECRET o pipeline nem chega aqui.
// Provisória: a implementação sobre o cliente (catálogo ou busca) sai do spike da API.
export function criarBuscarAnuncios(_cliente: ClienteMl): BuscarAnuncios {
  throw new Error(
    'A busca de Anúncios ainda depende do spike da API do Mercado Livre (passo 2 do plano). ' +
      'Esvazie ML_CLIENT_ID e ML_CLIENT_SECRET ou use `npm run pipeline -- --sem-coleta`.',
  )
}
