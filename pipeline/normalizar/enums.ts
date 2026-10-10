import { CERTIFICACOES, FORM_FACTORS, SOCKETS, TIPOS_RAM } from '../../src/catalogo/schema'

type Socket = (typeof SOCKETS)[number]

const ehSocket = (s: string): s is Socket => (SOCKETS as readonly string[]).includes(s)

// "LGA 1700" → "LGA1700"; sockets que o app não conhece ficam indefinidos.
export function socket(valor: unknown): Socket | undefined {
  if (typeof valor !== 'string') return undefined
  const s = valor.replace(/\s+/g, '')
  return ehSocket(s) ? s : undefined
}

type FormFactor = (typeof FORM_FACTORS)[number]

const FORM_FACTORS_OPENDB: Record<string, FormFactor> = {
  ATX: 'ATX',
  'Micro ATX': 'Micro-ATX',
  'Mini-ITX': 'Mini-ITX',
}

export function formFactor(valor: unknown): FormFactor | undefined {
  return typeof valor === 'string' ? FORM_FACTORS_OPENDB[valor] : undefined
}

type TipoRam = (typeof TIPOS_RAM)[number]

export function tipoRam(valor: unknown): TipoRam | undefined {
  return (TIPOS_RAM as readonly unknown[]).includes(valor) ? (valor as TipoRam) : undefined
}

// "M.2-2280" → "M.2"; '2.5"' → "2.5"; 3.5", PCIe, mSATA ficam de fora.
export function formatoArmazenamento(valor: string): 'M.2' | '2.5' | undefined {
  if (valor.startsWith('M.2')) return 'M.2'
  return valor === '2.5"' ? '2.5' : undefined
}

// NVMe se o registro diz NVMe ou a interface é PCIe; SATA (inclusive "M.2 SATA"); SAS, PATA e
// U.2 ficam de fora.
export function interfaceArmazenamento(valor: string, nvme: boolean): 'NVMe' | 'SATA' | undefined {
  if (nvme || valor.includes('PCIe')) return 'NVMe'
  return valor.includes('SATA') && valor !== 'mSATA' ? 'SATA' : undefined
}

type Certificacao = (typeof CERTIFICACOES)[number]

// "80+ Gold" → "Gold"; "80+", "80+ Standard" e "80+ White" são a 80 Plus básica.
export function certificacao(valor: string): Certificacao | undefined {
  const nivel = valor.replace(/^80\+\s*/, '')
  if (['', 'Standard', 'White'].includes(nivel)) return '80 Plus'
  return (CERTIFICACOES as readonly string[]).includes(nivel) ? (nivel as Certificacao) : undefined
}
