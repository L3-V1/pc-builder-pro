import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { adicionar, test } from './ajudantes.ts'

async function abrirDesafio(page: Page, titulo: string) {
  await page.getByRole('tab', { name: 'Desafios' }).click()
  await page
    .getByRole('article', { name: titulo })
    .getByRole('button', { name: /Iniciar|Continuar/ })
    .click()
}

const painelDesafio = (page: Page, titulo: string) =>
  page.getByRole('region', { name: `Desafio: ${titulo}` })

test('conclui Primeiro PC de ponta a ponta sem mexer na Build livre', async ({ page }) => {
  await page.goto('/')
  await adicionar(page, 'b650m aorus')
  await adicionar(page, 'ryzen 7600')

  await abrirDesafio(page, 'Primeiro PC')
  const painel = painelDesafio(page, 'Primeiro PC')
  await expect(painel).toContainText('1 de 2 critérios')
  await expect(painel.getByRole('button', { name: 'Ligar o PC' })).toBeDisabled()

  await adicionar(page, 'h610m')
  await adicionar(page, '12400', 'Core i5-12400')
  await adicionar(page, '1x8')
  await adicionar(page, 'a400 240')
  await adicionar(page, 'mwe 450')
  await adicionar(page, 'cube matx')

  await expect(painel).toContainText('2 de 2 critérios')
  await expect(painel.getByRole('listitem')).toHaveText([
    /^Cumprido: Checklist completa$/,
    /^Cumprido: Orçamento até/,
  ])
  await painel.getByRole('button', { name: 'Ligar o PC' }).click()
  const dialogo = page.getByRole('dialog', { name: 'Desafio concluído' })
  await expect(dialogo).toBeVisible()
  await expect(dialogo).toContainText('Primeiro PC')

  await page.reload()
  await page.getByRole('tab', { name: 'Desafios' }).click()
  await expect(page.getByRole('article', { name: 'Primeiro PC' })).toContainText('Concluído')
  await page.getByRole('tab', { name: 'Montagem livre' }).click()
  await expect(page.getByRole('group', { name: 'Socket da CPU' })).toContainText('Ryzen 5 7600')
  await expect(page.getByRole('group', { name: 'Placa-mãe' })).toContainText('B650M Aorus Elite')
})

test('o progresso de um Desafio não concluído sobrevive ao recarregamento', async ({ page }) => {
  await page.goto('/')
  await abrirDesafio(page, 'Gamer de entrada')
  await adicionar(page, 'b760m ds3h')
  await adicionar(page, 'rx 6600')

  await page.reload()
  await expect(painelDesafio(page, 'Gamer de entrada')).toBeVisible()
  await expect(page.getByRole('group', { name: 'Placa-mãe' })).toContainText('B760M DS3H')
  await expect(page.getByRole('group', { name: 'Slot PCIe x16' })).toContainText('RX 6600')
  await expect(page.getByLabel('Meta do Desafio (R$)')).toHaveValue('5.000')

  await page.getByRole('tab', { name: 'Desafios' }).click()
  const card = page.getByRole('article', { name: 'Gamer de entrada' })
  await expect(card.getByRole('button', { name: 'Continuar' })).toBeVisible()
  await expect(card).not.toContainText('Concluído')
})
