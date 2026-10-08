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
import { useState } from 'react'
import type { Dispatch } from 'react'
import { acaoDoArraste } from '../bancada'
import type { DestinoArraste, Slot } from '../bancada'
import { anuncios, instrucoes } from '../bancada/anuncios'
import { coordenadasPorDestino } from '../bancada/teclado'
import { avaliarPeca, FILTROS_INICIAIS, filtrarPecas } from '../busca'
import type { FiltrosBusca } from '../busca'
import type { Catalogo } from '../catalogo'
import type { Desafio } from '../desafios'
import type { AcaoBuild, EstadoBuild } from '../estado/build'
import type { CriterioDesafio } from '../motor'
import type { DadosArraste } from './AlcaArraste'
import { Bancada } from './Bancada'
import { Bandeja } from './Bandeja'
import { BotaoCompartilhar } from './BotaoCompartilhar'
import { CardPeca } from './CardPeca'
import { IlustracaoPeca } from './IlustracaoPeca'
import { PainelBusca } from './PainelBusca'
import { PainelChecklist } from './PainelChecklist'
import { PainelDesafio } from './PainelDesafio'
import { PainelMeta } from './PainelMeta'
import { PainelOrcamento } from './PainelOrcamento'
import { PainelPontuacao } from './PainelPontuacao'

// Ponteiro: o destino sob o cursor. Teclado (sem ponteiro): o destino mais perto do centro.
const colisao: CollisionDetection = (args) => {
  const sobPonteiro = pointerWithin(args)
  return sobPonteiro.length > 0 ? sobPonteiro : closestCenter(args)
}

function destinoDe(over: Over | null): DestinoArraste | undefined {
  if (!over) return undefined
  if (over.id === 'bandeja') return { tipo: 'bandeja' }
  const slot = over.data.current?.slot as Slot | undefined
  return slot ? { tipo: 'slot', slot } : undefined
}

export type ModoMontagem =
  | { tipo: 'livre' }
  | {
      tipo: 'desafio'
      desafio: Desafio
      avaliacao: { criterios: CriterioDesafio[]; cumprido: boolean }
      onLigar: () => void
      onVoltar: () => void
    }

export function Montagem({
  estado,
  despachar,
  catalogo,
  modo,
}: {
  estado: EstadoBuild
  despachar: Dispatch<AcaoBuild>
  catalogo: Catalogo
  modo: ModoMontagem
}) {
  const { build, bandeja, meta, aviso } = estado
  const [filtros, setFiltros] = useState<FiltrosBusca>(FILTROS_INICIAIS)
  const [ativa, setAtiva] = useState<DadosArraste>()
  const resultados = filtrarPecas(catalogo.pecas, build, filtros)
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: coordenadasPorDestino }),
  )

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
    <DndContext
      sensors={sensores}
      collisionDetection={colisao}
      accessibility={{
        announcements: anuncios,
        screenReaderInstructions: instrucoes,
        // Fora do <main>, para não competir com o aviso da Montagem.
        container: document.body,
      }}
      onDragStart={aoComecar}
      onDragEnd={aoSoltar}
      onDragCancel={() => setAtiva(undefined)}
    >
      <p role="status" className={`app__aviso${aviso ? ` app__aviso--${aviso.tom}` : ''}`}>
        <span key={aviso?.id}>{aviso?.texto}</span>
      </p>
      <div className="app__colunas">
        <div className="app__busca">
          <PainelBusca filtros={filtros} pecas={catalogo.pecas} onMudarFiltros={setFiltros} />
          <p aria-live="polite">
            {resultados.length} {resultados.length === 1 ? 'Peça encontrada' : 'Peças encontradas'}
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
          {modo.tipo === 'desafio' && (
            <PainelDesafio
              desafio={modo.desafio}
              avaliacao={modo.avaliacao}
              onLigar={modo.onLigar}
              onVoltar={modo.onVoltar}
            />
          )}
          <PainelOrcamento build={build} dataReferencia={catalogo.dataReferencia} />
          <PainelMeta
            build={build}
            meta={meta}
            travada={modo.tipo === 'desafio'}
            onDefinirMeta={(valor) => despachar({ tipo: 'definir-meta', valor })}
          />
          {modo.tipo === 'livre' && (
            <BotaoCompartilhar
              build={build}
              meta={meta}
              onCopiado={() => despachar({ tipo: 'avisar', texto: 'Link copiado', tom: 'info' })}
            />
          )}
          <PainelPontuacao build={build} />
          <PainelChecklist build={build} />
          <Bandeja
            itens={bandeja}
            ativa={ativa}
            onDescartar={(chave) => despachar({ tipo: 'descartar', chave })}
          />
        </aside>
      </div>
      <DragOverlay>
        {ativa ? <IlustracaoPeca peca={ativa.peca} className="ilustracao-peca--overlay" /> : null}
      </DragOverlay>
    </DndContext>
  )
}
