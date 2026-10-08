import { describe, expect, it } from 'vitest'
import type { PecaDe } from '../catalogo'
import type { Build } from './build'
import { calcularPontuacao, indiceDaPeca } from './pontuacao'

const faixaPreco = { min: 100, medio: 100, max: 100 }

type Indices = { jogos: number; produtividade: number }

function cpu(jogos: number, produtividade: number, integrado?: Indices): PecaDe<'cpu'> {
  return {
    id: `cpu-teste-${jogos}-${produtividade}`,
    nome: 'CPU de teste',
    marca: 'Teste',
    faixaPreco,
    categoria: 'cpu',
    socket: 'AM5',
    nucleos: 6,
    threads: 12,
    consumoW: 65,
    videoIntegrado: integrado !== undefined,
    coolerBox: true,
    indices: { jogos, produtividade },
    ...(integrado && { indiceVideoIntegrado: integrado }),
  }
}

function gpu(jogos: number, produtividade: number): PecaDe<'gpu'> {
  return {
    id: `gpu-teste-${jogos}-${produtividade}`,
    nome: 'GPU de teste',
    marca: 'Teste',
    faixaPreco,
    categoria: 'gpu',
    consumoW: 100,
    vramGB: 8,
    fonteRecomendadaW: 500,
    indices: { jogos, produtividade },
  }
}

function ram(capacidadeTotalGB: number): PecaDe<'ram'> {
  return {
    id: `ram-teste-${capacidadeTotalGB}gb`,
    nome: 'RAM de teste',
    marca: 'Teste',
    faixaPreco,
    categoria: 'ram',
    tipoRam: 'DDR5',
    capacidadeTotalGB,
    modulos: 2,
    frequenciaMHz: 6000,
  }
}

const build = (pecas: Partial<Build> = {}): Build => ({ ram: [], armazenamento: [], ...pecas })

