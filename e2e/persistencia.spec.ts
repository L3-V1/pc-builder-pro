import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { adicionar, aviso, fecharBusca, normalizar, pesquisar, test } from './ajudantes.ts'

async function texto(page: Page, testId: string) {
  return normalizar((await page.getByTestId(testId).textContent()) ?? '')
}

async function definirMeta(page: Page, valor: string) {
  await fecharBusca(page)
  const campo = page.getByLabel('Meta de orçamento (R$)')
  await campo.fill(valor)
  await campo.press('Enter')
}

async function montarBuild(page: Page) {
  await adicionar(page, 'b650m aorus')
  await adicionar(page, 'ryzen 7600')
  await adicionar(page, 'vengeance 2x16', 'Vengeance 2x16 GB')
  await adicionar(page, 'rtx 4060', 'GeForce RTX 4060')
}

test('recarregar mantém Build, Bandeja, Meta e Orçamento', async ({ page }) => {
  await page.goto('/')
  await montarBuild(page)
  await pesquisar(page, 'cx650')
  await page.getByRole('button', { name: 'Para a Bandeja' }).first().click()
  await definirMeta(page, '5.000')
  await expect(page.getByRole('meter', { name: 'Orçamento em relação à Meta' })).toBeVisible()

  const orcamento = await texto(page, 'orcamento-medio')
  const faixa = await texto(page, 'orcamento-faixa')
  await page.reload()

  await expect(page.getByRole('group', { name: 'Socket da CPU' })).toContainText('Ryzen 5 7600')
  await expect(page.getByTestId('bandeja')).toContainText('CX650')
  await expect(page.getByLabel('Meta de orçamento (R$)')).toHaveValue('5.000')
  expect(await texto(page, 'orcamento-medio')).toBe(orcamento)
  expect(await texto(page, 'orcamento-faixa')).toBe(faixa)
})

test('o link copiado, aberto num contexto novo, reproduz a mesma Build, Orçamento e Meta', async ({
  browser,
  context,
  page,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/')
  await montarBuild(page)
  await definirMeta(page, '4.000')
  await page.getByRole('button', { name: 'Copiar link' }).click()
  await expect(aviso(page)).toHaveText('Link copiado')
  // O e2e compila sem os tipos de DOM, então o script vai como texto.
  const link = String(await page.evaluate('navigator.clipboard.readText()'))
  expect(link).toMatch(/#b=.+&m=4000$/)

  const outro = await browser.newContext()
  const nova = await outro.newPage()
  await nova.goto(link)
  await expect(aviso(nova)).toHaveText('Build do link carregada.')
  expect(await texto(nova, 'orcamento-medio')).toBe(await texto(page, 'orcamento-medio'))
  expect(await texto(nova, 'orcamento-faixa')).toBe(await texto(page, 'orcamento-faixa'))
  await expect(nova.getByLabel('Meta de orçamento (R$)')).toHaveValue('4.000')
  await expect(nova.getByRole('group', { name: 'Socket da CPU' })).toContainText('Ryzen 5 7600')
  await outro.close()
})

test('um link com ID inexistente avisa e monta o resto', async ({ page }) => {
  await page.goto('/#b=placa-mae-b650m-aorus-elite,cpu-que-sumiu,cpu-ryzen-5-7600')
  await expect(aviso(page)).toHaveText(
    'Build do link carregada. 1 Peça do link não existe mais no Catálogo.',
  )
  await expect(page.getByRole('group', { name: 'Socket da CPU' })).toContainText('Ryzen 5 7600')
})

test('depois de abrir um link a URL fica sem hash e recarregar não repete o aviso', async ({
  page,
}) => {
  await page.goto('/#b=placa-mae-b650m-aorus-elite,cpu-ryzen-5-7600&m=3000')
  await expect(aviso(page)).toHaveText('Build do link carregada.')
  await expect.poll(() => new URL(page.url()).hash).toBe('')

  await page.reload()
  await expect(page.getByRole('group', { name: 'Socket da CPU' })).toContainText('Ryzen 5 7600')
  await expect(page.getByLabel('Meta de orçamento (R$)')).toHaveValue('3.000')
  await expect(aviso(page)).toHaveText('')
})
