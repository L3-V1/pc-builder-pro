import type { ReactNode } from 'react'
import './EstadoVazio.css'

type Icone = 'busca' | 'bandeja' | 'alerta'

// Traços simples em 24×24, no mesmo peso da marca.
const DESENHOS: Record<Icone, ReactNode> = {
  busca: (
    <>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="m15 15 5 5" />
    </>
  ),
  bandeja: (
    <>
      <path d="M3 13h5l1.5 2.5h5L16 13h5" />
      <path d="M5.5 6h13L21 13v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Z" />
    </>
  ),
  alerta: (
    <>
      <path d="M12 3.5 19 6v5.5c0 4.2-3 7.4-7 9-4-1.6-7-4.8-7-9V6Z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </>
  ),
}

type Props = { icone: Icone; titulo: string; children?: ReactNode; compacto?: boolean }

export function EstadoVazio({ icone, titulo, children, compacto = false }: Props) {
  return (
    <div className={`estado-vazio${compacto ? ' estado-vazio--compacto' : ''}`}>
      <svg className="estado-vazio__icone" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        {DESENHOS[icone]}
      </svg>
      <p className="estado-vazio__titulo">{titulo}</p>
      {children && <p className="estado-vazio__dica">{children}</p>}
    </div>
  )
}