describe('calcularPontuacao', () => {
  it('Build vazia ou sem CPU deixa os dois Perfis pendentes por falta de CPU', () => {
    const pendente = { tipo: 'pendente', motivo: 'sem-cpu' }
    expect(calcularPontuacao(build())).toEqual({ jogos: pendente, produtividade: pendente })
    expect(calcularPontuacao(build({ gpu: gpu(60, 60) }))).toEqual({
      jogos: pendente,
      produtividade: pendente,
    })
  })

  it('CPU sem vídeo integrado e sem GPU deixa os dois Perfis pendentes por falta de GPU', () => {
    const pendente = { tipo: 'pendente', motivo: 'sem-gpu' }
    expect(calcularPontuacao(build({ cpu: cpu(60, 60) }))).toEqual({
      jogos: pendente,
      produtividade: pendente,
    })
  })

  it('Build equilibrada: média ponderada por Perfil, sem Gargalos', () => {
    const r = calcularPontuacao(build({ cpu: cpu(60, 60), gpu: gpu(65, 50), ram: [ram(32)] }))
    expect(r.jogos).toEqual({
      tipo: 'calculada',
      valor: 64,
      base: 64,
      usaVideoIntegrado: false,
      gargalos: [],
    })
    expect(r.produtividade).toEqual({
      tipo: 'calculada',
      valor: 57,
      base: 57,
      usaVideoIntegrado: false,
      gargalos: [],
    })
  })

  it('CPU com vídeo integrado e sem GPU usa o índice do vídeo integrado, sem Gargalo de CPU', () => {
    // Diferença de 30 em Jogos geraria Gargalo de CPU se fosse uma GPU dedicada.
    const comIntegrado = cpu(10, 50, { jogos: 40, produtividade: 10 })
    const r = calcularPontuacao(build({ cpu: comIntegrado, ram: [ram(32)] }))
    expect(r.jogos).toEqual({
      tipo: 'calculada',
      valor: 31,
      base: 31,
      usaVideoIntegrado: true,
      gargalos: [],
    })
    expect(r.produtividade).toMatchObject({ tipo: 'calculada', valor: 38, usaVideoIntegrado: true })
  })

  it('Gargalo de CPU: diferença de 40 em Jogos tira 20%, só no Perfil Jogos', () => {
    const r = calcularPontuacao(build({ cpu: cpu(40, 60), gpu: gpu(80, 50), ram: [ram(32)] }))
    // base Jogos = 0,3·40 + 0,7·80 = 68; 68 × 0,8 = 54,4
    expect(r.jogos).toEqual({
      tipo: 'calculada',
      valor: 54,
      base: 68,
      usaVideoIntegrado: false,
      gargalos: [
        {
          tipo: 'cpu',
          perfil: 'jogos',
          penalidade: 0.2,
          pontosPerdidos: 14,
          mensagem: 'A CPU limita a GPU em jogos: −20%.',
        },
      ],
    })
    expect(r.produtividade).toMatchObject({ valor: 57, gargalos: [] })
  })

  it('diferença exatamente no limite não gera Gargalo; diferença enorme fica no teto de 30%', () => {
    const noLimite = calcularPontuacao(
      build({ cpu: cpu(40, 50), gpu: gpu(60, 50), ram: [ram(32)] }),
    )
    expect(noLimite.jogos).toMatchObject({ valor: 54, gargalos: [] })

    const enorme = calcularPontuacao(build({ cpu: cpu(0, 50), gpu: gpu(100, 50), ram: [ram(32)] }))
    // base 70 × 0,7 = 49
    expect(enorme.jogos).toMatchObject({
      valor: 49,
      base: 70,
      gargalos: [{ tipo: 'cpu', penalidade: 0.3, pontosPerdidos: 21 }],
    })
  })

  it('Gargalos de CPU e de RAM juntos se multiplicam', () => {
    const r = calcularPontuacao(build({ cpu: cpu(40, 60), gpu: gpu(80, 50), ram: [ram(12)] }))
    // 68 × 0,8 = 54,4; 54,4 × 0,85 = 46,24
    expect(r.jogos).toMatchObject({
      valor: 46,
      base: 68,
      gargalos: [
        { tipo: 'cpu', penalidade: 0.2, pontosPerdidos: 14 },
        { tipo: 'ram', penalidade: 0.15, pontosPerdidos: 8 },
      ],
    })
  })

  it('o valor é sempre um inteiro entre 0 e 100', () => {
    const extremos = [0, 37, 100]
    for (const c of extremos)
      for (const g of extremos)
        for (const kits of [[], [ram(8)], [ram(64)]]) {
          for (const pecas of [
            { cpu: cpu(c, c), gpu: gpu(g, g) },
            { cpu: cpu(c, c, { jogos: g, produtividade: g }) },
          ]) {
            for (const r of Object.values(calcularPontuacao(build({ ...pecas, ram: kits })))) {
              if (r.tipo !== 'calculada') throw new Error('esperava Pontuação calculada')
              expect(Number.isInteger(r.valor)).toBe(true)
              expect(r.valor).toBeGreaterThanOrEqual(0)
              expect(r.valor).toBeLessThanOrEqual(100)
            }
          }
        }
  })

  describe('Gargalo de RAM', () => {
    const comRam = (...kits: PecaDe<'ram'>[]) =>
      calcularPontuacao(build({ cpu: cpu(60, 60), gpu: gpu(65, 50), ram: kits }))

    it('8 GB ou menos é a faixa crítica e tira 30% nos dois Perfis', () => {
      const r = comRam(ram(8))
      expect(r.jogos).toMatchObject({
        valor: 44,
        gargalos: [
          {
            tipo: 'ram',
            perfil: 'jogos',
            penalidade: 0.3,
            pontosPerdidos: 20,
            mensagem: 'Pouca RAM para jogos (8 GB, o recomendado é 16 GB): −30%.',
          },
        ],
      })
      expect(r.produtividade).toMatchObject({
        valor: 40,
        gargalos: [
          {
            tipo: 'ram',
            perfil: 'produtividade',
            penalidade: 0.3,
            mensagem: 'Pouca RAM para produtividade (8 GB, o recomendado é 32 GB): −30%.',
          },
        ],
      })
    })

    it('16 GB: Jogos sem Gargalo e Produtividade abaixo do mínimo tira 15%', () => {
      const r = comRam(ram(16))
      expect(r.jogos).toMatchObject({ valor: 64, gargalos: [] })
      expect(r.produtividade).toMatchObject({
        valor: 48,
        gargalos: [{ tipo: 'ram', penalidade: 0.15, pontosPerdidos: 9 }],
      })
    })

    it('soma a capacidade de vários kits: 2 × 16 GB não gera Gargalo em Produtividade', () => {
      expect(comRam(ram(16), ram(16)).produtividade).toMatchObject({ valor: 57, gargalos: [] })
    })

    it('sem RAM tira 50% nos dois Perfis', () => {
      const r = comRam()
      const semRam = { tipo: 'ram', penalidade: 0.5, mensagem: 'Sem memória RAM: −50%.' }
      expect(r.jogos).toMatchObject({ valor: 32, gargalos: [semRam] })
      expect(r.produtividade).toMatchObject({ gargalos: [semRam] })
    })
  })
})

describe('indiceDaPeca', () => {
  it('devolve o índice do Perfil para CPU (sem o vídeo integrado) e GPU', () => {
    const comIntegrado = cpu(70, 40, { jogos: 2, produtividade: 3 })
    expect(indiceDaPeca(comIntegrado, 'jogos')).toBe(70)
    expect(indiceDaPeca(comIntegrado, 'produtividade')).toBe(40)
    expect(indiceDaPeca(gpu(55, 30), 'produtividade')).toBe(30)
  })

  it('devolve undefined para as outras Categorias', () => {
    expect(indiceDaPeca(ram(16), 'jogos')).toBeUndefined()
  })
})
