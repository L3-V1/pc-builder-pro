import type { Indices, Peca, Perfil } from '../catalogo'
import type { Build } from './build'

// Fórmula, escala e calibração documentadas em docs/pontuacao.md.

export type Gargalo = {
  tipo: 'cpu' | 'ram'
  perfil: Perfil
  penalidade: number
  pontosPerdidos: number
  mensagem: string
}

export type PontuacaoPerfil =
  | {
      tipo: 'calculada'
      valor: number
      base: number
      usaVideoIntegrado: boolean
      gargalos: Gargalo[]
    }
  | { tipo: 'pendente'; motivo: 'sem-cpu' | 'sem-gpu' }

export const PESOS: Record<Perfil, { cpu: number; gpu: number }> = {
  jogos: { cpu: 0.3, gpu: 0.7 },
  produtividade: { cpu: 0.7, gpu: 0.3 },
}
export const LIMITE_GARGALO_CPU = 20
export const TETO_GARGALO_CPU = 0.3
export const RAM_MINIMA_GB: Record<Perfil, number> = { jogos: 16, produtividade: 32 }
export const RAM_CRITICA_GB = 8
export const PENALIDADES_RAM = { semRam: 0.5, critica: 0.3, abaixoDoMinimo: 0.15 }

type Penalidade = Pick<Gargalo, 'tipo' | 'penalidade' | 'mensagem'>

function percentual(fracao: number): string {
  return `−${Math.round(fracao * 100)}%`
}

function gargaloDeCpu(cpu: Indices, gpu: Indices): Penalidade | undefined {
  const excesso = gpu.jogos - cpu.jogos - LIMITE_GARGALO_CPU
  if (excesso <= 0) return undefined
  const penalidade = Math.min(excesso / 100, TETO_GARGALO_CPU)
  return {
    tipo: 'cpu',
    penalidade,
    mensagem: `A CPU limita a GPU em jogos: ${percentual(penalidade)}.`,
  }
}

function gargaloDeRam(gb: number, perfil: Perfil): Penalidade | undefined {
  const minimo = RAM_MINIMA_GB[perfil]
  if (gb >= minimo) return undefined
  if (gb === 0) {
    const penalidade = PENALIDADES_RAM.semRam
    return { tipo: 'ram', penalidade, mensagem: `Sem memória RAM: ${percentual(penalidade)}.` }
  }
  const penalidade = gb <= RAM_CRITICA_GB ? PENALIDADES_RAM.critica : PENALIDADES_RAM.abaixoDoMinimo
  return {
    tipo: 'ram',
    penalidade,
    mensagem: `Pouca RAM para ${perfil} (${gb} GB, o recomendado é ${minimo} GB): ${percentual(penalidade)}.`,
  }
}

export function calcularPontuacao(build: Build): Record<Perfil, PontuacaoPerfil> {
  const { cpu } = build
  const video = build.gpu?.indices ?? cpu?.indiceVideoIntegrado
  if (!cpu || !video) {
    const pendente: PontuacaoPerfil = { tipo: 'pendente', motivo: cpu ? 'sem-gpu' : 'sem-cpu' }
    return { jogos: pendente, produtividade: pendente }
  }
  const usaVideoIntegrado = !build.gpu
  const gb = build.ram.reduce((total, kit) => total + kit.capacidadeTotalGB, 0)

  const porPerfil = (perfil: Perfil): PontuacaoPerfil => {
    const bruta = PESOS[perfil].cpu * cpu.indices[perfil] + PESOS[perfil].gpu * video[perfil]
    const penalidades = [
      perfil === 'jogos' && !usaVideoIntegrado ? gargaloDeCpu(cpu.indices, video) : undefined,
      gargaloDeRam(gb, perfil),
    ].filter((p) => p !== undefined)

    let valor = bruta
    const gargalos = penalidades.map((p): Gargalo => {
      const depois = valor * (1 - p.penalidade)
      const pontosPerdidos = Math.round(valor) - Math.round(depois)
      valor = depois
      return { ...p, perfil, pontosPerdidos }
    })
    return {
      tipo: 'calculada',
      valor: Math.round(valor),
      base: Math.round(bruta),
      usaVideoIntegrado,
      gargalos,
    }
  }
  return { jogos: porPerfil('jogos'), produtividade: porPerfil('produtividade') }
}

export function indiceDaPeca(peca: Peca, perfil: Perfil): number | undefined {
  return peca.categoria === 'cpu' || peca.categoria === 'gpu' ? peca.indices[perfil] : undefined
}
