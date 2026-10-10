import { Marca } from './Marca'
import './TelaCarregamento.css'

type Props = { mensagem: string; onTentarDeNovo: () => void }

export function TelaErroCatalogo({ mensagem, onTentarDeNovo }: Props) {
  return (
    <main className="tela-catalogo">
      <div className="tela-catalogo__cartao">
        <Marca />
        <div className="tela-catalogo__erro" role="alert">
          <p className="tela-catalogo__titulo">Não foi possível carregar o Catálogo</p>
          <p>{mensagem}</p>
        </div>
        <div className="tela-catalogo__acoes">
          <button type="button" className="botao--primario" onClick={onTentarDeNovo}>
            Tentar de novo
          </button>
        </div>
      </div>
    </main>
  )
}
