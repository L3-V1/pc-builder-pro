// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { avaliarPeca } from '../busca'
import { criarBuild } from '../motor'
import { montar, peca } from '../motor/teste-pecas'
import { CardPeca } from './CardPeca'

const cpu = peca('cpu-ryzen-5-7600', 'cpu')
const placaAm5 = peca('placa-mae-b650m-aorus-elite', 'placa-mae')
const livre = avaliarPeca(criarBuild(), cpu)

describe('CardPeca', () => {
  it('mostra nome, marca, specs, preço médio e faixa mín–máx formatados', () => {
    render(<CardPeca peca={cpu} avaliacao={livre} onAdicionar={() => {}} onGuardar={() => {}} />)
    expect(screen.getByText('Ryzen 5 7600')).toBeInTheDocument()
    expect(screen.getByText(/AMD/)).toBeInTheDocument()
    expect(screen.getByText('6 núcleos / 12 threads')).toBeInTheDocument()
    expect(screen.getByText(/R\$\s1\.100,00/)).toBeInTheDocument()
    expect(screen.getByText(/R\$\s990,00\s*–\s*R\$\s1\.232,00/)).toBeInTheDocument()
  })

  it('Peça bloqueada mostra selo, mensagem do motor e botão desabilitado descrito por ela', () => {
    const bloqueada = avaliarPeca(montar(placaAm5), peca('cpu-core-i5-12400', 'cpu'))
    if (bloqueada.tipo !== 'bloqueada') throw new Error('esperava bloqueada')
    render(
      <CardPeca
        peca={peca('cpu-core-i5-12400', 'cpu')}
        avaliacao={bloqueada}
        onAdicionar={() => {}}
        onGuardar={() => {}}
      />,
    )
    expect(screen.getByText('Incompatível')).toBeInTheDocument()
    const mensagem = screen.getByText(bloqueada.bloqueios[0].mensagem)
    const botao = screen.getByRole('button', { name: 'Adicionar à Build' })
    expect(botao).toBeDisabled()
    expect(botao.getAttribute('aria-describedby')).toContain(mensagem.id)
  })

  it('Peça livre: clicar em Adicionar chama onAdicionar com a Peça', async () => {
    const onAdicionar = vi.fn()
    render(<CardPeca peca={cpu} avaliacao={livre} onAdicionar={onAdicionar} onGuardar={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar à Build' }))
    expect(onAdicionar).toHaveBeenCalledWith(cpu)
  })

  it('substituição mostra "Trocar"', () => {
    const outra = peca('cpu-ryzen-7-7800x3d', 'cpu')
    const avaliacao = avaliarPeca(montar(placaAm5, cpu), outra)
    render(
      <CardPeca peca={outra} avaliacao={avaliacao} onAdicionar={() => {}} onGuardar={() => {}} />,
    )
    expect(screen.getByRole('button', { name: 'Trocar' })).toBeEnabled()
  })

  it('na-build mostra "Na Build" desabilitado', () => {
    const avaliacao = avaliarPeca(montar(placaAm5, cpu), cpu)
    render(
      <CardPeca peca={cpu} avaliacao={avaliacao} onAdicionar={() => {}} onGuardar={() => {}} />,
    )
    expect(screen.getByRole('button', { name: 'Na Build' })).toBeDisabled()
  })

  it('placa que desloca mostra "Removerá N Peças da Build"', () => {
    const ram = peca('ram-corsair-32gb-ddr5-6000', 'ram')
    const ddr4 = peca('placa-mae-b760m-ds3h-ddr4', 'placa-mae')
    const avaliacao = avaliarPeca(montar(placaAm5, cpu, ram), ddr4)
    render(
      <CardPeca peca={ddr4} avaliacao={avaliacao} onAdicionar={() => {}} onGuardar={() => {}} />,
    )
    expect(screen.getByText('Removerá 2 Peças da Build')).toBeInTheDocument()
  })

  it('"Para a Bandeja" chama onGuardar, e a alça "Arrastar {nome}" existe', async () => {
    const onGuardar = vi.fn()
    render(<CardPeca peca={cpu} avaliacao={livre} onAdicionar={() => {}} onGuardar={onGuardar} />)
    await userEvent.click(screen.getByRole('button', { name: 'Para a Bandeja' }))
    expect(onGuardar).toHaveBeenCalledWith(cpu)
    expect(screen.getByRole('button', { name: 'Arrastar Ryzen 5 7600' })).toBeInTheDocument()
  })
})
