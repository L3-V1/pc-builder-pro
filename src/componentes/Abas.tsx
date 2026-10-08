import { useRef } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import './Abas.css'

export type Aba = 'livre' | 'desafios'

const ABAS: { id: Aba; rotulo: string }[] = [
  { id: 'livre', rotulo: 'Montagem livre' },
  { id: 'desafios', rotulo: 'Desafios' },
]

const ID_PAINEL = 'painel-abas'
const idAba = (aba: Aba) => `aba-${aba}`

type Props = { ativa: Aba; onSelecionar: (aba: Aba) => void; children: ReactNode }

export function Abas({ ativa, onSelecionar, children }: Props) {
  const lista = useRef<HTMLDivElement>(null)

  // Setas alternam entre as abas, como no padrão de abas do WAI-ARIA.
  const aoTeclar = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    const i = ABAS.findIndex((a) => a.id === ativa)
    const proxima = ABAS[(i + (e.key === 'ArrowRight' ? 1 : ABAS.length - 1)) % ABAS.length]
    onSelecionar(proxima.id)
    lista.current?.querySelector<HTMLElement>(`#${idAba(proxima.id)}`)?.focus()
  }

  return (
    <>
      <div ref={lista} role="tablist" aria-label="Telas" className="abas" onKeyDown={aoTeclar}>
        {ABAS.map(({ id, rotulo }) => (
          <button
            key={id}
            id={idAba(id)}
            type="button"
            role="tab"
            aria-selected={id === ativa}
            aria-controls={ID_PAINEL}
            tabIndex={id === ativa ? 0 : -1}
            className="abas__aba"
            onClick={() => onSelecionar(id)}
          >
            {rotulo}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={ID_PAINEL} aria-labelledby={idAba(ativa)}>
        {children}
      </div>
    </>
  )
}
