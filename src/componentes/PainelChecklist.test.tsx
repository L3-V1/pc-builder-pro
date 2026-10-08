// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { criarBuild } from '../motor'
import { montar, peca } from '../motor/teste-pecas'
import { PainelChecklist } from './PainelChecklist'

describe('PainelChecklist', () => {
  it('lista as Categorias faltando com rótulos em pt-BR e "Nenhum alerta"', () => {
    render(<PainelChecklist build={criarBuild()} />)
    expect(screen.getByText('Placa-mãe')).toBeInTheDocument()
    expect(screen.getByText('Memória RAM')).toBeInTheDocument()
    expect(screen.queryByText('Build completa')).not.toBeInTheDocument()
    expect(screen.getByText('Nenhum alerta')).toBeInTheDocument()
  })

  it('mostra "Build completa" quando completa', () => {
    const build = montar(
      peca('placa-mae-b650m-aorus-elite', 'placa-mae'),
      peca('cpu-ryzen-5-7600', 'cpu'),
      peca('ram-corsair-32gb-ddr5-6000', 'ram'),
      peca('armazenamento-nvme-1tb', 'armazenamento'),
      peca('gpu-rtx-4060', 'gpu'),
      peca('fonte-rm750e', 'fonte'),
      peca('gabinete-nzxt-h5-flow', 'gabinete'),
    )
    render(<PainelChecklist build={build} />)
    expect(screen.getByText('Build completa')).toBeInTheDocument()
  })

  it('lista os Alertas, como fonte fraca', () => {
    const build = montar(
      peca('placa-mae-b650m-aorus-elite', 'placa-mae'),
      peca('cpu-ryzen-7-7800x3d', 'cpu'),
      peca('gpu-rtx-4070-super', 'gpu'),
      peca('fonte-mwe-450', 'fonte'),
    )
    render(<PainelChecklist build={build} />)
    expect(screen.queryByText('Nenhum alerta')).not.toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Alertas' })).toBeInTheDocument()
  })
})
