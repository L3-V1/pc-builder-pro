import { expect, test as base } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { faixaPrecoFixture, respostaDados } from '../src/teste/respostaDados.ts'

// Todos os specs usam este test: o Catálogo vem sempre da fixture, nunca dos dados reais.
export const test = base.extend<{ catalogoFixture: void }>({
  catalogoFixture: [
    async ({ page }, use) => {
      await page.route('**/dados/*.json', (rota) => {
        const arquivo = /dados\/([^/]+)\.json$/.exec(new URL(rota.request().url()).pathname)?.[1]
        return arquivo ? rota.fulfill({ json: respostaDados(arquivo) }) : rota.fallback()
      })
      await use()
    },
    { auto: true },
  ],
})

export const faixaPreco = faixaPrecoFixture

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
  // Na tela de carregamento a barra ainda não existe; sem esperar, o celular pareceria desktop.
  await page.getByLabel('Buscar', { exact: true }).waitFor({ state: 'attached' })
  const barra = barraBusca(page)
  if ((await barra.count()) === 0) return
  if ((await barra.getAttribute('aria-expanded')) === String(aberta)) return
  await barra.click()
  await expect(barra).toHaveAttribute('aria-expanded', String(aberta))
}

export const abrirBusca = (page: Page) => mudarBusca(page, true)
export const fecharBusca = (page: Page) => mudarBusca(page, false)

// A busca é assíncrona e com debounce: enquanto ela não assenta, a lista anterior fica aria-busy.
export async function esperarBusca(page: Page) {
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
}

export async function pesquisar(page: Page, termo: string) {
  await abrirBusca(page)
  await page.getByLabel('Buscar', { exact: true }).fill(termo)
  await esperarBusca(page)
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
