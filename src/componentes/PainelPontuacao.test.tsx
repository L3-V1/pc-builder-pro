// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { calcularPontuacao, criarBuild } from '../motor'
import type { Build } from '../motor'
import { montar, peca } from '../motor/teste-pecas'
import { PainelPontuacao } from './PainelPontuacao'

const placaAm4 = peca('placa-mae-a520m-k', 'placa-mae')
const placaAm5 = peca('placa-mae-b650m-aorus-elite', 'placa-mae')
const ram32 = peca('ram-corsair-32gb-ddr5-6000', 'ram')

function valorDe(build: Build, perfil: 'jogos' | 'produtividade'): number {
  const r = calcularPontuacao(build)[perfil]
  if (r.tipo !== 'calculada') throw new Error('esperava Pontuação calculada')
  return r.valor
}

describe('PainelPontuacao', () => {
  it('com a Build vazia pede uma CPU e não mostra medidor', () => {
    render(<PainelPontuacao build={criarBuild()} />)
    expect(screen.getByText('Encaixe uma CPU para ver a Pontuação')).toBeInTheDocument()
    expect(screen.queryByRole('meter')).not.toBeInTheDocument()
  })

  it('com CPU sem vídeo integrado e sem GPU pede uma GPU', () => {
    render(<PainelPontuacao build={montar(placaAm4, peca('cpu-ryzen-5-5600', 'cpu'))} />)
    expect(screen.getByText('Encaixe uma GPU para ver a Pontuação')).toBeInTheDocument()
    expect(screen.queryByRole('meter')).not.toBeInTheDocument()
  })

  it('com uma Build calculada mostra os dois Perfis com valor, medidor e "Sem Gargalos"', () => {
    const build = montar(
      placaAm5,
      peca('cpu-ryzen-5-7600', 'cpu'),
      ram32,
      peca('gpu-rtx-4060', 'gpu'),
    )
    render(<PainelPontuacao build={build} />)
    for (const [perfil, rotulo] of [
      ['jogos', 'Jogos'],
      ['produtividade', 'Produtividade'],
    ] as const) {
      const grupo = within(screen.getByRole('group', { name: rotulo }))
      const valor = valorDe(build, perfil)
      expect(grupo.getByText(`${valor}/100`)).toBeInTheDocument()
      const medidor = grupo.getByRole('meter', { name: `Pontuação em ${rotulo}` })
      expect(medidor).toHaveAttribute('aria-valuenow', String(valor))
      expect(medidor).toHaveAttribute('aria-valuemax', '100')
      expect(grupo.getByText('Sem Gargalos')).toBeInTheDocument()
    }
    expect(screen.queryByText(/Encaixe uma/)).not.toBeInTheDocument()
    expect(screen.queryByText('Usando o vídeo integrado')).not.toBeInTheDocument()
  })

  it('sem GPU e com CPU de vídeo integrado avisa que usa o vídeo integrado', () => {
    render(<PainelPontuacao build={montar(placaAm5, peca('cpu-ryzen-5-7600', 'cpu'), ram32)} />)
    expect(screen.getByText('Usando o vídeo integrado')).toBeInTheDocument()
    expect(screen.getAllByRole('meter')).toHaveLength(2)
  })

  it('com Gargalo lista a mensagem e os pontos perdidos só no Perfil afetado', () => {
    const build = montar(
      placaAm5,
      peca('cpu-ryzen-5-7600', 'cpu'),
      peca('ram-kingston-16gb-ddr5-5200', 'ram'),
      peca('gpu-rtx-4060', 'gpu'),
    )
    render(<PainelPontuacao build={build} />)
    const produtividade = calcularPontuacao(build).produtividade
    if (produtividade.tipo !== 'calculada') throw new Error('esperava Pontuação calculada')
    const [gargalo] = produtividade.gargalos

    const grupo = within(screen.getByRole('group', { name: 'Produtividade' }))
    const itens = within(
      grupo.getByRole('list', { name: 'Gargalos em Produtividade' }),
    ).getAllByRole('listitem')
    expect(itens).toHaveLength(1)
    expect(itens[0]).toHaveTextContent(
      'Pouca RAM para produtividade (16 GB, o recomendado é 32 GB): −15%.',
    )
    expect(itens[0]).toHaveTextContent(`Perde ${gargalo.pontosPerdidos} pontos.`)

    const jogos = within(screen.getByRole('group', { name: 'Jogos' }))
    expect(jogos.getByText('Sem Gargalos')).toBeInTheDocument()
    expect(jogos.queryByRole('list')).not.toBeInTheDocument()
  })
})
