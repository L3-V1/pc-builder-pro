import { describe, expect, it } from 'vitest'
import { encaixar } from './build'
import { consumoEstimadoW, verificarFonte } from './fonte'
import { montar, peca } from './teste-pecas'
import { verificarBuild } from './compatibilidade'

const cpu = peca('cpu-ryzen-5-7600', 'cpu') // 65 W
const gpu = peca('gpu-rtx-4060', 'gpu') // 115 W, recomenda 550 W
// consumo = 65 + 115 + 100 = 280; × 1,3 = 364

describe('consumoEstimadoW', () => {
  it('soma CPU + GPU + 100, com ausentes contando 0', () => {
    expect(consumoEstimadoW(montar(cpu, gpu))).toBe(280)
    expect(consumoEstimadoW(montar(cpu))).toBe(165)
    expect(consumoEstimadoW(montar())).toBe(100)
  })
})

describe('verificarFonte', () => {
  it('sem fonte devolve undefined', () => {
    expect(verificarFonte(montar(cpu, gpu))).toBeUndefined()
  })

  it('fonte abaixo de consumo × 1,3 gera Alerta fonte; acima, nada', () => {
    const fraca = peca('fonte-mwe-450', 'fonte')
    const cpuForte = peca('cpu-ryzen-7-7800x3d', 'cpu') // 120
    const gpuForte = peca('gpu-rx-7800-xt', 'gpu') // 263 W; (120+263+100) × 1,3 = 628,9 → 629
    const alerta = verificarFonte(montar(cpuForte, gpuForte, peca('fonte-cx550', 'fonte')))
    expect(alerta).toMatchObject({ regra: 'fonte', severidade: 'alerta' })
    expect(alerta?.pecas).toContain('fonte-cx550')
    expect(alerta?.mensagem).toMatch(/fonte/i)
    expect(verificarFonte(montar(cpu, peca('gpu-rtx-3050-6gb', 'gpu'), fraca))).toBeUndefined()
  })

  it('fonte abaixo de gpu.fonteRecomendadaW gera Alerta mesmo cobrindo a margem', () => {
    const f = peca('fonte-cx550', 'fonte') // 550 ≥ 364, mas...
    const gpuExigente = peca('gpu-rx-6600', 'gpu') // recomenda 450
    expect(verificarFonte(montar(cpu, gpu, f))).toBeUndefined() // 550 ≥ 550
    expect(verificarFonte(montar(cpu, gpuExigente, peca('fonte-mwe-450', 'fonte')))).toBeUndefined()
    const gpu4070 = peca('gpu-rtx-4070-super', 'gpu') // recomenda 650
    expect(verificarFonte(montar(cpu, gpu4070, f))).toMatchObject({ regra: 'fonte' })
  })

  it('margem configurável muda o resultado; negativa lança RangeError', () => {
    const gpuLeve = peca('gpu-rtx-3050-6gb', 'gpu') // 65+70+100 = 235; recomenda 300
    const build = montar(cpu, gpuLeve, peca('fonte-mwe-450', 'fonte'))
    expect(verificarFonte(build)).toBeUndefined() // 235 × 1,3 = 306
    expect(verificarFonte(build, 1)).toMatchObject({ regra: 'fonte' }) // 470 > 450
    expect(() => verificarFonte(build, -0.1)).toThrow(RangeError)
  })

  it('Alerta não impede encaixar a fonte', () => {
    const r = encaixar(montar(cpu, gpu), peca('fonte-mwe-450', 'fonte'))
    expect(r.ok).toBe(true)
  })
})

describe('verificarBuild', () => {
  it('devolve o Alerta da fonte e [] para Build compatível com folga', () => {
    const gpuForte = peca('gpu-rx-7800-xt', 'gpu')
    const apertada = montar(cpu, gpuForte, peca('fonte-cx550', 'fonte'))
    expect(verificarBuild(apertada).map((i) => i.regra)).toEqual(['fonte'])
    const folgada = montar(cpu, gpu, peca('fonte-rm750e', 'fonte'))
    expect(verificarBuild(folgada)).toEqual([])
    const leve = montar(cpu, peca('gpu-rtx-3050-6gb', 'gpu'), peca('fonte-mwe-450', 'fonte'))
    expect(verificarBuild(leve)).toEqual([])
    expect(verificarBuild(leve, { margemFonte: 1 }).map((i) => i.regra)).toEqual(['fonte'])
  })
})

describe('verificarBuild com Build montada à mão', () => {
  it('inclui Bloqueantes residuais de uma Build incoerente', () => {
    const incoerente = {
      ...montar(peca('placa-mae-b650m-aorus-elite', 'placa-mae')),
      cpu: peca('cpu-ryzen-5-5600', 'cpu'),
    }
    expect(verificarBuild(incoerente).map((i) => i.regra)).toEqual(['socket'])
  })
})
