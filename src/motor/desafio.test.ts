import { describe, expect, it } from 'vitest'
import type { Desafio } from '../desafios/schema'
import { criarBuild } from './build'
import { verificarBuild } from './compatibilidade'
import { avaliarDesafio } from './desafio'
import { calcularOrcamento } from './orcamento'
import { montar, peca } from './teste-pecas'

const placaAm5 = peca('placa-mae-b650m-aorus-elite', 'placa-mae')
const cpuAm5 = peca('cpu-ryzen-5-7600', 'cpu')
const ramDdr5 = peca('ram-corsair-32gb-ddr5-6000', 'ram')
const rtx4060 = peca('gpu-rtx-4060', 'gpu')
const placa1700 = peca('placa-mae-b760m-ds3h-ddr4', 'placa-mae')
const nvme = peca('armazenamento-nvme-1tb', 'armazenamento')
const fonte = peca('fonte-cx650', 'fonte')
const gabinete = peca('gabinete-nzxt-h5-flow', 'gabinete')
// Vídeo integrado e cooler box: a Checklist fica completa sem GPU e sem cooler.
const semGpu = montar(placaAm5, cpuAm5, ramDdr5, nvme, fonte, gabinete)
// Jogos 41 = 0,3 × 76 + 0,7 × 26, sem Gargalos.
const gamer = montar(placaAm5, cpuAm5, ramDdr5, rtx4060)
const completo = (f = fonte) => montar(placaAm5, cpuAm5, ramDdr5, rtx4060, nvme, f, gabinete)
const exigente = (orcamentoMaximo: number) =>
  desafio({
    orcamentoMaximo,
    pontuacaoMinima: { jogos: 41, produtividade: 31 },
    categoriasExigidas: ['gpu'],
  })

const desafio = (campos: Partial<Desafio> = {}): Desafio => ({
  id: 'teste',
  titulo: 'Teste',
  descricao: 'Desafio de teste.',
  orcamentoMaximo: 4000,
  categoriasExigidas: [],
  ...campos,
})

const criterio = (r: ReturnType<typeof avaliarDesafio>, id: string) => {
  const c = r.criterios.find((c) => c.id === id)
  return c && { ...c, texto: c.texto.replace(/\s/g, ' ') }
}

describe('avaliarDesafio', () => {
  it('Build vazia não cumpre a Checklist nem o Desafio', () => {
    const r = avaliarDesafio(desafio(), criarBuild())
    expect(criterio(r, 'checklist')).toEqual({
      id: 'checklist',
      texto: 'Checklist completa',
      cumprido: false,
    })
    expect(r.cumprido).toBe(false)
  })

  it('Orçamento médio igual ao máximo cumpre e R$ 1 acima não cumpre', () => {
    const build = montar(placaAm5, cpuAm5)
    const medio = placaAm5.faixaPreco.medio + cpuAm5.faixaPreco.medio
    expect(
      criterio(avaliarDesafio(desafio({ orcamentoMaximo: medio }), build), 'orcamento'),
    ).toEqual({ id: 'orcamento', texto: 'Orçamento até R$ 2.150,00', cumprido: true })
    const acima = avaliarDesafio(desafio({ orcamentoMaximo: medio - 1 }), build)
    expect(criterio(acima, 'orcamento')?.cumprido).toBe(false)
  })

  it('Pontuação mínima de Jogos cumpre com valor igual ao mínimo e não cumpre abaixo', () => {
    const igual = avaliarDesafio(desafio({ pontuacaoMinima: { jogos: 41 } }), gamer)
    expect(criterio(igual, 'pontuacao-jogos')).toEqual({
      id: 'pontuacao-jogos',
      texto: 'Jogos: 41 de 41',
      cumprido: true,
    })
    const abaixo = avaliarDesafio(desafio({ pontuacaoMinima: { jogos: 42 } }), gamer)
    expect(criterio(abaixo, 'pontuacao-jogos')).toMatchObject({
      texto: 'Jogos: 41 de 42',
      cumprido: false,
    })
  })

  it.each([
    ['sem CPU', montar(placaAm5)],
    ['sem GPU', montar(placa1700, peca('cpu-core-i5-12400f', 'cpu'))],
  ])('Perfil pendente %s não cumpre, mesmo com mínimo 0', (_caso, build) => {
    const r = avaliarDesafio(desafio({ pontuacaoMinima: { jogos: 0 } }), build)
    expect(criterio(r, 'pontuacao-jogos')).toEqual({
      id: 'pontuacao-jogos',
      texto: 'Jogos: pendente, mínimo 0',
      cumprido: false,
    })
  })

  it('só os Perfis presentes em pontuacaoMinima geram critério', () => {
    const ids = (d: Desafio) => avaliarDesafio(d, gamer).criterios.map((c) => c.id)
    expect(ids(desafio())).toEqual(['checklist', 'orcamento'])
    const r = avaliarDesafio(desafio({ pontuacaoMinima: { produtividade: 20 } }), gamer)
    expect(r.criterios.map((c) => c.id)).toEqual([
      'checklist',
      'orcamento',
      'pontuacao-produtividade',
    ])
    expect(criterio(r, 'pontuacao-produtividade')).toMatchObject({
      texto: 'Produtividade: 31 de 20',
      cumprido: true,
    })
  })

  it('Categoria exigida GPU não é cumprida só com vídeo integrado, mesmo com Checklist completa', () => {
    const r = avaliarDesafio(desafio({ categoriasExigidas: ['gpu'] }), semGpu)
    expect(criterio(r, 'checklist')?.cumprido).toBe(true)
    expect(criterio(r, 'categoria-gpu')).toEqual({
      id: 'categoria-gpu',
      texto: 'Tem GPU',
      cumprido: false,
    })
    expect(r.cumprido).toBe(false)
  })

  it('com todos os critérios cumpridos o Desafio é cumprido, na ordem do Desafio', () => {
    const build = completo()
    const r = avaliarDesafio(exigente(calcularOrcamento(build).medio), build)
    expect(r.criterios.map((c) => c.id)).toEqual([
      'checklist',
      'orcamento',
      'pontuacao-jogos',
      'pontuacao-produtividade',
      'categoria-gpu',
    ])
    expect(r.criterios.every((c) => c.cumprido)).toBe(true)
    expect(r.cumprido).toBe(true)
  })

  it('alerta de fonte no limite não impede o cumprimento', () => {
    const build = completo(peca('fonte-mwe-450', 'fonte'))
    expect(verificarBuild(build).map((a) => a.regra)).toContain('fonte')
    expect(avaliarDesafio(exigente(calcularOrcamento(build).medio), build).cumprido).toBe(true)
  })
})
