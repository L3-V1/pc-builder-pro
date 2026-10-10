/// <reference types="node" />
import { readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { validarCatalogo } from '../catalogo/validar'
import { catalogoFixture } from './catalogo'
import fixture from './catalogo.json'

const raiz = new URL('../../', import.meta.url)
const ler = (pasta: string) =>
  readdirSync(new URL(pasta, raiz), { recursive: true, encoding: 'utf8' })
    .filter((f) => /\.(ts|tsx)$/.test(f))
    .map((f) => readFileSync(new URL(pasta + f.replaceAll('\\', '/'), raiz), 'utf8'))
const ID = String.raw`(?:cpu|placa-mae|ram|gpu|armazenamento|fonte|gabinete|cooler)-[a-z0-9.-]+`
const casar = (textos: string[], padrao: RegExp) =>
  textos.flatMap((t) => [...t.matchAll(padrao)].map((m) => m[1]))

// IDs passados a peca() nos testes de unidade e de componente, e citados nos e2e.
function idsCitados(): string[] {
  return [
    ...new Set([
      ...casar(ler('src/'), new RegExp(String.raw`\bpeca\('(${ID})'`, 'g')),
      ...casar(ler('e2e/'), new RegExp(`'(${ID})'`, 'g')),
    ]),
  ]
}

describe('fixture do Catálogo', () => {
  it('Cenário: passa em validarCatalogo com a data de referência congelada', () => {
    expect(validarCatalogo(fixture).ok).toBe(true)
    expect(catalogoFixture.dataReferencia).toBe('2026-10')
  })

  it('Cenário: contém todos os IDs de Peças usados nos testes', () => {
    const ids = new Set(catalogoFixture.pecas.map((p) => p.id))
    const citados = idsCitados()
    expect(citados.length).toBeGreaterThan(0)
    expect(citados.filter((id) => !ids.has(id))).toEqual([])
  })
})
