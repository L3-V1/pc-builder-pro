import type { Categoria, Indices, Peca } from '../catalogo'

export const ROTULOS_CATEGORIA: Record<Categoria, string> = {
  cpu: 'CPU',
  'placa-mae': 'Placa-mãe',
  ram: 'Memória RAM',
  gpu: 'GPU',
  armazenamento: 'Armazenamento',
  fonte: 'Fonte',
  gabinete: 'Gabinete',
  cooler: 'Cooler',
}

function desempenho({ jogos, produtividade }: Indices): string {
  return `Jogos ${jogos} · Produtividade ${produtividade}`
}

export function specsPrincipais(peca: Peca): string[] {
  switch (peca.categoria) {
    case 'cpu':
      return [
        peca.socket,
        `${peca.nucleos} núcleos / ${peca.threads} threads`,
        ...(peca.videoIntegrado ? ['Vídeo integrado'] : []),
        ...(peca.coolerBox ? ['Cooler box'] : []),
        desempenho(peca.indices),
      ]
    case 'placa-mae':
      return [peca.socket, peca.tipoRam, peca.formFactor]
    case 'ram':
      return [
        `${peca.capacidadeTotalGB} GB`,
        peca.tipoRam,
        `${peca.modulos} ${peca.modulos === 1 ? 'pente' : 'pentes'}`,
        `${peca.frequenciaMHz} MHz`,
      ]
    case 'gpu':
      return [`${peca.vramGB} GB VRAM`, `${peca.consumoW} W`, desempenho(peca.indices)]
    case 'armazenamento':
      return [`${peca.capacidadeGB} GB`, peca.formato, peca.interface]
    case 'fonte':
      return [`${peca.potenciaW} W`, peca.certificacao]
    case 'gabinete':
      return [...peca.formFactorsSuportados]
    case 'cooler':
      return [peca.tipo === 'ar' ? 'Ar' : 'Water cooler']
  }
}
