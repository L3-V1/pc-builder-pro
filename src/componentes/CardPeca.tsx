import type { Peca } from '../catalogo'
import { ROTULOS_CATEGORIA, specsPrincipais } from '../busca'
import type { AvaliacaoPeca } from '../busca'
import { AlcaArraste } from './AlcaArraste'
import './CardPeca.css'
import { formatarReais } from './formatar'

type Props = {
  peca: Peca
  avaliacao: AvaliacaoPeca
  onAdicionar: (peca: Peca) => void
  onGuardar: (peca: Peca) => void
}

function rotuloBotao(avaliacao: AvaliacaoPeca): string {
  if (avaliacao.tipo === 'na-build') return 'Na Build'
  if (avaliacao.tipo === 'livre' && avaliacao.substitui) return 'Trocar'
  return 'Adicionar à Build'
}

export function CardPeca({ peca, avaliacao, onAdicionar, onGuardar }: Props) {
  const { faixaPreco } = peca
  const bloqueada = avaliacao.tipo === 'bloqueada'
  const idsBloqueios = bloqueada
    ? avaliacao.bloqueios.map((_, i) => `${peca.id}-bloqueio-${i}`)
    : []
  const desloca = avaliacao.tipo === 'livre' ? avaliacao.desloca.length : 0

  return (
    <article className={`card-peca${bloqueada ? ' card-peca--bloqueada' : ''}`}>
      <header className="card-peca__topo">
        <AlcaArraste id={`busca:${peca.id}`} peca={peca} origem={{ tipo: 'busca' }} />
        <div>
          <h3>{peca.nome}</h3>
          <p className="card-peca__meta">
            {peca.marca} · {ROTULOS_CATEGORIA[peca.categoria]}
          </p>
        </div>
      </header>
      <ul className="card-peca__specs">
        {specsPrincipais(peca).map((spec) => (
          <li key={spec}>{spec}</li>
        ))}
      </ul>
      <p className="card-peca__preco">
        <strong>{formatarReais(faixaPreco.medio)}</strong>
        <span>
          {formatarReais(faixaPreco.min)} – {formatarReais(faixaPreco.max)}
        </span>
      </p>
      {bloqueada && (
        <div className="card-peca__bloqueios">
          <span className="card-peca__selo">Incompatível</span>
          {avaliacao.bloqueios.map((b, i) => (
            <p key={idsBloqueios[i]} id={idsBloqueios[i]}>
              {b.mensagem}
            </p>
          ))}
        </div>
      )}
      {desloca > 0 && (
        <p className="card-peca__aviso">
          Removerá {desloca} {desloca === 1 ? 'Peça' : 'Peças'} da Build
        </p>
      )}
      <div className="card-peca__acoes">
        <button
          type="button"
          disabled={avaliacao.tipo === 'bloqueada' || avaliacao.tipo === 'na-build'}
          aria-describedby={idsBloqueios.length > 0 ? idsBloqueios.join(' ') : undefined}
          onClick={() => onAdicionar(peca)}
        >
          {rotuloBotao(avaliacao)}
        </button>
        <button type="button" onClick={() => onGuardar(peca)}>
          Para a Bandeja
        </button>
      </div>
    </article>
  )
}
