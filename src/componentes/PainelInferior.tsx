import { useId, useRef } from 'react'
import type { ReactNode } from 'react'
import './PainelInferior.css'

type Props = {
  compacto: boolean
  aberto: boolean
  rotulo: string
  onMudarAberto: (aberto: boolean) => void
  children: ReactNode
}

// Não modal: a Bancada continua alvo do arraste. Recolhido, o conteúdo segue montado
// (só deslocado), para que uma alça arrastada não seja desmontada no meio do arraste.
export function PainelInferior({ compacto, aberto, rotulo, onMudarAberto, children }: Props) {
  const id = useId()
  const barra = useRef<HTMLButtonElement>(null)
  if (!compacto) return <>{children}</>

  const recolher = () => {
    onMudarAberto(false)
    barra.current?.focus()
  }

  return (
    <div
      className={`painel-inferior${aberto ? ' painel-inferior--aberto' : ''}`}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && aberto) recolher()
      }}
    >
      <button
        ref={barra}
        type="button"
        className="painel-inferior__barra"
        aria-expanded={aberto}
        aria-controls={id}
        onClick={() => onMudarAberto(!aberto)}
      >
        {rotulo}
      </button>
      <div id={id} className="painel-inferior__conteudo" inert={!aberto}>
        {children}
      </div>
    </div>
  )
}
