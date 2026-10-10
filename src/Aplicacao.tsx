import { MotionConfig } from 'motion/react'
import { useEffect, useReducer, useState } from 'react'
import './App.css'
import type { Catalogo } from './catalogo'
import { Abas } from './componentes/Abas'
import { Marca } from './componentes/Marca'
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

// A montagem em si; só monta com o Catálogo já carregado, porque iniciarApp é síncrono.
export function Aplicacao({ catalogo }: { catalogo: Catalogo }) {
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
      <footer className="app__rodape">
        Specs das Peças:{' '}
        <a href="https://github.com/buildcores/buildcores-open-db">BuildCores OpenDB</a>, sob a
        licença <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/">CC BY-NC-SA 4.0</a>.
      </footer>
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
