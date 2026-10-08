import { useDraggable } from '@dnd-kit/core'
import type { Peca } from '../catalogo'
import type { OrigemArraste } from '../bancada'

export type DadosArraste = { peca: Peca; origem: OrigemArraste }

type Props = { id: string; peca: Peca; origem: OrigemArraste }

export function AlcaArraste({ id, peca, origem }: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: { peca, origem } satisfies DadosArraste,
  })
  return (
    <button
      ref={setNodeRef}
      type="button"
      className={`alca-arraste${isDragging ? ' alca-arraste--arrastando' : ''}`}
      {...attributes}
      {...listeners}
      aria-label={`Arrastar ${peca.nome}`}
    >
      <svg viewBox="0 0 10 16" aria-hidden="true">
        {[3, 8, 13].flatMap((y) => [
          <circle key={`a${y}`} cx="3" cy={y} r="1.4" />,
          <circle key={`b${y}`} cx="7" cy={y} r="1.4" />,
        ])}
      </svg>
    </button>
  )
}
