import { AxeBuilder } from '@axe-core/playwright'
import { expect } from '@playwright/test'
import type { Page, Route } from '@playwright/test'
import { test } from './ajudantes.ts'

const DADOS = '**/dados/*.json'
const carregando = (page: Page) =>
  page.getByRole('status').filter({ hasText: 'Carregando o Catálogo…' })
const busca = (page: Page) => page.getByLabel('Buscar', { exact: true })

async function semViolacoes(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  expect(violations.map((v) => v.id)).toEqual([])
}

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`carregamento do Catálogo (${colorScheme})`, () => {
    test.use({ colorScheme })

    test('com dados/ atrasado, a tela de carregamento aparece antes da montagem', async ({
      page,
    }) => {
      // Dado um servidor que segura os dados até ser liberado
      let liberar = () => {}
      const portao = new Promise<void>((r) => (liberar = r))
      const atrasar = async (rota: Route) => {
        await portao
        await rota.fallback()
      }
      await page.route(DADOS, atrasar)
      // Quando o app abre
      await page.goto('/')
      // Então a tela de carregamento aparece, sem a busca, e passa no axe
      await expect(carregando(page)).toBeVisible()
      await expect(busca(page)).toHaveCount(0)
      await semViolacoes(page)
      // E, liberados os dados, a montagem aparece
      liberar()
      await expect(page.getByRole('tab', { name: 'Desafios' })).toBeVisible()
      await expect(carregando(page)).toHaveCount(0)
    })

    test('com dados/ fora do ar, aparece a tela de erro e "Tentar de novo" carrega o app', async ({
      page,
    }) => {
      // Dado que os dados não respondem
      const abortar = (rota: Route) => rota.abort('failed')
      await page.route(DADOS, abortar)
      await page.goto('/')
      // Então aparece a tela de erro, que passa no axe
      const alerta = page.getByRole('alert')
      await expect(alerta).toContainText('Não foi possível carregar o Catálogo')
      await semViolacoes(page)
      // Quando a rota volta e o usuário clica "Tentar de novo"
      await page.unroute(DADOS, abortar)
      await page.getByRole('button', { name: 'Tentar de novo' }).click()
      // Então o app carrega
      await expect(page.getByRole('tab', { name: 'Desafios' })).toBeVisible()
      await expect(alerta).toHaveCount(0)
    })
  })
}
