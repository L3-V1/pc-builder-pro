import { motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { ROTULOS_PERFIL } from '../busca'
import { PERFIS } from '../catalogo/schema'
import type { Desafio } from '../desafios'
import type { Build } from '../motor'
import { calcularOrcamento, calcularPontuacao } from '../motor'
import { formatarReais } from './formatar'
import './TelaConclusao.css'

type Props = {
  desafio: Desafio
  build: Build
  onVerDesafios: () => void
  onFechar: () => void
}

const LIGA = { duration: 0.4, delay: 0.3 }

function Ventoinha({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <circle r="17" className="pc-ligando__aro" />
      <motion.g
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 0.9, delay: LIGA.delay, ease: 'linear', repeat: Infinity }}
      >
        {[0, 120, 240].map((angulo) => (
          <path
            key={angulo}
            d="M0 0 C 4 -6, 12 -10, 14 -4 C 10 -2, 5 0, 0 0 Z"
            transform={`rotate(${angulo})`}
            className="pc-ligando__pa"
          />
        ))}
      </motion.g>
      <circle r="3" className="pc-ligando__eixo" />
    </g>
  )
}

function PcLigando() {
  return (
    <svg className="pc-ligando" viewBox="0 0 120 150" aria-hidden="true" focusable="false">
      <motion.rect
        x="4"
        y="4"
        width="112"
        height="142"
        rx="10"
        className="pc-ligando__brilho"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.9, 0.5] }}
        transition={{ duration: 1.2, delay: LIGA.delay }}
      />
      <rect x="12" y="10" width="96" height="130" rx="6" className="pc-ligando__gabinete" />
      <rect x="22" y="22" width="56" height="106" rx="3" className="pc-ligando__vidro" />
      <Ventoinha cx={50} cy={52} />
      <Ventoinha cx={50} cy={98} />
      <rect x="86" y="22" width="12" height="106" rx="2" className="pc-ligando__frente" />
      <motion.circle
        cx="92"
        cy="32"
        r="3.5"
        className="pc-ligando__led"
        initial={{ opacity: 0.25 }}
        animate={{ opacity: 1 }}
        transition={LIGA}
      />
    </svg>
  )
}

export function TelaConclusao({ desafio, build, onVerDesafios, onFechar }: Props) {
  const dialogo = useRef<HTMLDivElement>(null)
  const orcamento = calcularOrcamento(build)
  const pontuacao = calcularPontuacao(build)

  useEffect(() => {
    dialogo.current?.focus()
  }, [])

  return (
    <div className="conclusao__fundo">
      <div
        ref={dialogo}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-conclusao"
        tabIndex={-1}
        className="conclusao"
        onKeyDown={(e) => {
          if (e.key === 'Escape') onFechar()
        }}
      >
        <PcLigando />
        <h2 id="titulo-conclusao">Desafio concluído</h2>
        <p className="conclusao__desafio">{desafio.titulo}</p>
        <dl className="conclusao__resumo">
          <div>
            <dt>Orçamento</dt>
            <dd>{formatarReais(orcamento.medio)}</dd>
          </div>
          {PERFIS.map((perfil) => {
            const p = pontuacao[perfil]
            return (
              <div key={perfil}>
                <dt>{ROTULOS_PERFIL[perfil]}</dt>
                <dd>{p.tipo === 'calculada' ? `${p.valor}/100` : 'Pendente'}</dd>
              </div>
            )
          })}
        </dl>
        <div className="conclusao__acoes">
          <button type="button" className="botao--primario" onClick={onVerDesafios}>
            Ver Desafios
          </button>
          <button type="button" onClick={onFechar}>
            Continuar montando
          </button>
        </div>
      </div>
    </div>
  )
}
