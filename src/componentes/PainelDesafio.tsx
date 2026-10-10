import type { Desafio } from '../desafios'
import type { CriterioDesafio } from '../motor'
import './Painel.css'
import './PainelDesafio.css'

type Props = {
  desafio: Desafio
  avaliacao: { criterios: CriterioDesafio[]; cumprido: boolean }
  onLigar: () => void
  onVoltar: () => void
}

export function PainelDesafio({ desafio, avaliacao, onLigar, onVoltar }: Props) {
  const { criterios, cumprido } = avaliacao
  const cumpridos = criterios.filter((c) => c.cumprido).length
  return (
    <section className="painel painel-desafio" aria-label={`Desafio: ${desafio.titulo}`}>
      <p className="painel-desafio__rotulo fita chip">Desafio</p>
      <h2>{desafio.titulo}</h2>
      <p className="painel__suave">{desafio.descricao}</p>
      <p className="painel-desafio__contador">
        {cumpridos} de {criterios.length} critérios
      </p>
      <ul className="painel-desafio__criterios" aria-label="Critérios do Desafio">
        {criterios.map((c) => (
          <li
            key={c.id}
            className={`painel-desafio__criterio painel-desafio__criterio--${c.cumprido ? 'ok' : 'pendente'}`}
          >
            <strong>{c.cumprido ? 'Cumprido' : 'Pendente'}:</strong> {c.texto}
          </li>
        ))}
      </ul>
      <div className="painel-desafio__acoes">
        <button
          type="button"
          className="botao--sucesso"
          disabled={!cumprido}
          aria-describedby={cumprido ? undefined : 'explicacao-ligar'}
          onClick={onLigar}
        >
          Ligar o PC
        </button>
        <button type="button" onClick={onVoltar}>
          Voltar aos Desafios
        </button>
      </div>
      {!cumprido && (
        <p id="explicacao-ligar" className="painel__suave painel-desafio__explicacao">
          Cumpra todos os critérios para ligar o PC.
        </p>
      )}
    </section>
  )
}
