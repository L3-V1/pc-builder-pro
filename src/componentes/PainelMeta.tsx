import { useState } from 'react'
import type { Build, SituacaoMeta } from '../motor'
import { calcularOrcamento, interpretarMeta, situacaoMeta } from '../motor'
import './Painel.css'
import './PainelMeta.css'
import { formatarReais } from './formatar'

const milhar = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })

type Props = { build: Build; meta?: number; onDefinirMeta: (valor?: number) => void }

function textoDaMeta(meta?: number): string {
  return meta === undefined ? '' : milhar.format(meta)
}

function textoSituacao(situacao: SituacaoMeta): string {
  if (situacao.tipo === 'acima') return `${formatarReais(situacao.excesso)} acima da Meta`
  if (situacao.falta === 0) return 'Exatamente na Meta'
  return `Faltam ${formatarReais(situacao.falta)} para a Meta`
}

export function PainelMeta({ build, meta, onDefinirMeta }: Props) {
  const [texto, setTexto] = useState(textoDaMeta(meta))
  const [invalido, setInvalido] = useState(false)
  const [metaAnterior, setMetaAnterior] = useState(meta)
  // A Meta pode mudar por fora (link aberto); o campo acompanha.
  if (meta !== metaAnterior) {
    setMetaAnterior(meta)
    setTexto(textoDaMeta(meta))
    setInvalido(false)
  }
  const orcamento = calcularOrcamento(build)
  const situacao = meta === undefined ? undefined : situacaoMeta(orcamento, meta)

  const confirmar = () => {
    const r = interpretarMeta(texto)
    setInvalido(!r.ok)
    if (r.ok && r.valor !== meta) onDefinirMeta(r.valor)
  }

  return (
    <section className="painel" aria-labelledby="titulo-meta">
      <h2 id="titulo-meta">Meta</h2>
      <label className="meta__campo">
        Meta de orçamento (R$)
        <input
          type="text"
          inputMode="numeric"
          value={texto}
          aria-invalid={invalido}
          aria-describedby={invalido ? 'erro-meta' : undefined}
          onChange={(e) => setTexto(e.target.value)}
          onBlur={confirmar}
          onKeyDown={(e) => {
            if (e.key === 'Enter') confirmar()
          }}
        />
      </label>
      {invalido && (
        <p id="erro-meta" className="painel__erro">
          Informe um valor inteiro em reais, de R$ 1 a R$ 1.000.000
        </p>
      )}
      {situacao && (
        <>
          <div
            role="meter"
            aria-label="Orçamento em relação à Meta"
            aria-valuemin={0}
            aria-valuenow={orcamento.medio}
            aria-valuemax={meta}
            aria-valuetext={textoSituacao(situacao)}
            className={`meta__barra${situacao.tipo === 'acima' ? ' meta__barra--acima' : ''}`}
          >
            <div
              className="meta__preenchimento"
              style={{ width: `${Math.min(situacao.percentual, 100)}%` }}
            />
          </div>
          <p className="meta__situacao">{textoSituacao(situacao)}</p>
          {situacao.tipo === 'dentro' && situacao.excessoNoMaximo !== undefined && (
            <p className="painel__suave">
              No preço máximo, pode passar em até {formatarReais(situacao.excessoNoMaximo)}
            </p>
          )}
        </>
      )}
    </section>
  )
}
