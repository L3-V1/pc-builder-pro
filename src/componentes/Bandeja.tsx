import { useDroppable } from '@dnd-kit/core'
import { AnimatePresence, motion } from 'motion/react'
import type { ItemBandeja } from '../estado/build'
import { subtotalBandeja } from '../estado/build'
import { AlcaArraste } from './AlcaArraste'
import { EstadoVazio } from './EstadoVazio'
import type { DadosArraste } from './AlcaArraste'
import './Bandeja.css'
import { IlustracaoPeca } from './IlustracaoPeca'
import './Painel.css'
import { formatarReais } from './formatar'

type Props = {
  itens: ItemBandeja[]
  ativa?: DadosArraste
  onDescartar: (chave: string) => void
}

export function Bandeja({ itens, ativa, onDescartar }: Props) {
  const aceita = ativa !== undefined && ativa.origem.tipo !== 'bandeja'
  const { setNodeRef, isOver } = useDroppable({
    id: 'bandeja',
    data: { rotulo: 'Bandeja' },
    disabled: ativa !== undefined && !aceita,
  })
  const classes = ['painel', 'bandeja', aceita && 'bandeja--aceita', isOver && 'bandeja--sobre']

  return (
    <section
      ref={setNodeRef}
      className={classes.filter(Boolean).join(' ')}
      aria-labelledby="titulo-bandeja"
      data-testid="bandeja"
    >
      <h2 id="titulo-bandeja">Bandeja</h2>
      {itens.length === 0 ? (
        <EstadoVazio icone="bandeja" titulo="A Bandeja está vazia" compacto>
          Peças guardadas ou removidas da Build esperam aqui.
        </EstadoVazio>
      ) : (
        <ul className="bandeja__lista">
          <AnimatePresence initial={false}>
            {itens.map(({ chave, peca }) => (
              <motion.li
                key={chave}
                layout
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12, transition: { duration: 0.15 } }}
              >
                <AlcaArraste
                  id={`bandeja:${chave}`}
                  peca={peca}
                  origem={{ tipo: 'bandeja', chave }}
                />
                <IlustracaoPeca peca={peca} />
                <span>{peca.nome}</span>
                <small className="painel__suave">{formatarReais(peca.faixaPreco.medio)}</small>
                <button
                  type="button"
                  aria-label={`Descartar ${peca.nome}`}
                  onClick={() => onDescartar(chave)}
                >
                  Descartar
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
      <p className="bandeja__subtotal">
        Subtotal{' '}
        <strong data-testid="bandeja-subtotal">{formatarReais(subtotalBandeja(itens))}</strong>{' '}
        <span className="painel__suave">(fora do Orçamento)</span>
      </p>
    </section>
  )
}
