import { expect } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import armazenamento from '../src/catalogo/dados/armazenamento.json' with { type: 'json' }
import cooler from '../src/catalogo/dados/cooler.json' with { type: 'json' }
import cpu from '../src/catalogo/dados/cpu.json' with { type: 'json' }
import fonte from '../src/catalogo/dados/fonte.json' with { type: 'json' }
import gabinete from '../src/catalogo/dados/gabinete.json' with { type: 'json' }
import gpu from '../src/catalogo/dados/gpu.json' with { type: 'json' }
import placaMae from '../src/catalogo/dados/placa-mae.json' with { type: 'json' }
import ram from '../src/catalogo/dados/ram.json' with { type: 'json' }

const todas = [
  ...cpu,
  ...placaMae,
  ...ram,
  ...gpu,
  ...armazenamento,
  ...fonte,
  ...gabinete,
  ...cooler,
]

export function faixaPreco(id: string) {
  const p = todas.find((x) => x.id === id)
  if (!p) throw new Error(`Peça ${id} não existe`)
  return p.faixaPreco
}

export const medio = (id: string) => faixaPreco(id).medio
export const soma = (...ids: string[]) => ids.reduce((t, id) => t + medio(id), 0)

export const normalizar = (s: string) => s.replace(/\s/g, ' ')
export const brl = (v: number) =>
  normalizar(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v))

export async function texto(locator: Locator) {
  return normalizar((await locator.textContent()) ?? '')
}

export const slot = (page: Page, id: string) => page.locator(`[data-slot="${id}"]`)
export const aviso = (page: Page) => page.getByRole('main').getByRole('status')

// Só existe abaixo do breakpoint; no desktop a busca fica sempre à vista.
const barraBusca = (page: Page) => page.getByRole('button', { name: 'Buscar Peças', exact: true })

async function mudarBusca(page: Page, aberta: boolean) {
  const barra = barraBusca(page)
  if ((await barra.count()) === 0) return
  if ((await barra.getAttribute('aria-expanded')) === String(aberta)) return
  await barra.click()
  await expect(barra).toHaveAttribute('aria-expanded', String(aberta))
}

export const abrirBusca = (page: Page) => mudarBusca(page, true)
export const fecharBusca = (page: Page) => mudarBusca(page, false)

export async function pesquisar(page: Page, termo: string) {
  await abrirBusca(page)
  await page.getByLabel('Buscar', { exact: true }).fill(termo)
}

export async function adicionar(page: Page, termo: string, nome?: string) {
  await pesquisar(page, termo)
  const cards = page.getByRole('article')
  const card = nome
    ? cards.filter({ has: page.getByRole('heading', { name: nome, exact: true }) })
    : cards.first()
  await card.getByRole('button', { name: /Adicionar à Build|Trocar/ }).click()
  await fecharBusca(page)
}
