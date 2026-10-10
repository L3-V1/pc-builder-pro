import type { Categoria } from '../src/catalogo'

export function kebab(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function slugPeca(categoria: Categoria, marca: string, nome: string): string {
  const m = kebab(marca)
  let n = kebab(nome)
  if (m && (n === m || n.startsWith(`${m}-`))) n = n.slice(m.length + 1)
  return [categoria, m, n].filter(Boolean).join('-')
}

// Todas as que colidem (não só a segunda) recebem sufixo: o ID não depende da ordem de leitura.
export function resolverColisoes<T extends { id: string; opendbId: string }>(pecas: T[]): T[] {
  const contagem = new Map<string, number>()
  for (const p of pecas) contagem.set(p.id, (contagem.get(p.id) ?? 0) + 1)
  return pecas.map((p) =>
    (contagem.get(p.id) ?? 0) > 1 ? { ...p, id: `${p.id}-${kebab(p.opendbId.slice(0, 8))}` } : p,
  )
}
