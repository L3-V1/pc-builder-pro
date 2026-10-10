import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  pointerWithin,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { CollisionDetection, DragEndEvent, DragStartEvent, Over } from '@dnd-kit/core'
import { useMemo, useState } from 'react'
import type { Dispatch } from 'react'
import { acaoDoArraste } from '../bancada'
import type { DestinoArraste, Slot, SlotId } from '../bancada'
import { anuncios, instrucoes } from '../bancada/anuncios'
import { coordenadasPorDestino } from '../bancada/teclado'
import {
  avaliarPeca,
  criarBuscaLocal,
  FILTROS_INICIAIS,
  filtrosDoSlot,
  soCompativeis,
} from '../busca'
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
import { EstadoVazio } from './EstadoVazio'
import { formatarReaisSemCentavos } from './formatar'
import { IlustracaoPeca } from './IlustracaoPeca'
import { PainelBusca } from './PainelBusca'
import { PainelChecklist } from './PainelChecklist'
import { PainelDesafio } from './PainelDesafio'
import { PainelInferior } from './PainelInferior'
import { PainelMeta } from './PainelMeta'
import { PainelOrcamento } from './PainelOrcamento'
import { PainelPontuacao } from './PainelPontuacao'
import { useBuscaPecas } from './useBuscaPecas'
import { useTelaPequena } from './useTelaPequena'

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
  const [recusado, setRecusado] = useState<SlotId>()
  const telaPequena = useTelaPequena()
  // Aberto por um Slot, o painel se recolhe sozinho depois de "Adicionar à Build".
  const [painel, setPainel] = useState<'recolhido' | 'aberto' | 'aberto-pelo-slot'>('recolhido')
  const buscar = useMemo(() => criarBuscaLocal(catalogo.pecas), [catalogo.pecas])
  // "Só compatíveis" depende da Build, que a porta não conhece: filtra aqui, sem nova busca.
  const { soCompativeis: compativeis, ...pesquisa } = filtros
  const busca = useBuscaPecas(buscar, pesquisa)
  // Com erro, a lista anterior não vale mais: some junto com a contagem.
  const encontradas = busca.erro ? [] : busca.pecas
  const resultados = compativeis ? soCompativeis(build, encontradas) : encontradas
  const sensores = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    // Toque longo: deslizar rápido continua rolando a página.
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: coordenadasPorDestino }),
  )

  const escolher = (slot: Slot) => {
    setFiltros(filtrosDoSlot(slot))
    if (telaPequena) setPainel('aberto-pelo-slot')
    else document.getElementById('titulo-busca')?.focus()
  }

  const aoComecar = ({ active }: DragStartEvent) => {
    const dados = active.data.current as DadosArraste | undefined
    setAtiva(dados)
    // Libera a Bancada; o painel só se desloca, então a alça segue montada.
    if (dados?.origem.tipo === 'busca') setPainel('recolhido')
  }

  const aoSoltar = ({ active, over }: DragEndEvent) => {
    setAtiva(undefined)
    const dados = active.data.current as DadosArraste | undefined
    if (!dados) return
    const destino = destinoDe(over)
    if (destino?.tipo === 'slot' && over?.data.current?.estado === 'bloqueado') {
      setRecusado(destino.slot.id)
    }
    const acao = acaoDoArraste(dados.peca, dados.origem, destino)
    if (!acao) return
    despachar(acao)
    if (acao.tipo === 'guardar') {
      despachar({ tipo: 'avisar', texto: `${acao.peca.nome} foi para a Bandeja`, tom: 'info' })
    }
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
          <PainelInferior
            compacto={telaPequena}
            aberto={painel !== 'recolhido'}
            rotulo="Buscar Peças"
            onMudarAberto={(aberto) => setPainel(aberto ? 'aberto' : 'recolhido')}
          >
            <PainelBusca filtros={filtros} pecas={catalogo.pecas} onMudarFiltros={setFiltros} />
            <p aria-live="polite" className="app__contagem" data-testid="contagem-busca">
              {busca.buscando
                ? 'Buscando…'
                : `${resultados.length} ${resultados.length === 1 ? 'Peça encontrada' : 'Peças encontradas'}`}
            </p>
            <div
              aria-busy={busca.buscando}
              inert={busca.buscando}
              className={busca.buscando ? 'app__resultados--buscando' : undefined}
            >
              {resultados.length > 0 ? (
                <ul className="app__resultados">
                  {resultados.map((peca) => (
                    <li key={peca.id}>
                      <CardPeca
                        peca={peca}
                        avaliacao={avaliarPeca(build, peca)}
                        onAdicionar={(p) => {
                          despachar({ tipo: 'encaixar', peca: p })
                          if (painel === 'aberto-pelo-slot') setPainel('recolhido')
                        }}
                        onGuardar={(p) => {
                          // A restauração também guarda Peças; só o clique do usuário avisa.
                          despachar({ tipo: 'guardar', peca: p })
                          despachar({
                            tipo: 'avisar',
                            texto: `${p.nome} foi para a Bandeja`,
                            tom: 'info',
                          })
                        }}
                      />
                    </li>
                  ))}
                </ul>
              ) : busca.buscando ? (
                <EstadoVazio icone="busca" titulo="Buscando Peças…" />
              ) : busca.erro ? (
                // Sem botão de nova tentativa: a próxima mudança de filtro já busca de novo.
                <EstadoVazio icone="alerta" titulo="Não foi possível buscar">
                  Mude a busca ou os filtros para tentar de novo.
                </EstadoVazio>
              ) : (
                <EstadoVazio icone="busca" titulo="Nenhuma Peça encontrada">
                  Tente outro termo ou afrouxe os filtros.
                </EstadoVazio>
              )}
            </div>
          </PainelInferior>
        </div>
        <div className="app__bancada">
          <Bancada
            build={build}
            ativa={ativa}
            onDesencaixar={(pecaId) => despachar({ tipo: 'desencaixar', pecaId })}
            onEscolher={escolher}
            recusado={recusado}
            onFimRecusa={() => setRecusado(undefined)}
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
            onDefinirMeta={(valor) => {
              despachar({ tipo: 'definir-meta', valor })
              despachar({
                tipo: 'avisar',
                texto:
                  valor === undefined
                    ? 'Meta removida'
                    : `Meta definida em ${formatarReaisSemCentavos(valor)}`,
                tom: 'info',
              })
            }}
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
