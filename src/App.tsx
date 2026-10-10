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
        <rect x="4" y="4" width="27" height="27" className="marca__sombra" />
        <rect x="1" y="1" width="27" height="27" className="marca__fundo" />
        <rect x="8" y="8" width="13" height="13" className="marca__chip" />
        <path
          d="M11.5 8V5M14.5 8V5M17.5 8V5M11.5 24v-3M14.5 24v-3M17.5 24v-3M8 11.5H5M8 14.5H5M8 17.5H5M24 11.5h-3M24 14.5h-3M24 17.5h-3"
          className="marca__pinos"
        />
        <rect x="12.5" y="12.5" width="4" height="4" className="marca__led" />
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
