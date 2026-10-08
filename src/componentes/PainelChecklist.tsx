import { ROTULOS_CATEGORIA } from '../busca'
import type { Build } from '../motor'
import { calcularChecklist, verificarBuild } from '../motor'
import './Painel.css'

export function PainelChecklist({ build }: { build: Build }) {
  const { faltando, completa } = calcularChecklist(build)
  const alertas = verificarBuild(build)
  return (
    <section className="painel" aria-labelledby="titulo-checklist">
      <h2 id="titulo-checklist">Checklist</h2>
      {completa ? (
        <p className="painel__ok">Build completa</p>
      ) : (
        <>
          <p className="painel__suave">Faltam:</p>
          <ul aria-label="Categorias faltando">
            {faltando.map((categoria) => (
              <li key={categoria}>{ROTULOS_CATEGORIA[categoria]}</li>
            ))}
          </ul>
        </>
      )}
      <h3>Alertas</h3>
      {alertas.length === 0 ? (
        <p className="painel__suave">Nenhum alerta</p>
      ) : (
        <ul aria-label="Alertas">
          {alertas.map((alerta) => (
            <li key={`${alerta.regra}-${alerta.pecas.join('-')}`}>{alerta.mensagem}</li>
          ))}
        </ul>
      )}
    </section>
  )
}
