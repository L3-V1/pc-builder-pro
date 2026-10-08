import type { Slot } from '../bancada'
import { estadoDoSlot, slotsDaBancada } from '../bancada'
import type { Build } from '../motor'
import type { DadosArraste } from './AlcaArraste'
import './Bancada.css'
import { SlotBancada } from './SlotBancada'

type Props = { build: Build; ativa?: DadosArraste; onDesencaixar: (pecaId: string) => void }

const GRUPOS: { area: string; pertence: (s: Slot) => boolean }[] = [
  { area: 'gabinete', pertence: (s) => s.id === 'gabinete' },
  { area: 'placa', pertence: (s) => ['placa-mae', 'cpu', 'cooler'].includes(s.id) },
  { area: 'dimm', pertence: (s) => s.id.startsWith('dimm-') },
  { area: 'm2', pertence: (s) => s.id.startsWith('m2-') },
  { area: 'gpu', pertence: (s) => s.id === 'gpu' },
  { area: 'fonte', pertence: (s) => s.id === 'fonte' },
  { area: 'sata', pertence: (s) => s.id === 'sata' },
]

export function Bancada({ build, ativa, onDesencaixar }: Props) {
  const slots = slotsDaBancada(build)
  const renderizar = (slot: Slot) => {
    const estado = ativa ? estadoDoSlot(build, slot, ativa.peca) : undefined
    const desabilitado =
      ativa !== undefined && (estado === 'neutro' || ativa.origem.tipo === 'slot')
    return (
      <SlotBancada
        key={slot.id}
        slot={slot}
        estado={estado}
        desabilitado={desabilitado}
        onDesencaixar={onDesencaixar}
      />
    )
  }

  return (
    <section
      className={`bancada${ativa ? ' bancada--arrastando' : ''}`}
      aria-labelledby="titulo-bancada"
    >
      <h2 id="titulo-bancada">Bancada</h2>
      <div className="bancada__gabinete">
        <svg
          className="bancada__fundo"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <rect x="1" y="1" width="98" height="98" rx="3" />
          <rect className="bancada__placa-desenho" x="6" y="14" width="88" height="58" rx="2" />
        </svg>
        {GRUPOS.map(({ area, pertence }) => {
          const doGrupo = slots.filter(pertence)
          if (doGrupo.length === 0) return null
          return (
            <div key={area} className={`bancada__area bancada__area--${area}`}>
              {doGrupo.map(renderizar)}
            </div>
          )
        })}
      </div>
    </section>
  )
}
