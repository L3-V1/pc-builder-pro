import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Categoria } from '../../src/catalogo'
import { CATEGORIAS } from '../../src/catalogo/schema'
import { PASTAS_OPENDB } from '../config'

// Um JSON por registro, ordenados pelo nome do arquivo (o opendb_id) para a saída ser estável.
// Leitura síncrona: são milhares de arquivos pequenos e em paralelo estoura o limite de abertos.
export function lerPasta(pasta: string): unknown[] {
  return readdirSync(pasta)
    .filter((a) => a.endsWith('.json'))
    .sort()
    .map((a) => JSON.parse(readFileSync(join(pasta, a), 'utf8')) as unknown)
}

export function lerOpenDb(raiz: string): Record<Categoria, unknown[]> {
  return Object.fromEntries(
    CATEGORIAS.map((c) => [c, lerPasta(join(raiz, PASTAS_OPENDB[c]))]),
  ) as Record<Categoria, unknown[]>
}
