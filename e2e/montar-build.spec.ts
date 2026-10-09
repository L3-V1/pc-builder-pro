import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { adicionar, brl, faixaPreco, normalizar, pesquisar, texto } from './ajudantes.ts'

const porId = faixaPreco
const orcamentoMedio = (page: Page) => texto(page.getByTestId('orcamento-medio'))

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
  await adicionar(page, 'vengeance 2x16', 'Vengeance 2x16 GB')
  await adicionar(page, 'sn850x 1 tb')
  await adicionar(page, 'rtx 4060', 'GeForce RTX 4060')
  await adicionar(page, 'cx650')
  await adicionar(page, 'h5 flow')

  const faixa = ids.map(porId)
  const soma = (k: 'min' | 'medio' | 'max') => faixa.reduce((t, f) => t + f[k], 0)

  await expect(page.getByText('Build completa')).toBeVisible()
  expect(await orcamentoMedio(page)).toBe(normalizar(brl(soma('medio'))))
  const texto = normalizar((await page.getByTestId('orcamento-faixa').textContent()) ?? '')
  expect(texto).toBe(normalizar(`${brl(soma('min'))} – ${brl(soma('max'))}`))

  const pontuacao = page.getByRole('region', { name: 'Pontuação' })
  for (const perfil of ['Jogos', 'Produtividade']) {
    const grupo = pontuacao.getByRole('group', { name: perfil })
    await expect(grupo.getByText(/^\d+\/100$/)).toBeVisible()
    await expect(grupo.getByRole('meter', { name: `Pontuação em ${perfil}` })).toBeVisible()
  }
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
  await adicionar(page, 'vengeance 2x16', 'Vengeance 2x16 GB')

  await adicionar(page, 'b760m ds3h')
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
