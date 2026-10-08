import type { Active, Announcements, Over, ScreenReaderInstructions } from '@dnd-kit/core'

export const instrucoes: ScreenReaderInstructions = {
  draggable:
    'Para pegar a Peça, pressione Espaço ou Enter. Use as setas para passar pelos destinos, Espaço ou Enter para soltar e Esc para cancelar.',
}

const nome = (active: Active) => active.data.current?.peca?.nome ?? 'Peça'
const rotulo = (over: Over) => over.data.current?.rotulo ?? String(over.id)
const bloqueado = (over: Over) => over.data.current?.estado === 'bloqueado'

export const anuncios: Announcements = {
  onDragStart: ({ active }) => `${nome(active)} pega.`,
  onDragOver: ({ active, over }) => {
    if (!over) return `${nome(active)} fora de um destino.`
    const sufixo = bloqueado(over) ? ', incompatível' : ''
    return `${nome(active)} sobre ${rotulo(over)}${sufixo}.`
  },
  onDragEnd: ({ active, over }) => {
    if (!over) return `${nome(active)} solta fora de um destino.`
    if (bloqueado(over)) return `${nome(active)} não pode ser encaixada em ${rotulo(over)}.`
    return `${nome(active)} solta em ${rotulo(over)}.`
  },
  onDragCancel: ({ active }) => `Arraste de ${nome(active)} cancelado.`,
}
