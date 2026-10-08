import { PERFIS } from '../catalogo/schema'
import type { Perfil } from '../catalogo'
import type { Build, PontuacaoPerfil } from '../motor'
import { calcularPontuacao } from '../motor'
import './Painel.css'
import './PainelPontuacao.css'

type Calculada = Extract<PontuacaoPerfil, { tipo: 'calculada' }>

const ROTULOS_PERFIL: Record<Perfil, string> = { jogos: 'Jogos', produtividade: 'Produtividade' }

function PontuacaoDoPerfil({ perfil, pontuacao }: { perfil: Perfil; pontuacao: Calculada }) {
  const rotulo = ROTULOS_PERFIL[perfil]
  const { valor, gargalos } = pontuacao
  return (
    <div role="group" aria-labelledby={`titulo-perfil-${perfil}`} className="pontuacao__perfil">
      <h3 id={`titulo-perfil-${perfil}`}>{rotulo}</h3>
      <p className="pontuacao__valor">{valor}/100</p>
      <div
        role="meter"
        aria-label={`Pontuação em ${rotulo}`}
        aria-valuemin={0}
        aria-valuenow={valor}
        aria-valuemax={100}
        className="pontuacao__barra"
      >
        <div className="pontuacao__preenchimento" style={{ width: `${valor}%` }} />
      </div>
      {gargalos.length === 0 ? (
        <p className="painel__suave">Sem Gargalos</p>
      ) : (
        <ul aria-label={`Gargalos em ${rotulo}`} className="pontuacao__gargalos">
          {gargalos.map((g) => (
            <li key={g.tipo}>
              {g.mensagem} Perde {g.pontosPerdidos} {g.pontosPerdidos === 1 ? 'ponto' : 'pontos'}.
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function PainelPontuacao({ build }: { build: Build }) {
  const pontuacao = calcularPontuacao(build)
  // CPU e GPU valem para a Build inteira: os dois Perfis ficam pendentes ou calculados juntos.
  const calculadas = PERFIS.flatMap((perfil) => {
    const r = pontuacao[perfil]
    return r.tipo === 'calculada' ? [{ perfil, pontuacao: r }] : []
  })
  const pendente = pontuacao.jogos.tipo === 'pendente' ? pontuacao.jogos : undefined
  return (
    <section className="painel" aria-labelledby="titulo-pontuacao">
      <h2 id="titulo-pontuacao">Pontuação</h2>
      {pendente && (
        <p className="painel__suave">
          Encaixe uma {pendente.motivo === 'sem-cpu' ? 'CPU' : 'GPU'} para ver a Pontuação
        </p>
      )}
      {calculadas[0]?.pontuacao.usaVideoIntegrado && (
        <p className="painel__suave">Usando o vídeo integrado</p>
      )}
      {calculadas.length > 0 && (
        <div className="pontuacao__perfis">
          {calculadas.map((c) => (
            <PontuacaoDoPerfil key={c.perfil} {...c} />
          ))}
        </div>
      )}
    </section>
  )
}
