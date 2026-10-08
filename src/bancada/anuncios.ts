import type { Active, Announcements, Over, ScreenReaderInstructions } from '@dnd-kit/core'

export const instrucoes: ScreenReaderInstructions = {
  draggable:
    'Para pegar a Peça, pressione Espaço ou Enter. Use as setas para passar pelos destinos, Espaço ou Enter para soltar e Esc para cancelar.',
}

const nome = (active: Active) => active.data.current?.peca?.nome ?? 'Peça'
const rotulo = (over: Over) => over.data.current?.rotulo ?? String(over.id)

export const anuncios: Announcements = {
  onDragStart: ({ active }) => `${nome(active)} pega.`,
  onDragOver: ({ active, over }) =>
    over ? `${nome(active)} sobre ${rotulo(over)}.` : `${nome(active)} fora de um destino.`,
  onDragEnd: ({ active, over }) =>
    over
      ? `${nome(active)} solta em ${rotulo(over)}.`
      : `${nome(active)} solta fora de um destino.`,
  onDragCancel: ({ active }) => `Arraste de ${nome(active)} cancelado.`,
}
