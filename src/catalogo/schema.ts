import { z } from 'zod'

export const CATEGORIAS = [
  'cpu',
  'placa-mae',
  'ram',
  'gpu',
  'armazenamento',
  'fonte',
  'gabinete',
  'cooler',
] as const
export const SOCKETS = ['AM4', 'AM5', 'LGA1700', 'LGA1851'] as const
export const TIPOS_RAM = ['DDR4', 'DDR5'] as const
export const FORM_FACTORS = ['ATX', 'Micro-ATX', 'Mini-ITX'] as const

const reais = z.number().int().positive()

export const FaixaPreco = z
  .strictObject({ min: reais, medio: reais, max: reais })
  .refine((f) => f.min <= f.medio && f.medio <= f.max, {
    error: (issue) => {
      const f = issue.input as { min: number; medio: number; max: number }
      return f.min > f.medio
        ? `Faixa de preço inválida: mín ${f.min} > médio ${f.medio}`
        : `Faixa de preço inválida: médio ${f.medio} > máx ${f.max}`
    },
  })
export type FaixaPreco = z.infer<typeof FaixaPreco>

const contagem = z.number().int().positive()

const contagemOuZero = z.number().int().nonnegative()

const base = {
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'ID deve ser um slug kebab-case'),
  nome: z.string().min(1),
  marca: z.string().min(1),
  faixaPreco: FaixaPreco,
}

const Cpu = z.strictObject({
  ...base,
  categoria: z.literal('cpu'),
  socket: z.enum(SOCKETS),
  nucleos: contagem,
  threads: contagem,
  consumoW: contagem,
  videoIntegrado: z.boolean(),
  coolerBox: z.boolean(),
})

const PlacaMae = z.strictObject({
  ...base,
  categoria: z.literal('placa-mae'),
  socket: z.enum(SOCKETS),
  tipoRam: z.enum(TIPOS_RAM),
  formFactor: z.enum(FORM_FACTORS),
  slotsDimm: contagem,
  slotsM2: contagemOuZero,
  slotsPcieX16: contagemOuZero,
  portasSata: contagemOuZero,
})

const Ram = z.strictObject({
  ...base,
  categoria: z.literal('ram'),
  tipoRam: z.enum(TIPOS_RAM),
  capacidadeTotalGB: contagem,
  modulos: contagem,
  frequenciaMHz: contagem,
})

const Gpu = z.strictObject({
  ...base,
  categoria: z.literal('gpu'),
  consumoW: contagem,
  vramGB: contagem,
  fonteRecomendadaW: contagem,
})

const Armazenamento = z
  .strictObject({
    ...base,
    categoria: z.literal('armazenamento'),
    formato: z.enum(['M.2', '2.5']),
    interface: z.enum(['NVMe', 'SATA']),
    capacidadeGB: contagem,
  })
  .refine((a) => !(a.formato === '2.5' && a.interface === 'NVMe'), {
    error: 'Armazenamento 2.5 não pode ser NVMe',
    path: ['interface'],
  })

const Fonte = z.strictObject({
  ...base,
  categoria: z.literal('fonte'),
  potenciaW: contagem,
  certificacao: z.enum(['80 Plus', 'Bronze', 'Gold', 'Platinum', 'Titanium']),
})

const Gabinete = z.strictObject({
  ...base,
  categoria: z.literal('gabinete'),
  formFactorsSuportados: z.array(z.enum(FORM_FACTORS)).min(1),
})

const Cooler = z.strictObject({
  ...base,
  categoria: z.literal('cooler'),
  tipo: z.enum(['ar', 'water']),
  socketsSuportados: z.array(z.enum(SOCKETS)).min(1),
})

export const Peca = z.discriminatedUnion('categoria', [
  Cpu,
  PlacaMae,
  Ram,
  Gpu,
  Armazenamento,
  Fonte,
  Gabinete,
  Cooler,
])
export type Peca = z.infer<typeof Peca>

export const Catalogo = z.strictObject({
  dataReferencia: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Data de referência deve ser AAAA-MM'),
  pecas: z.array(Peca),
})
export type Catalogo = z.infer<typeof Catalogo>

export type Categoria = (typeof CATEGORIAS)[number]
export type PecaDe<C extends Categoria> = Extract<Peca, { categoria: C }>
