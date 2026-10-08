import type { Peca } from '../catalogo'
import { variacaoVisual } from '../bancada'

const ESCALA = { p: 0.7, m: 0.85, g: 1 } as const
const CLARO = '#d9dde3'
const ESCURO = '#1b1f24'
const METAL = '#9aa3ad'

// Ventoinha com cubo e pás curvas; o número de pás dá a cara de "fan" mesmo pequena.
function Ventoinha({ cx, cy, r, pas = 7 }: { cx: number; cy: number; r: number; pas?: number }) {
  const pa = `M0 0 C ${r * 0.25} ${-r * 0.35} ${r * 0.75} ${-r * 0.45} ${r * 0.9} ${-r * 0.1} C ${r * 0.6} 0 ${r * 0.3} ${r * 0.05} 0 0 Z`
  return (
    <g className="ilustracao-peca__ventoinha" transform={`translate(${cx} ${cy})`}>
      <circle r={r} fill={ESCURO} />
      {Array.from({ length: pas }, (_, i) => (
        <path key={i} d={pa} fill="#4a525c" transform={`rotate(${(360 / pas) * i})`} />
      ))}
      <circle r={r * 0.28} fill={METAL} />
    </g>
  )
}

function ventoinhasDoRadiador(peca: Peca): number {
  const medida = /\b(120|240|280|360)\b/.exec(peca.nome)?.[1]
  return medida === '120' ? 1 : medida === '360' ? 3 : 2
}

function forma(peca: Peca, cor: string, forma?: string) {
  switch (peca.categoria) {
    case 'cpu':
      return (
        <>
          <rect x="18" y="18" width="64" height="64" rx="4" fill="#2f6b3a" />
          <rect x="24" y="24" width="52" height="52" rx="3" fill={METAL} />
          <rect x="30" y="30" width="40" height="40" rx="2" fill={cor} />
          <path d="M24 70 L30 76 L24 76 Z" fill="#e3b341" />
          {[28, 40, 52, 64, 72].flatMap((p) => [
            <rect key={`t${p}`} x={p} y="12" width="2" height="6" fill="#e3b341" />,
            <rect key={`b${p}`} x={p} y="82" width="2" height="6" fill="#e3b341" />,
          ])}
        </>
      )
    case 'cooler':
      if (forma === 'water') {
        const n = ventoinhasDoRadiador(peca)
        const largura = 84 / n
        return (
          <>
            <rect x="6" y="8" width="88" height="38" rx="3" fill={cor} />
            {Array.from({ length: n }, (_, i) => (
              <Ventoinha
                key={i}
                cx={8 + largura * (i + 0.5)}
                cy={27}
                r={Math.min(largura / 2 - 2, 16)}
              />
            ))}
            <path
              d="M40 46 C 40 58 46 60 46 64 M60 46 C 60 58 54 60 54 64"
              stroke={ESCURO}
              strokeWidth="3"
              fill="none"
            />
            <circle cx="50" cy="76" r="16" fill={cor} stroke={CLARO} strokeWidth="3" />
            <circle cx="50" cy="76" r="7" fill={CLARO} />
          </>
        )
      }
      return (
        <>
          {Array.from({ length: 9 }, (_, i) => (
            <rect key={i} x="14" y={10 + i * 8.6} width="72" height="4" rx="1" fill={METAL} />
          ))}
          <rect x="22" y="6" width="4" height="88" fill="#b87333" />
          <rect x="74" y="6" width="4" height="88" fill="#b87333" />
          <rect x="30" y="18" width="40" height="64" rx="4" fill={cor} />
          <Ventoinha cx={50} cy={50} r={17} />
        </>
      )
    case 'ram':
      return (
        <>
          <rect x="38" y="4" width="24" height="88" rx="2" fill="#2f6b3a" />
          {[12, 30, 48, 66].map((y) => (
            <rect key={y} x="42" y={y} width="16" height="12" fill={ESCURO} />
          ))}
          <path d="M36 2 H64 V92 H56 V60 H44 V92 H36 Z" fill={cor} opacity="0.92" />
          <rect x="38" y="94" width="24" height="3" fill="#e3b341" />
        </>
      )
    case 'gpu':
      return (
        <>
          <rect x="4" y="28" width="92" height="44" rx="4" fill={cor} />
          <rect x="4" y="72" width="60" height="5" fill="#e3b341" />
          <rect x="88" y="24" width="8" height="52" fill={METAL} />
          <Ventoinha cx={30} cy={50} r={15} />
          <Ventoinha cx={66} cy={50} r={15} />
        </>
      )
    case 'armazenamento':
      return forma === 'M.2' ? (
        <>
          <rect x="8" y="40" width="84" height="20" rx="2" fill="#2f6b3a" />
          <rect x="20" y="43" width="22" height="14" fill={ESCURO} />
          <rect x="48" y="43" width="22" height="14" fill={ESCURO} />
          <rect x="74" y="45" width="10" height="10" fill={cor} />
          <rect x="8" y="42" width="4" height="16" fill="#e3b341" />
          <circle cx="90" cy="50" r="2.5" fill={CLARO} />
        </>
      ) : (
        <>
          <rect x="20" y="12" width="60" height="76" rx="4" fill={cor} />
          <rect x="28" y="22" width="44" height="30" rx="2" fill={CLARO} />
          <rect x="32" y="80" width="36" height="6" fill={ESCURO} />
        </>
      )
    case 'fonte':
      return (
        <>
          <rect x="8" y="22" width="84" height="56" rx="4" fill={cor} />
          <Ventoinha cx={44} cy={50} r={22} pas={9} />
          <rect x="74" y="30" width="12" height="10" rx="1" fill={ESCURO} />
          <circle cx="80" cy="66" r="3" fill={CLARO} />
        </>
      )
    case 'gabinete':
      return (
        <>
          <rect x="14" y="4" width="72" height="92" rx="4" fill={cor} />
          <rect x="20" y="10" width="48" height="66" rx="2" fill="#8fb3d9" opacity="0.55" />
          <rect x="20" y="80" width="60" height="10" rx="1" fill={ESCURO} />
          {[18, 30, 42].map((y) => (
            <circle key={y} cx="76" cy={y} r="4" fill={ESCURO} />
          ))}
        </>
      )
    case 'placa-mae':
      return (
        <>
          <rect x="5" y="5" width="90" height="90" rx="3" fill={cor} />
          <rect x="8" y="10" width="16" height="30" rx="1" fill={METAL} />
          <rect x="28" y="12" width="34" height="8" rx="1" fill={METAL} />
          <rect x="34" y="24" width="22" height="22" fill={CLARO} />
          <rect x="66" y="12" width="5" height="40" fill={ESCURO} />
          <rect x="75" y="12" width="5" height="40" fill={ESCURO} />
          <rect x="12" y="58" width="64" height="6" fill={ESCURO} />
          <rect x="12" y="74" width="64" height="4" fill={ESCURO} />
          <rect x="66" y="66" width="14" height="14" rx="2" fill={METAL} />
          <rect x="30" y="50" width="22" height="4" fill="#2f6b3a" />
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
      data-forma={variante}
    >
      <g transform={`translate(${deslocamento} ${deslocamento}) scale(${escala})`}>
        {forma(peca, cor, variante)}
      </g>
    </svg>
  )
}
