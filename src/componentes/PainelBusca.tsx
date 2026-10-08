import { CATEGORIAS } from '../catalogo/schema'
import type { Peca } from '../catalogo'
import { marcasDisponiveis, ROTULOS_CATEGORIA } from '../busca'
import type { FiltrosBusca, Ordenacao } from '../busca'
import './PainelBusca.css'

type Props = {
  filtros: FiltrosBusca
  pecas: Peca[]
  onMudarFiltros: (filtros: FiltrosBusca) => void
}

function lerPreco(valor: string): number | undefined {
  if (valor.trim() === '') return undefined
  const n = Number(valor)
  return Number.isFinite(n) ? n : undefined
}

export function PainelBusca({ filtros, pecas, onMudarFiltros }: Props) {
  const marcas = marcasDisponiveis(pecas, filtros.categoria)
  const mudar = (parcial: Partial<FiltrosBusca>) => onMudarFiltros({ ...filtros, ...parcial })

  return (
    <section className="busca" aria-labelledby="titulo-busca">
      <h2 id="titulo-busca">Buscar Peças</h2>
      <label>
        Buscar
        <input
          type="search"
          value={filtros.texto}
          placeholder="Nome ou marca"
          onChange={(e) => mudar({ texto: e.target.value })}
        />
      </label>
      <div className="busca__linha">
        <label>
          Categoria
          <select
            value={filtros.categoria ?? ''}
            onChange={(e) =>
              mudar({
                categoria: CATEGORIAS.find((c) => c === e.target.value),
                marcas: [],
              })
            }
          >
            <option value="">Todas</option>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {ROTULOS_CATEGORIA[c]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Ordenar por
          <select
            value={filtros.ordenacao}
            onChange={(e) => mudar({ ordenacao: e.target.value as Ordenacao })}
          >
            <option value="relevancia">Relevância</option>
            <option value="preco-asc">Menor preço</option>
            <option value="preco-desc">Maior preço</option>
            <option value="desempenho-jogos">Desempenho em Jogos</option>
            <option value="desempenho-produtividade">Desempenho em Produtividade</option>
          </select>
        </label>
      </div>
      <div className="busca__linha">
        <label>
          Preço mínimo (R$)
          <input
            type="number"
            min="0"
            value={filtros.precoMin ?? ''}
            onChange={(e) => mudar({ precoMin: lerPreco(e.target.value) })}
          />
        </label>
        <label>
          Preço máximo (R$)
          <input
            type="number"
            min="0"
            value={filtros.precoMax ?? ''}
            onChange={(e) => mudar({ precoMax: lerPreco(e.target.value) })}
          />
        </label>
      </div>
      <fieldset>
        <legend>Marca</legend>
        <div className="busca__marcas">
          {marcas.map((marca) => (
            <label key={marca} className="busca__check">
              <input
                type="checkbox"
                checked={filtros.marcas.includes(marca)}
                onChange={(e) =>
                  mudar({
                    marcas: e.target.checked
                      ? [...filtros.marcas, marca]
                      : filtros.marcas.filter((m) => m !== marca),
                  })
                }
              />
              {marca}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="busca__check">
        <input
          type="checkbox"
          checked={filtros.soCompativeis}
          onChange={(e) => mudar({ soCompativeis: e.target.checked })}
        />
        Só compatíveis
      </label>
    </section>
  )
}
