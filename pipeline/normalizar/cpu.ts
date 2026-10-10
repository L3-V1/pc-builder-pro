import { kebab } from '../slug'
import { base, converter, exigir, inteiro, ler, texto } from './campos'
import { socket } from './enums'
import type { Normalizacao } from './tipos'

export function normalizarCpu(registro: unknown): Normalizacao<'cpu'> {
  const brutos = exigir({
    socket: texto(registro, 'socket'),
    núcleos: inteiro(registro, 'cores.total'),
    threads: inteiro(registro, 'cores.threads'),
    TDP: inteiro(registro, 'specifications.tdp'),
  })
  if (!brutos.ok) return brutos
  const b = brutos.specs
  const r = converter({ socket: [b.socket, socket(b.socket)] })
  if (!r.ok) return r
  const comum = base(registro)
  const video = texto(registro, 'specifications.integratedGraphics.model')
  return {
    ok: true,
    peca: {
      // Chave dos Índices de CPU na curadoria: o modelo sem a marca, em kebab-case.
      chave: kebab(comum.nome),
      categoria: 'cpu',
      ...comum,
      socket: r.specs.socket,
      nucleos: b.núcleos,
      threads: b.threads,
      consumoW: b.TDP,
      // O OpenDB registra CPU sem vídeo como modelo "None".
      videoIntegrado: video !== undefined && video !== 'None',
      coolerBox: ler(registro, 'specifications.includesCooler') === true,
    },
  }
}
