import { describe, expect, it } from 'vitest'
import { validarCatalogo } from './validar'

const faixaPreco = { min: 800, medio: 900, max: 1000 }

const cpu = {
  id: 'cpu-ryzen-5-7600',
  nome: 'Ryzen 5 7600',
  marca: 'AMD',
  faixaPreco,
  categoria: 'cpu',
  socket: 'AM5',
  nucleos: 6,
  threads: 12,
  consumoW: 65,
  videoIntegrado: true,
  coolerBox: true,
  indices: { jogos: 76, produtividade: 36 },
  indiceVideoIntegrado: { jogos: 2, produtividade: 2 },
}

const gpu = {
  id: 'gpu-rtx-4060',
  nome: 'RTX 4060',
  marca: 'Nvidia',
  faixaPreco,
  categoria: 'gpu',
  consumoW: 115,
  vramGB: 8,
  fonteRecomendadaW: 550,
  indices: { jogos: 26, produtividade: 20 },
}

const catalogo = (...pecas: unknown[]) => ({ dataReferencia: '2026-10', pecas })

describe('validarCatalogo', () => {
  it('retorna ok com o catálogo tipado para uma entrada válida', () => {
    const resultado = validarCatalogo(catalogo(cpu, gpu))
    expect(resultado.ok).toBe(true)
    if (resultado.ok) expect(resultado.catalogo.pecas).toHaveLength(2)
  })

  it('aponta o ID quando dois IDs se repetem, mesmo em categorias diferentes', () => {
    const resultado = validarCatalogo(catalogo(cpu, { ...gpu, id: cpu.id }))
    expect(resultado.ok).toBe(false)
    if (!resultado.ok) {
      expect(resultado.erros.map((e) => e.mensagem)).toContain('ID duplicado: "cpu-ryzen-5-7600"')
    }
  })

  it('erra quando o prefixo do ID não bate com a categoria', () => {
    const resultado = validarCatalogo(catalogo({ ...cpu, id: 'gpu-x' }))
    expect(resultado.ok).toBe(false)
    if (!resultado.ok) {
      expect(resultado.erros).toContainEqual({
        caminho: 'pecas[0].id',
        mensagem: 'ID "gpu-x" deve começar com "cpu-"',
      })
    }
  })

  it('informa o caminho da peça problemática', () => {
    const ruim = { ...gpu, faixaPreco: { min: 900, medio: 800, max: 1000 } }
    const resultado = validarCatalogo(catalogo(cpu, ruim))
    expect(resultado.ok).toBe(false)
    if (!resultado.ok) {
      expect(resultado.erros).toContainEqual({
        caminho: 'pecas[1].faixaPreco',
        mensagem: 'Faixa de preço inválida: mín 900 > médio 800',
      })
    }
  })

  it('junta vários erros em vez de parar no primeiro', () => {
    const faixaRuim = { ...gpu, faixaPreco: { min: 900, medio: 800, max: 1000 } }
    const resultado = validarCatalogo(catalogo(cpu, faixaRuim, { ...cpu, nucleos: 0 }))
    expect(resultado.ok).toBe(false)
    if (!resultado.ok) expect(resultado.erros.length).toBeGreaterThanOrEqual(2)
  })

  it('informa o caminho do campo inválido dentro da peça', () => {
    const resultado = validarCatalogo(catalogo(cpu, { ...cpu, nucleos: 0 }))
    expect(resultado.ok).toBe(false)
    if (!resultado.ok) {
      const caminhos = resultado.erros.map((e) => e.caminho)
      expect(caminhos).toContain('pecas[1].nucleos')
    }
  })
})
