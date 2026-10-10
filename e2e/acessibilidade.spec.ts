import { AxeBuilder } from '@axe-core/playwright'
import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { adicionar, esperarBusca, pesquisar, test } from './ajudantes.ts'

async function semViolacoes(page: Page) {
  // Durante a busca a lista fica esmaecida de propósito; o contraste vale para a lista assentada.
  await esperarBusca(page)
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  const resumo = violations.map((v) => ({
    regra: v.id,
    alvos: v.nodes.slice(0, 5).map((n) => n.target.join(' ')),
  }))
  expect(resumo).toEqual([])
}

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`acessibilidade (${colorScheme})`, () => {
    test.use({ colorScheme })

    test.beforeEach(async ({ page }) => {
      await page.goto('/')
    })

    test('Build livre vazia', async ({ page }) => {
      await semViolacoes(page)
    })

    test('Build com Peças e Peça bloqueada visível na busca', async ({ page }) => {
      await adicionar(page, 'b650m aorus')
      await adicionar(page, 'ryzen 7600')
      await adicionar(page, 'vengeance 2x16', 'Vengeance 2x16 GB')
      await pesquisar(page, '12400')
      await expect(page.getByText('Incompatível').first()).toBeVisible()
      await semViolacoes(page)
    })

    test('tela de Desafios', async ({ page }) => {
      await page.getByRole('tab', { name: 'Desafios' }).click()
      await semViolacoes(page)
    })

    test('tela de conclusão de um Desafio', async ({ page }) => {
      await page.getByRole('tab', { name: 'Desafios' }).click()
      await page
        .getByRole('article', { name: 'Primeiro PC' })
        .getByRole('button', { name: /Iniciar|Continuar/ })
        .click()
      await adicionar(page, 'h610m')
      await adicionar(page, '12400', 'Core i5-12400')
      for (const termo of ['1x8', 'a400 240', 'mwe 450', 'cube matx']) {
        await adicionar(page, termo)
      }
      await page.getByRole('button', { name: 'Ligar o PC' }).click()
      await expect(page.getByRole('dialog', { name: 'Desafio concluído' })).toBeVisible()
      await semViolacoes(page)
    })
  })
}

test('o foco pelo teclado fica visível com a cor de foco do tema', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Buscar', { exact: true }).focus()
  await page.keyboard.press('Tab')
  const focado = page.locator(':focus')
  await expect(focado).toHaveCSS('outline-style', 'solid')
  await expect(focado).toHaveCSS('outline-width', '2px')
  await expect(focado).toHaveCSS('outline-color', 'rgb(58, 79, 208)')
})
