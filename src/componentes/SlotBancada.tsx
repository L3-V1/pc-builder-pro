import { useDroppable } from '@dnd-kit/core'
import { AnimatePresence, motion } from 'motion/react'
import type { EstadoSlot, Slot } from '../bancada'
import { AlcaArraste } from './AlcaArraste'
import { IlustracaoPeca } from './IlustracaoPeca'

type Props = {
  slot: Slot
  estado?: EstadoSlot
  desabilitado?: boolean
  arrastando?: boolean
  onDesencaixar: (pecaId: string) => void
  onEscolher?: (slot: Slot) => void
  recusado?: boolean
  onFimRecusa?: () => void
}

export function SlotBancada({
  slot,
  estado,
  desabilitado = false,
  arrastando = false,
  onDesencaixar,
  onEscolher,
  recusado = false,
  onFimRecusa,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot:${slot.id}`,
    data: { slot, rotulo: slot.rotulo, estado },
    disabled: desabilitado,
  })
  // O SATA aceita vários discos, então continua oferecendo mais um.
  const aceitaMais = slot.ocupantes.length === 0 || slot.id === 'sata'
  const classes = [
    'slot',
    `slot--${slot.categoria}`,
    estado && `slot--${estado}`,
    isOver && 'slot--sobre',
    slot.ocupantes.length > 0 && 'slot--ocupado',
    recusado && 'slot--recusado',
  ]
  return (
    <div
      ref={setNodeRef}
      role="group"
      aria-label={slot.rotulo}
      className={classes.filter(Boolean).join(' ')}
      data-slot={slot.id}
      data-estado={estado}
      onAnimationEnd={(e) => {
        if (recusado && e.target === e.currentTarget) onFimRecusa?.()
      }}
    >
      <span className="slot__rotulo fita">{slot.rotulo}</span>
      <AnimatePresence initial={false}>
        {slot.ocupantes.map((peca, i) => (
          <motion.div
            key={`${peca.id}-${i}`}
            className="slot__ocupante"
            initial={{ opacity: 0, scale: 0.6, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, y: 12, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', stiffness: 420, damping: 26 }}
          >
            <AlcaArraste
              id={`slot:${slot.id}:${i}`}
              peca={peca}
              origem={{ tipo: 'slot', slotId: slot.id }}
            />
            <IlustracaoPeca peca={peca} />
            <span className="slot__nome">{peca.nome}</span>
            <button
              type="button"
              className="slot__remover"
              aria-label={`Remover ${peca.nome}`}
              onClick={() => onDesencaixar(peca.id)}
            >
              ×
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
      {onEscolher && aceitaMais && (
        <button
          type="button"
          className="slot__escolher"
          aria-label={`Escolher Peça para ${slot.rotulo}`}
          disabled={arrastando}
          onClick={() => onEscolher(slot)}
        >
          Escolher
        </button>
      )}
    </div>
  )
}
