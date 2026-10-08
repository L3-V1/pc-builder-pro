import type { KeyboardCoordinateGetter } from '@dnd-kit/core'

export type Retangulo = { top: number; left: number; width: number; height: number }
export type Destino = { id: string; rect: Retangulo }

const centro = (r: Retangulo) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 })

export function proximoDestino(
  destinos: Destino[],
  atual: string | undefined,
  direcao: 1 | -1,
): Destino | undefined {
  if (destinos.length === 0) return undefined
  const ordem = [...destinos].sort((a, b) => a.rect.top - b.rect.top || a.rect.left - b.rect.left)
  const i = ordem.findIndex((d) => d.id === atual)
  if (i < 0) return direcao === 1 ? ordem[0] : ordem[ordem.length - 1]
  return ordem[(i + direcao + ordem.length) % ordem.length]
}

const DIRECOES: Record<string, 1 | -1> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
}

// Salta para o centro do próximo destino habilitado em vez de andar em pixels.
export const coordenadasPorDestino: KeyboardCoordinateGetter = (
  event,
  { context, currentCoordinates },
) => {
  const direcao = DIRECOES[event.code]
  const { collisionRect, droppableContainers, droppableRects, over } = context
  if (!direcao || !collisionRect) return undefined
  event.preventDefault()

  const destinos = droppableContainers.getEnabled().flatMap((c) => {
    const rect = droppableRects.get(c.id)
    return rect ? [{ id: String(c.id), rect }] : []
  })
  const alvo = proximoDestino(destinos, over ? String(over.id) : undefined, direcao)
  if (!alvo) return undefined

  const de = centro(collisionRect)
  const para = centro(alvo.rect)
  return { x: currentCoordinates.x + para.x - de.x, y: currentCoordinates.y + para.y - de.y }
}
