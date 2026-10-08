import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { CollisionDetection, DragEndEvent, DragStartEvent, Over } from '@dnd-kit/core'
import { MotionConfig } from 'motion/react'
import { useEffect, useReducer, useState } from 'react'
import './App.css'
import { acaoDoArraste } from './bancada'
import type { DestinoArraste, Slot } from './bancada'
import { anuncios, instrucoes } from './bancada/anuncios'
import { coordenadasPorDestino } from './bancada/teclado'
import { avaliarPeca, FILTROS_INICIAIS, filtrarPecas } from './busca'
import type { FiltrosBusca } from './busca'
import { carregarCatalogo } from './catalogo'
import type { DadosArraste } from './componentes/AlcaArraste'
import { Bancada } from './componentes/Bancada'
import { BotaoCompartilhar } from './componentes/BotaoCompartilhar'
import { Bandeja } from './componentes/Bandeja'
import { CardPeca } from './componentes/CardPeca'
import { IlustracaoPeca } from './componentes/IlustracaoPeca'
import { PainelBusca } from './componentes/PainelBusca'
import { PainelChecklist } from './componentes/PainelChecklist'
import { PainelMeta } from './componentes/PainelMeta'
import { PainelOrcamento } from './componentes/PainelOrcamento'
import { reduzirBuild } from './estado/build'
import {
  acaoDoLink,
  decodificarLink,
  iniciarEstado,
  lerEstadoSalvo,
  salvarEstado,
} from './persistencia'

// Ponteiro: o destino sob o cursor. Teclado (sem ponteiro): o destino mais perto do centro.
const colisao: CollisionDetection = (args) => {
  const sobPonteiro = pointerWithin(args)
  return sobPonteiro.length > 0 ? sobPonteiro : closestCenter(args)
}

// Tira o link da URL para que recarregar a página não o aplique de novo.
function limparHash() {
  history.replaceState(null, '', location.pathname + location.search)
}

function destinoDe(over: Over | null): DestinoArraste | undefined {
  if (!over) return undefined
  if (over.id === 'bandeja') return { tipo: 'bandeja' }
  const slot = over.data.current?.slot as Slot | undefined
  return slot ? { tipo: 'slot', slot } : undefined
}

export default function App() {
  const catalogo = carregarCatalogo()
  const [estado, despachar] = useReducer(reduzirBuild, undefined, () =>
    iniciarEstado({ salvo: lerEstadoSalvo(localStorage), hash: location.hash, catalogo }),
  )
  const { build, bandeja, meta, aviso } = estado
  const [filtros, setFiltros] = useState<FiltrosBusca>(FILTROS_INICIAIS)
  const [ativa, setAtiva] = useState<DadosArraste>()
  const resultados = filtrarPecas(catalogo.pecas, build, filtros)
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: coordenadasPorDestino }),
  )

  useEffect(() => {
    salvarEstado(localStorage, estado)
  }, [estado])

  useEffect(() => {
    // O link da carga inicial já foi aplicado por iniciarEstado.
    if (decodificarLink(location.hash)) limparHash()
    const aoMudarHash = () => {
      const acao = acaoDoLink(location.hash, catalogo)
      if (!acao) return
      despachar(acao)
      limparHash()
    }
    window.addEventListener('hashchange', aoMudarHash)
    return () => window.removeEventListener('hashchange', aoMudarHash)
  }, [catalogo])

  const aoComecar = ({ active }: DragStartEvent) => {
    setAtiva(active.data.current as DadosArraste | undefined)
  }
  const aoSoltar = ({ active, over }: DragEndEvent) => {
    setAtiva(undefined)
    const dados = active.data.current as DadosArraste | undefined
    if (!dados) return
    const acao = acaoDoArraste(dados.peca, dados.origem, destinoDe(over))
    if (acao) despachar(acao)
  }

  return (
    <MotionConfig reducedMotion="user">
      <DndContext
        sensors={sensores}
        collisionDetection={colisao}
        accessibility={{ announcements: anuncios, screenReaderInstructions: instrucoes }}
        onDragStart={aoComecar}
        onDragEnd={aoSoltar}
        onDragCancel={() => setAtiva(undefined)}
      >
        <main className="app">
          <h1>PC Builder Pro</h1>
          <p role="status" className={`app__aviso${aviso ? ` app__aviso--${aviso.tom}` : ''}`}>
            <span key={aviso?.id}>{aviso?.texto}</span>
          </p>
          <div className="app__colunas">
            <div className="app__busca">
              <PainelBusca filtros={filtros} pecas={catalogo.pecas} onMudarFiltros={setFiltros} />
              <p aria-live="polite">
                {resultados.length}{' '}
                {resultados.length === 1 ? 'Peça encontrada' : 'Peças encontradas'}
              </p>
              {resultados.length === 0 ? (
                <p className="app__vazio">Nenhuma Peça encontrada</p>
              ) : (
                <ul className="app__resultados">
                  {resultados.map((peca) => (
                    <li key={peca.id}>
                      <CardPeca
                        peca={peca}
                        avaliacao={avaliarPeca(build, peca)}
                        onAdicionar={(p) => despachar({ tipo: 'encaixar', peca: p })}
                        onGuardar={(p) => despachar({ tipo: 'guardar', peca: p })}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="app__bancada">
              <Bancada
                build={build}
                ativa={ativa}
                onDesencaixar={(pecaId) => despachar({ tipo: 'desencaixar', pecaId })}
              />
            </div>
            <aside className="app__lateral">
              <PainelOrcamento build={build} dataReferencia={catalogo.dataReferencia} />
              <PainelMeta
                build={build}
                meta={meta}
                onDefinirMeta={(valor) => despachar({ tipo: 'definir-meta', valor })}
              />
              <BotaoCompartilhar
                build={build}
                meta={meta}
                onCopiado={() => despachar({ tipo: 'avisar', texto: 'Link copiado', tom: 'info' })}
              />
              <PainelChecklist build={build} />
              <Bandeja
                itens={bandeja}
                ativa={ativa}
                onDescartar={(chave) => despachar({ tipo: 'descartar', chave })}
              />
            </aside>
          </div>
        </main>
        <DragOverlay>
          {ativa ? <IlustracaoPeca peca={ativa.peca} className="ilustracao-peca--overlay" /> : null}
        </DragOverlay>
      </DndContext>
    </MotionConfig>
  )
}
