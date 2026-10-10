import { useEffect, useRef, useState } from 'react'
import type { BuscarPecas, FiltrosPesquisa } from '../busca'
import type { Peca } from '../catalogo'

export type EstadoBusca = { pecas: Peca[]; buscando: boolean; erro: boolean }

type Resposta = { chave: string; pecas: Peca[]; erro: boolean }

// Tudo menos o texto: se só o texto mudou, a busca espera a pausa na digitação.
const chaveSemTexto = (filtros: FiltrosPesquisa) => JSON.stringify({ ...filtros, texto: '' })

const ehAbortError = (motivo: unknown) =>
  motivo instanceof DOMException && motivo.name === 'AbortError'

export function useBuscaPecas(
  buscar: BuscarPecas,
  filtros: FiltrosPesquisa,
  { atraso = 250 }: { atraso?: number } = {},
): EstadoBusca {
  const chave = JSON.stringify(filtros)
  const [resposta, setResposta] = useState<Resposta>()
  // Filtros (sem o texto) da última busca que saiu de fato; uma execução do efeito
  // limpa antes do timer, como no StrictMode, não conta.
  const anterior = useRef<string>(undefined)

  useEffect(() => {
    const controle = new AbortController()
    // O efeito depende da chave, não da identidade do objeto, que muda a cada render.
    const filtrosAtuais = JSON.parse(chave) as FiltrosPesquisa
    const semTexto = chaveSemTexto(filtrosAtuais)
    const espera = anterior.current === semTexto ? atraso : 0
    const timer = setTimeout(() => {
      anterior.current = semTexto
      buscar(filtrosAtuais, controle.signal).then(
        (pecas) => {
          // Abortada = substituída por uma busca mais nova; a resposta dela é descartada.
          if (!controle.signal.aborted) setResposta({ chave, pecas, erro: false })
        },
        (motivo: unknown) => {
          if (controle.signal.aborted || ehAbortError(motivo)) return
          setResposta((atual) => ({ chave, pecas: atual?.pecas ?? [], erro: true }))
        },
      )
    }, espera)
    return () => {
      clearTimeout(timer)
      controle.abort()
    }
  }, [buscar, chave, atraso])

  return {
    pecas: resposta?.pecas ?? [],
    buscando: resposta?.chave !== chave,
    erro: resposta?.chave === chave && resposta.erro,
  }
}
