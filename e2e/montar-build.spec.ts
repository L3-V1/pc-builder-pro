import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import armazenamento from '../src/catalogo/dados/armazenamento.json' with { type: 'json' }
import cpu from '../src/catalogo/dados/cpu.json' with { type: 'json' }
import fonte from '../src/catalogo/dados/fonte.json' with { type: 'json' }
import gabinete from '../src/catalogo/dados/gabinete.json' with { type: 'json' }
import gpu from '../src/catalogo/dados/gpu.json' with { type: 'json' }
import placaMae from '../src/catalogo/dados/placa-mae.json' with { type: 'json' }
import ram from '../src/catalogo/dados/ram.json' with { type: 'json' }

const todas = [...cpu, ...placaMae, ...ram, ...gpu, ...armazenamento, ...fonte, ...gabinete]
const porId = (id: string) => {
  const p = todas.find((x) => x.id === id)
  if (!p) throw new Error(`Peça ${id} não existe`)
  return p.faixaPreco
}

const brl = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
const normalizar = (s: string) => s.replace(/\s/g, ' ')

async function orcamentoMedio(page: Page) {
  return normalizar((await page.getByTestId('orcamento-medio').textContent()) ?? '')
}

async function pesquisar(page: Page, texto: string) {
  await page.getByLabel('Buscar', { exact: true }).fill(texto)
}

async function adicionar(page: Page, texto: string) {
  await pesquisar(page, texto)
  await page
    .getByRole('button', { name: /Adicionar à Build|Trocar/ })
    .first()
    .click()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('monta uma Build completa por busca e clique e confere o Orçamento', async ({ page }) => {
  const ids = [
    'cpu-ryzen-5-7600',
    'placa-mae-b650m-aorus-elite',
    'ram-corsair-32gb-ddr5-6000',
    'armazenamento-nvme-1tb',
    'gpu-rtx-4060',
    'fonte-cx650',
    'gabinete-nzxt-h5-flow',
  ]
  await adicionar(page, 'b650m aorus')
  await adicionar(page, 'ryzen 7600')
  await adicionar(page, 'vengeance 2x16')
  await adicionar(page, 'sn850x')
  await adicionar(page, 'rtx 4060')
  await adicionar(page, 'cx650')
  await adicionar(page, 'h5 flow')

  const faixa = ids.map(porId)
  const soma = (k: 'min' | 'medio' | 'max') => faixa.reduce((t, f) => t + f[k], 0)

  await expect(page.getByText('Build completa')).toBeVisible()
  expect(await orcamentoMedio(page)).toBe(normalizar(brl(soma('medio'))))
  const texto = normalizar((await page.getByTestId('orcamento-faixa').textContent()) ?? '')
  expect(texto).toBe(normalizar(`${brl(soma('min'))} – ${brl(soma('max'))}`))
})

test('só compatíveis esconde CPU de outro socket; desligado mostra o bloqueio', async ({
  page,
}) => {
  await adicionar(page, 'b650m aorus')
  await pesquisar(page, '')
  await page.locator('select').first().selectOption('cpu')
  await page.getByRole('checkbox', { name: 'Só compatíveis' }).check()
  await expect(page.getByRole('heading', { name: 'Core i5-12400', exact: true })).toHaveCount(0)
  await page.getByRole('checkbox', { name: 'Só compatíveis' }).uncheck()
  const card = page
    .getByRole('article')
    .filter({ has: page.getByRole('heading', { name: 'Core i5-12400', exact: true }) })
  await expect(card.getByRole('button', { name: 'Adicionar à Build' })).toBeDisabled()
  await expect(card.getByText(/socket/i)).toBeVisible()
})

test('trocar para placa DDR4 aplica na hora e manda CPU, RAM e a placa antiga para a Bandeja', async ({
  page,
}) => {
  await adicionar(page, 'b650m aorus')
  await adicionar(page, 'ryzen 7600')
  await adicionar(page, 'vengeance 2x16')

  await adicionar(page, 'b760m')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  const bandeja = page.getByTestId('bandeja')
  await expect(bandeja.getByText('Ryzen 5 7600')).toBeVisible()
  await expect(bandeja.getByText('Vengeance 2x16 GB')).toBeVisible()
  await expect
    .poll(() => orcamentoMedio(page))
    .toBe(normalizar(brl(porId('placa-mae-b760m-ds3h-ddr4').medio)))
  const subtotal = [
    'placa-mae-b650m-aorus-elite',
    'cpu-ryzen-5-7600',
    'ram-corsair-32gb-ddr5-6000',
  ].reduce((t, id) => t + porId(id).medio, 0)
  await expect
    .poll(async () => normalizar((await page.getByTestId('bandeja-subtotal').textContent()) ?? ''))
    .toBe(normalizar(brl(subtotal)))
})
