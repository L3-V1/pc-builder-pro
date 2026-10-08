import type { Peca } from '../catalogo'
import { variacaoVisual } from '../bancada'

const ESCALA = { p: 0.7, m: 0.85, g: 1 } as const

function forma(peca: Peca, cor: string, forma?: string) {
  switch (peca.categoria) {
    case 'cpu':
      return (
        <>
          <rect x="20" y="20" width="60" height="60" rx="4" fill={cor} />
          <rect x="35" y="35" width="30" height="30" rx="2" fill="#d9dde3" />
        </>
      )
    case 'cooler':
      return forma === 'water' ? (
        <>
          <rect x="10" y="10" width="80" height="35" rx="4" fill={cor} />
          <circle cx="50" cy="70" r="18" fill={cor} stroke="#d9dde3" strokeWidth="3" />
        </>
      ) : (
        <>
          <rect x="15" y="10" width="70" height="80" rx="4" fill={cor} />
          {[25, 40, 55, 70].map((y) => (
            <rect key={y} x="20" y={y} width="60" height="4" fill="#d9dde3" />
          ))}
        </>
      )
    case 'ram':
      return (
        <>
          <rect x="40" y="5" width="20" height="90" rx="2" fill={cor} />
          {[15, 35, 55, 75].map((y) => (
            <rect key={y} x="44" y={y} width="12" height="10" fill="#1b1f24" />
          ))}
        </>
      )
    case 'gpu':
      return (
        <>
          <rect x="5" y="30" width="90" height="40" rx="4" fill={cor} />
          <circle cx="30" cy="50" r="13" fill="#1b1f24" />
          <circle cx="70" cy="50" r="13" fill="#1b1f24" />
        </>
      )
    case 'armazenamento':
      return forma === 'M.2' ? (
        <rect x="10" y="40" width="80" height="20" rx="2" fill={cor} />
      ) : (
        <rect x="20" y="15" width="60" height="70" rx="4" fill={cor} />
      )
    case 'fonte':
      return (
        <>
          <rect x="10" y="25" width="80" height="50" rx="4" fill={cor} />
          <circle cx="50" cy="50" r="18" fill="#1b1f24" />
        </>
      )
    case 'gabinete':
      return (
        <rect x="15" y="5" width="70" height="90" rx="4" fill="none" stroke={cor} strokeWidth="5" />
      )
    case 'placa-mae':
      return (
        <>
          <rect x="5" y="5" width="90" height="90" rx="3" fill={cor} />
          <rect x="30" y="15" width="22" height="22" fill="#d9dde3" />
          <rect x="62" y="12" width="5" height="40" fill="#1b1f24" />
          <rect x="72" y="12" width="5" height="40" fill="#1b1f24" />
          <rect x="15" y="62" width="60" height="6" fill="#1b1f24" />
        </>
      )
  }
}

export function IlustracaoPeca({ peca, className }: { peca: Peca; className?: string }) {
  const { cor, tamanho, forma: variante } = variacaoVisual(peca)
  const escala = ESCALA[tamanho]
  const deslocamento = (100 - 100 * escala) / 2
  return (
    <svg
      className={`ilustracao-peca${className ? ` ${className}` : ''}`}
      viewBox="0 0 100 100"
      aria-hidden="true"
      data-categoria={peca.categoria}
      data-tamanho={tamanho}
    >
      <g transform={`translate(${deslocamento} ${deslocamento}) scale(${escala})`}>
        {forma(peca, cor, variante)}
      </g>
    </svg>
  )
}
