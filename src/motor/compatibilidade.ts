import type { Peca, PecaDe } from '../catalogo'
import type { Build } from './build'
import { pecasDaBuild, remover } from './build'
import { verificarFonte } from './fonte'

export type RegraId = 'socket' | 'tipo-ram' | 'form-factor' | 'slots-dimm' | 'slots-m2' | 'fonte'

export type Incompatibilidade = {
  regra: RegraId
  severidade: 'bloqueante' | 'alerta'
  pecas: string[]
  mensagem: string
}

function bloqueio(regra: RegraId, pecas: string[], mensagem: string): Incompatibilidade {
  return { regra, severidade: 'bloqueante', pecas, mensagem }
}

export function verificarEncaixe(build: Build, peca: Peca): Incompatibilidade[] {
  const { 'placa-mae': placa } = build
  if (!placa) return []

  switch (peca.categoria) {
    case 'cpu':
      return peca.socket === placa.socket
        ? []
        : [
            bloqueio(
              'socket',
              [peca.id, placa.id],
              `O socket da CPU (${peca.socket}) não é o da placa-mãe (${placa.socket}).`,
            ),
          ]
    case 'ram': {
      const resultado: Incompatibilidade[] = []
      if (peca.tipoRam !== placa.tipoRam) {
        resultado.push(
          bloqueio(
            'tipo-ram',
            [peca.id, placa.id],
            `A placa-mãe usa ${placa.tipoRam}, mas esta memória é ${peca.tipoRam}.`,
          ),
        )
      }
      const emUso = build.ram.reduce((soma, r) => soma + r.modulos, 0)
      if (emUso + peca.modulos > placa.slotsDimm) {
        resultado.push(
          bloqueio(
            'slots-dimm',
            [peca.id, placa.id],
            `A placa-mãe tem ${placa.slotsDimm} slots de memória e não comporta mais ${peca.modulos} pentes.`,
          ),
        )
      }
      return resultado
    }
    case 'armazenamento': {
      if (peca.formato !== 'M.2') return []
      const emUso = build.armazenamento.filter((a) => a.formato === 'M.2').length
      return emUso + 1 > placa.slotsM2
        ? [
            bloqueio(
              'slots-m2',
              [peca.id, placa.id],
              `A placa-mãe tem ${placa.slotsM2} slots M.2 e todos já estão ocupados.`,
            ),
          ]
        : []
    }
    case 'gabinete':
      return peca.formFactorsSuportados.includes(placa.formFactor)
        ? []
        : [
            bloqueio(
              'form-factor',
              [peca.id, placa.id],
              `O gabinete não aceita placa-mãe ${placa.formFactor}.`,
            ),
          ]
    default:
      return []
  }
}

function excedentes<T extends Peca>(
  pecas: readonly T[],
  limite: number,
  custo: (p: T) => number,
): T[] {
  let ocupado = 0
  return pecas.filter((p) => {
    if (ocupado + custo(p) > limite) return true
    ocupado += custo(p)
    return false
  })
}

export function pecasIncompativeisComPlaca(build: Build, placa: PecaDe<'placa-mae'>): Peca[] {
  const { cpu, gabinete } = build
  const ramCompativel = build.ram.filter((r) => r.tipoRam === placa.tipoRam)
  const ramExcedente = excedentes(ramCompativel, placa.slotsDimm, (r) => r.modulos)
  const m2 = build.armazenamento.filter((a) => a.formato === 'M.2')
  const m2Excedente = excedentes(m2, placa.slotsM2, () => 1)

  const fora = new Set<Peca>()
  if (cpu && cpu.socket !== placa.socket) fora.add(cpu)
  for (const r of build.ram) {
    if (r.tipoRam !== placa.tipoRam) fora.add(r)
  }
  for (const r of ramExcedente) fora.add(r)
  for (const a of m2Excedente) fora.add(a)
  if (gabinete && !gabinete.formFactorsSuportados.includes(placa.formFactor)) fora.add(gabinete)
  return pecasDaBuild(build).filter((p) => fora.has(p))
}

export function verificarBuild(
  build: Build,
  opcoes: { margemFonte?: number } = {},
): Incompatibilidade[] {
  const bloqueios = pecasDaBuild(build).flatMap((p) => verificarEncaixe(remover(build, p.id), p))
  const alerta = verificarFonte(build, opcoes.margemFonte)
  return alerta ? [...bloqueios, alerta] : bloqueios
}
