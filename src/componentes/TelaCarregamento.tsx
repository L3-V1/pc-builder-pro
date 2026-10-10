import { Marca } from './Marca'
import './TelaCarregamento.css'

export function TelaCarregamento() {
  return (
    <main className="tela-catalogo">
      <div className="tela-catalogo__cartao">
        <Marca />
        <p className="tela-catalogo__mensagem" role="status">
          <span className="tela-catalogo__led" aria-hidden="true" />
          Carregando o Catálogo…
        </p>
      </div>
    </main>
  )
}
