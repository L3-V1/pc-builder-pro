import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { brl, slot, soma, texto } from './ajudantes.ts'

test.skip(({ isMobile }) => !isMobile, 'só no celular')

const barra = (page: Page) => page.getByRole('button', { name: 'Buscar Peças', exact: true })

async function escolherPeloSlot(page: Page, rotulo: string, termo: string) {
  await page.getByRole('button', { name: `Escolher Peça para ${rotulo}` }).tap()
  await expect(barra(page)).toHaveAttribute('aria-expanded', 'true')
  await page.getByLabel('Buscar', { exact: true }).fill(termo)
  await page.getByRole('button', { name: 'Adicionar à Build' }).first().tap()
  await expect(barra(page)).toHaveAttribute('aria-expanded', 'false')
}

async function abrirPainel(page: Page) {
  await barra(page).tap()
  // Mede as alças só depois da animação de abertura.
  await expect(page.locator('.painel-inferior')).toHaveCSS('transform', 'none')
}

async function centro(locator: Locator) {
  const caixa = await locator.boundingBox()
  if (!caixa) throw new Error('sem caixa')
  return { x: caixa.x + caixa.width / 2, y: caixa.y + caixa.height / 2 }
}

// O Playwright não tem gesto de arraste por toque; vai direto pelo CDP do Chromium.
async function toque(page: Page) {
  const cdp = await page.context().newCDPSession(page)
  const enviar = (
    type: 'touchStart' | 'touchMove' | 'touchEnd',
    pontos: { x: number; y: number }[],
  ) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pontos })
  return {
    inicio: (p: { x: number; y: number }) => enviar('touchStart', [p]),
    async mover(de: { x: number; y: number }, para: { x: number; y: number }, passos: number) {
      for (let i = 1; i <= passos; i++) {
        const t = i / passos
        await enviar('touchMove', [
          { x: de.x + (para.x - de.x) * t, y: de.y + (para.y - de.y) * t },
        ])
      }
    },
    fim: () => enviar('touchEnd', []),
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('monta uma Build completa só tocando nos Slots e em "Adicionar à Build"', async ({ page }) => {
  await escolherPeloSlot(page, 'Placa-mãe', 'b650m aorus')
  await escolherPeloSlot(page, 'Socket da CPU', 'ryzen 7600')
  await escolherPeloSlot(page, 'Slot DIMM 1', 'vengeance 2x16')
  await escolherPeloSlot(page, 'Slot M.2 1', 'sn850x 1 tb')
  await escolherPeloSlot(page, 'Slot PCIe x16', 'rtx 4060')
  await escolherPeloSlot(page, 'Fonte', 'cx650')
  await escolherPeloSlot(page, 'Gabinete', 'h5 flow')

  await expect(page.getByText('Build completa')).toBeVisible()
  const total = soma(
    'placa-mae-b650m-aorus-elite',
    'cpu-ryzen-5-7600',
    'ram-corsair-32gb-ddr5-6000',
    'armazenamento-nvme-1tb',
    'gpu-rtx-4060',
    'fonte-cx650',
    'gabinete-nzxt-h5-flow',
  )
  await expect.poll(() => texto(page.getByTestId('orcamento-medio'))).toBe(brl(total))
})

test('toque longo na alça e arraste até o Slot encaixa a Peça', async ({ page }) => {
  await abrirPainel(page)
  await page.getByLabel('Buscar', { exact: true }).fill('b650m aorus')
  const alca = page.getByRole('button', { name: 'Arrastar B650M Aorus Elite' })
  const de = await centro(alca)
  const para = await centro(slot(page, 'placa-mae'))

  const dedo = await toque(page)
  await dedo.inicio(de)
  await page.waitForTimeout(350)
  await dedo.mover(de, para, 15)
  await dedo.fim()

  await expect(slot(page, 'placa-mae')).toContainText('B650M Aorus Elite')
  await expect(barra(page)).toHaveAttribute('aria-expanded', 'false')
})

// O Chromium headless não rola a página com toques sintéticos, então o teste confere as
// condições da rolagem nativa: o gesto rápido não vira arraste, a alça deixa o navegador
// fazer pan (touch-action) e a lista do painel é rolável.
test('deslizar rápido sobre a alça não inicia arraste e a lista continua rolável', async ({
  page,
}) => {
  await abrirPainel(page)
  const lista = page.locator('.painel-inferior__conteudo')
  // A roda vem antes dos toques: depois de toques sintéticos o headless ignora a roda.
  const meio = await centro(lista)
  await page.mouse.move(meio.x, meio.y)
  await page.mouse.wheel(0, 300)
  await expect
    .poll(() => lista.evaluate((el) => (el as unknown as { scrollTop: number }).scrollTop))
    .toBeGreaterThan(0)

  const alca = page.getByRole('button', { name: /^Arrastar / }).nth(1)
  await expect(alca).toHaveCSS('touch-action', 'manipulation')
  const de = await centro(alca)
  const dedo = await toque(page)
  await dedo.inicio(de)
  await dedo.mover(de, { x: de.x, y: de.y - 250 }, 6)
  await expect(page.locator('.alca-arraste--arrastando')).toHaveCount(0)
  await dedo.fim()
  await expect(barra(page)).toHaveAttribute('aria-expanded', 'true')
})

test.describe('em 360 px', () => {
  test.use({ viewport: { width: 360, height: 780 } })

  test('a página não rola na horizontal', async ({ page }) => {
    await escolherPeloSlot(page, 'Placa-mãe', 'b650m aorus')
    await escolherPeloSlot(page, 'Socket da CPU', 'ryzen 7600')
    const sobra = await page.evaluate(
      'document.documentElement.scrollWidth - document.documentElement.clientWidth',
    )
    expect(sobra).toBeLessThanOrEqual(0)
  })
})
