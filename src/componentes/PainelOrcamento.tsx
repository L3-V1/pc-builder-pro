import type { Build } from '../motor'
import { calcularOrcamento } from '../motor'
import './Painel.css'
import { formatarDataReferencia, formatarReais } from './formatar'

type Props = { build: Build; dataReferencia: string }

export function PainelOrcamento({ build, dataReferencia }: Props) {
  const { min, medio, max } = calcularOrcamento(build)
  return (
    <section className="painel" aria-labelledby="titulo-orcamento">
      <h2 id="titulo-orcamento">Orçamento</h2>
      <p className="orcamento__medio" data-testid="orcamento-medio">
        {formatarReais(medio)}
      </p>
      <p className="painel__suave" data-testid="orcamento-faixa">
        {formatarReais(min)} – {formatarReais(max)}
      </p>
      <p className="painel__suave">
        Preços de referência: {formatarDataReferencia(dataReferencia)}
      </p>
    </section>
  )
}
