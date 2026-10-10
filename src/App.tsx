import { useEffect, useState } from 'react'
import { Aplicacao } from './Aplicacao'
import { carregarCatalogo, mensagemErro } from './catalogo'
import type { Catalogo, ErroCarregamento } from './catalogo'
import { TelaCarregamento } from './componentes/TelaCarregamento'
import { TelaErroCatalogo } from './componentes/TelaErroCatalogo'

type Carga =
  | { estado: 'carregando' }
  | { estado: 'erro'; erro: ErroCarregamento }
  | { estado: 'pronto'; catalogo: Catalogo }

// Busca o Catálogo e só monta a Aplicacao quando ele chega.
export default function App({ buscar }: { buscar?: typeof fetch }) {
  const [carga, setCarga] = useState<Carga>({ estado: 'carregando' })
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    // Abortar na limpeza evita setState depois de desmontar e a corrida do StrictMode.
    const controle = new AbortController()
    carregarCatalogo({ buscar, signal: controle.signal }).then((r) => {
      if (controle.signal.aborted) return
      setCarga(r.ok ? { estado: 'pronto', catalogo: r.catalogo } : { estado: 'erro', erro: r.erro })
    })
    return () => controle.abort()
  }, [buscar, tentativa])

  if (carga.estado === 'carregando') return <TelaCarregamento />
  if (carga.estado === 'erro') {
    return (
      <TelaErroCatalogo
        mensagem={mensagemErro(carga.erro)}
        onTentarDeNovo={() => {
          setCarga({ estado: 'carregando' })
          setTentativa((t) => t + 1)
        }}
      />
    )
  }
  return <Aplicacao catalogo={carga.catalogo} />
}
