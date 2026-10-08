import { describe, expect, it } from 'vitest'
import { Catalogo, FaixaPreco, Peca } from './schema'

describe('FaixaPreco', () => {
  it('aceita faixa crescente e faixa com valores iguais', () => {
    expect(FaixaPreco.safeParse({ min: 800, medio: 900, max: 1000 }).success).toBe(true)
    expect(FaixaPreco.safeParse({ min: 900, medio: 900, max: 900 }).success).toBe(true)
  })

  it.each([
    ['mín > médio', { min: 900, medio: 800, max: 1000 }],
    ['médio > máx', { min: 800, medio: 1100, max: 1000 }],
    ['zero', { min: 0, medio: 900, max: 1000 }],
    ['negativo', { min: -1, medio: 900, max: 1000 }],
    ['não inteiro', { min: 800.5, medio: 900, max: 1000 }],
  ])('rejeita %s', (_nome, faixa) => {
    expect(FaixaPreco.safeParse(faixa).success).toBe(false)
  })
})

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
}

describe('Peca: cpu', () => {
  it('aceita uma CPU válida', () => {
    expect(Peca.safeParse(cpu).success).toBe(true)
  })

  it('rejeita CPU sem socket', () => {
    const { socket: _socket, ...semSocket } = cpu
    expect(Peca.safeParse(semSocket).success).toBe(false)
  })

  it('rejeita CPU com socket fora da lista', () => {
    expect(Peca.safeParse({ ...cpu, socket: 'LGA775' }).success).toBe(false)
  })

  it('rejeita CPU com campo desconhecido', () => {
    expect(Peca.safeParse({ ...cpu, soket: 'AM5' }).success).toBe(false)
  })
})

const placaMae = {
  id: 'placa-mae-b650m-aorus-elite',
  nome: 'B650M Aorus Elite',
  marca: 'Gigabyte',
  faixaPreco,
  categoria: 'placa-mae',
  socket: 'AM5',
  tipoRam: 'DDR5',
  formFactor: 'Micro-ATX',
  slotsDimm: 4,
  slotsM2: 2,
  slotsPcieX16: 1,
  portasSata: 4,
}

describe('Peca: placa-mae', () => {
  it('aceita uma placa-mãe válida', () => {
    expect(Peca.safeParse(placaMae).success).toBe(true)
  })

  it('rejeita slotsDimm 0', () => {
    expect(Peca.safeParse({ ...placaMae, slotsDimm: 0 }).success).toBe(false)
  })

  it('rejeita tipoRam inválido', () => {
    expect(Peca.safeParse({ ...placaMae, tipoRam: 'DDR3' }).success).toBe(false)
  })
})

const ram = {
  id: 'ram-kingston-fury-32gb-ddr5-6000',
  nome: 'Fury Beast 2x16 GB',
  marca: 'Kingston',
  faixaPreco,
  categoria: 'ram',
  tipoRam: 'DDR5',
  capacidadeTotalGB: 32,
  modulos: 2,
  frequenciaMHz: 6000,
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
}

const armazenamento = {
  id: 'armazenamento-wd-sn580-1tb',
  nome: 'WD Blue SN580 1 TB',
  marca: 'WD',
  faixaPreco,
  categoria: 'armazenamento',
  formato: 'M.2',
  interface: 'NVMe',
  capacidadeGB: 1000,
}

const fonte = {
  id: 'fonte-corsair-cx650',
  nome: 'CX650',
  marca: 'Corsair',
  faixaPreco,
  categoria: 'fonte',
  potenciaW: 650,
  certificacao: 'Bronze',
}

const gabinete = {
  id: 'gabinete-nzxt-h5-flow',
  nome: 'H5 Flow',
  marca: 'NZXT',
  faixaPreco,
  categoria: 'gabinete',
  formFactorsSuportados: ['ATX', 'Micro-ATX', 'Mini-ITX'],
}

const cooler = {
  id: 'cooler-deepcool-ak400',
  nome: 'AK400',
  marca: 'Deepcool',
  faixaPreco,
  categoria: 'cooler',
  tipo: 'ar',
  socketsSuportados: ['AM4', 'AM5', 'LGA1700'],
}

describe('Peca: demais categorias', () => {
  it.each([
    ['ram', ram],
    ['gpu', gpu],
    ['armazenamento', armazenamento],
    ['fonte', fonte],
    ['gabinete', gabinete],
    ['cooler', cooler],
  ])('aceita %s válido', (_categoria, peca) => {
    expect(Peca.safeParse(peca).success).toBe(true)
  })

  it('rejeita gabinete sem form factors suportados', () => {
    expect(Peca.safeParse({ ...gabinete, formFactorsSuportados: [] }).success).toBe(false)
  })

  it('rejeita cooler sem sockets suportados', () => {
    expect(Peca.safeParse({ ...cooler, socketsSuportados: [] }).success).toBe(false)
  })

  it('rejeita armazenamento 2.5 com NVMe', () => {
    expect(Peca.safeParse({ ...armazenamento, formato: '2.5', interface: 'NVMe' }).success).toBe(
      false,
    )
  })

  it('aceita armazenamento 2.5 com SATA', () => {
    expect(Peca.safeParse({ ...armazenamento, formato: '2.5', interface: 'SATA' }).success).toBe(
      true,
    )
  })

  it('rejeita categoria desconhecida', () => {
    expect(Peca.safeParse({ ...fonte, categoria: 'monitor' }).success).toBe(false)
  })
})

describe('Catalogo', () => {
  it('aceita um catálogo válido', () => {
    expect(Catalogo.safeParse({ dataReferencia: '2026-10', pecas: [cpu, gpu] }).success).toBe(true)
  })

  it.each(['10/2026', '2026-13', '2026-00', '2026-1'])('rejeita dataReferencia %s', (data) => {
    expect(Catalogo.safeParse({ dataReferencia: data, pecas: [cpu] }).success).toBe(false)
  })

  it('rejeita ID que não é slug kebab-case', () => {
    const resultado = Catalogo.safeParse({
      dataReferencia: '2026-10',
      pecas: [{ ...cpu, id: 'CPU Ryzen' }],
    })
    expect(resultado.success).toBe(false)
  })
})
