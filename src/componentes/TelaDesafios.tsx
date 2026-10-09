import { ROTULOS_CATEGORIA, ROTULOS_PERFIL } from '../busca'
import { PERFIS } from '../catalogo/schema'
import type { Desafio } from '../desafios'
import { formatarReaisSemCentavos } from './formatar'
import './TelaDesafios.css'

type Props = {
  desafios: Desafio[]
  concluidos: string[]
  emAndamento: string[]
  onAbrir: (desafio: Desafio) => void
}

function resumo(desafio: Desafio): string[] {
  const pontuacoes = PERFIS.flatMap((perfil) => {
    const minimo = desafio.pontuacaoMinima?.[perfil]
    return minimo === undefined ? [] : [`${ROTULOS_PERFIL[perfil]} ≥ ${minimo}`]
  })
  return [
    `Até ${formatarReaisSemCentavos(desafio.orcamentoMaximo)}`,
    ...pontuacoes,
    ...desafio.categoriasExigidas.map((c) => `Exige ${ROTULOS_CATEGORIA[c]}`),
  ]
}

export function TelaDesafios({ desafios, concluidos, emAndamento, onAbrir }: Props) {
  return (
    <section className="tela-desafios" aria-labelledby="titulo-desafios">
      <h2 id="titulo-desafios">Desafios</h2>
      <p className="tela-desafios__intro">
        Cada Desafio tem uma Build própria. A Montagem livre não muda.
      </p>
      <ul className="tela-desafios__lista">
        {desafios.map((desafio) => {
          const idTitulo = `desafio-${desafio.id}`
          const concluido = concluidos.includes(desafio.id)
          return (
            <li key={desafio.id}>
              <article className="card-desafio" aria-labelledby={idTitulo}>
                <div className="card-desafio__topo">
                  <h3 id={idTitulo}>{desafio.titulo}</h3>
                  {concluido && <span className="card-desafio__selo chip">Concluído</span>}
                </div>
                <p className="card-desafio__descricao">{desafio.descricao}</p>
                <ul className="card-desafio__criterios" aria-label="Critérios">
                  {resumo(desafio).map((texto) => (
                    <li key={texto} className="chip">
                      {texto}
                    </li>
                  ))}
                </ul>
                <button type="button" className="botao--primario" onClick={() => onAbrir(desafio)}>
                  {emAndamento.includes(desafio.id) ? 'Continuar' : 'Iniciar'}
                </button>
              </article>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
