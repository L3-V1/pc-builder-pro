import type { Categoria, PecaDe } from '../../src/catalogo'

// Campos que não vêm do OpenDB: ID e preço saem da montagem; Índices, da curadoria.
type Curados = 'id' | 'faixaPreco' | 'indices' | 'indiceVideoIntegrado' | 'fonteRecomendadaW'

export type Normalizada<C extends Categoria = Categoria> = C extends Categoria
  ? Omit<PecaDe<C>, Curados> & { opendbId: string; chave?: string }
  : never

export type Normalizacao<C extends Categoria = Categoria> =
  { ok: true; peca: Normalizada<C> } | { ok: false; motivo: string }
