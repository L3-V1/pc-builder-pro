import { base, converter, exigir, inteiro, ler, texto } from './campos'
import { formatoArmazenamento, interfaceArmazenamento } from './enums'
import type { Normalizacao } from './tipos'

export function normalizarArmazenamento(registro: unknown): Normalizacao<'armazenamento'> {
  const brutos = exigir({
    tipo: texto(registro, 'storage_type'),
    formato: texto(registro, 'form_factor'),
    interface: texto(registro, 'interface'),
    capacidade: inteiro(registro, 'capacity'),
  })
  if (!brutos.ok) return brutos
  const b = brutos.specs
  const formato = formatoArmazenamento(b.formato)
  const iface = interfaceArmazenamento(b.interface, ler(registro, 'nvme') === true)
  const r = converter({
    formato: [b.formato, formato],
    tipo: [b.tipo, b.tipo === 'SSD' ? b.tipo : undefined],
    // 2.5" NVMe (U.2) não existe no app.
    interface: [b.interface, formato === '2.5' && iface === 'NVMe' ? undefined : iface],
  })
  if (!r.ok) return r
  return {
    ok: true,
    peca: {
      categoria: 'armazenamento',
      ...base(registro),
      formato: r.specs.formato,
      interface: r.specs.interface,
      capacidadeGB: b.capacidade,
    },
  }
}
