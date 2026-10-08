import type { Categoria } from '../catalogo'
import { CATEGORIAS } from '../catalogo/schema'
import type { Build } from './build'

function exigida(categoria: Categoria, build: Build): boolean {
  const { cpu } = build
  if (!cpu) return true
  if (categoria === 'gpu') return !cpu.videoIntegrado
  if (categoria === 'cooler') return !cpu.coolerBox
  return true
}

export function presente(categoria: Categoria, build: Build): boolean {
  if (categoria === 'ram') return build.ram.length > 0
  if (categoria === 'armazenamento') return build.armazenamento.length > 0
  return build[categoria] !== undefined
}

export function calcularChecklist(build: Build): { faltando: Categoria[]; completa: boolean } {
  const faltando = CATEGORIAS.filter((c) => exigida(c, build) && !presente(c, build))
  return { faltando, completa: faltando.length === 0 }
}
