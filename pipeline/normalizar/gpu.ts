import { base, exigir, inteiro, texto } from './campos'
import type { Normalizacao } from './tipos'

// A marca é a do fabricante da placa (ASUS, MSI…); o chipset vira a chave dos Índices.
export function normalizarGpu(registro: unknown): Normalizacao<'gpu'> {
  const r = exigir({
    chipset: texto(registro, 'chipset'),
    TDP: inteiro(registro, 'tdp'),
    VRAM: inteiro(registro, 'memory'),
  })
  if (!r.ok) return r
  return {
    ok: true,
    peca: {
      chave: r.specs.chipset,
      categoria: 'gpu',
      ...base(registro),
      consumoW: r.specs.TDP,
      vramGB: r.specs.VRAM,
    },
  }
}
