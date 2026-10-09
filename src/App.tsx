import { MotionConfig } from 'motion/react'
import { useEffect, useReducer, useState } from 'react'
import './App.css'
import { carregarCatalogo } from './catalogo'
import { Abas } from './componentes/Abas'
import { Montagem } from './componentes/Montagem'
import type { ModoMontagem } from './componentes/Montagem'
import { TelaConclusao } from './componentes/TelaConclusao'
import { TelaDesafios } from './componentes/TelaDesafios'
import { carregarDesafios } from './desafios'
import { estadoAtivo, reduzirApp } from './estado/app'
import { avaliarDesafio } from './motor'
import {
  acaoDoLink,
  decodificarLink,
  iniciarApp,
  lerDesafiosSalvos,
  lerEstadoSalvo,
  salvarDesafios,
  salvarEstado,
} from './persistencia'

// Tira o link da URL para que recarregar a página não o aplique de novo.
function limparHash() {
  history.replaceState(null, '', location.pathname + location.search)
}

function Marca() {
  return (
    <div className="marca">
      <svg className="marca__simbolo" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <rect width="32" height="32" rx="9" className="marca__fundo" />
        <rect x="9" y="9" width="14" height="14" rx="3" className="marca__chip" />
        <path
          d="M12.5 9V6M16 9V6M19.5 9V6M12.5 26v-3M16 26v-3M19.5 26v-3M9 12.5H6M9 16H6M9 19.5H6M26 12.5h-3M26 16h-3M26 19.5h-3"
          className="marca__pinos"
        />
        <circle cx="16" cy="16" r="2.5" className="marca__led" />
      </svg>
      <div>
        <h1>PC Builder Pro</h1>
        <p className="marca__lema">Monte um PC peça por peça e entenda cada escolha</p>
      </div>
    </div>
  )
}

export default function App() {
  const catalogo = carregarCatalogo()
  const desafios = carregarDesafios()
  const [estado, despachar] = useReducer(reduzirApp, undefined, () =>
    iniciarApp({
      salvo: lerEstadoSalvo(localStorage),
      desafiosSalvos: lerDesafiosSalvos(localStorage),
      hash: location.hash,
      catalogo,
      desafios,
    }),
  )
  const [concluindo, setConcluindo] = useState(false)
  const ativo = estadoAtivo(estado)
  const desafio =
    estado.tela === 'desafio' ? desafios.find((d) => d.id === estado.desafioAtivo) : undefined

  useEffect(() => {
    salvarEstado(localStorage, estado.livre)
  }, [estado.livre])

  useEffect(() => {
    salvarDesafios(localStorage, estado)
  }, [estado])

  useEffect(() => {
    // O link da carga inicial já foi aplicado por iniciarApp.
    if (decodificarLink(location.hash)) limparHash()
    const aoMudarHash = () => {
      const acao = acaoDoLink(location.hash, catalogo)
      if (!acao) return
      despachar(acao)
      setConcluindo(false)
      limparHash()
    }
    window.addEventListener('hashchange', aoMudarHash)
    return () => window.removeEventListener('hashchange', aoMudarHash)
  }, [catalogo])

  const modo: ModoMontagem = desafio
    ? {
        tipo: 'desafio',
        desafio,
        avaliacao: avaliarDesafio(desafio, ativo.build),
        onLigar: () => {
          despachar({ tipo: 'concluir-desafio', id: desafio.id })
          setConcluindo(true)
        },
        onVoltar: () => despachar({ tipo: 'ir-para', tela: 'desafios' }),
      }
    : { tipo: 'livre' }
  const abaAtiva = estado.tela === 'livre' ? 'livre' : 'desafios'

  return (
    <MotionConfig reducedMotion="user">
      <main className="app">
        <Abas
          ativa={abaAtiva}
          onSelecionar={(tela) => despachar({ tipo: 'ir-para', tela })}
          marca={<Marca />}
        >
          {estado.tela === 'desafios' ? (
            <TelaDesafios
              desafios={desafios}
              concluidos={estado.concluidos}
              emAndamento={Object.keys(estado.progresso)}
              onAbrir={(d) => despachar({ tipo: 'abrir-desafio', desafio: d })}
            />
          ) : (
            <Montagem
              key={desafio?.id ?? 'livre'}
              estado={ativo}
              despachar={despachar}
              catalogo={catalogo}
              modo={modo}
            />
          )}
        </Abas>
      </main>
      {concluindo && desafio && (
        <TelaConclusao
          desafio={desafio}
          build={ativo.build}
          onVerDesafios={() => {
            setConcluindo(false)
            despachar({ tipo: 'ir-para', tela: 'desafios' })
          }}
          onFechar={() => setConcluindo(false)}
        />
      )}
    </MotionConfig>
  )
}
