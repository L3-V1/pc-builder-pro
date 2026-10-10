import { expect } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { brl, medio, pesquisar, slot, soma, texto, test } from './ajudantes.ts'

// Arraste com mouse e teclado na Bancada; o arraste por toque fica em celular.spec.ts.
test.skip(({ isMobile }) => isMobile, 'só no desktop')

function alcaNaBusca(page: Page) {
  return page
    .locator('.app__resultados')
    .getByRole('button', { name: /^Arrastar / })
    .first()
}

// O MouseSensor só ativa depois de 5 px, então o movimento é feito em passos.
async function pegar(page: Page, origem: Locator) {
  await origem.hover()
  const caixa = await origem.boundingBox()
  if (!caixa) throw new Error('origem sem caixa')
  await page.mouse.down()
  await page.mouse.move(caixa.x + caixa.width / 2 + 10, caixa.y + caixa.height / 2 + 10, {
    steps: 5,
  })
}

async function levar(page: Page, destino: Locator) {
  const caixa = await destino.boundingBox()
  if (!caixa) throw new Error('destino sem caixa')
  await page.mouse.move(caixa.x + caixa.width / 2, caixa.y + caixa.height / 2, { steps: 12 })
}

async function arrastar(page: Page, origem: Locator, destino: Locator) {
  await pegar(page, origem)
  await levar(page, destino)
  await page.mouse.up()
}

async function arrastarDaBusca(page: Page, termo: string, destino: Locator) {
  await pesquisar(page, termo)
  await arrastar(page, alcaNaBusca(page), destino)
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('monta uma Build completa só arrastando da busca para os Slots', async ({ page }) => {
  await arrastarDaBusca(page, 'b650m aorus', slot(page, 'placa-mae'))
  await expect(slot(page, 'cpu')).toBeVisible()
  await arrastarDaBusca(page, 'ryzen 7600', slot(page, 'cpu'))
  await arrastarDaBusca(page, 'vengeance 2x16', slot(page, 'dimm-1'))
  await arrastarDaBusca(page, 'sn850x 1 tb', slot(page, 'm2-1'))
  await arrastarDaBusca(page, 'rtx 4060', slot(page, 'gpu'))
  await arrastarDaBusca(page, 'cx650', slot(page, 'fonte'))
  await arrastarDaBusca(page, 'h5 flow', slot(page, 'gabinete'))

  await expect(slot(page, 'dimm-2')).toContainText('Vengeance 2x16 GB')
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

test('arrastar CPU de outro socket deixa o socket vermelho, e soltar não encaixa', async ({
  page,
}) => {
  await arrastarDaBusca(page, 'b650m aorus', slot(page, 'placa-mae'))
  await pesquisar(page, 'core i5-12400')
  const alca = page.getByRole('button', { name: 'Arrastar Core i5-12400', exact: true })
  await pegar(page, alca)
  await levar(page, slot(page, 'cpu'))
  await expect(slot(page, 'cpu')).toHaveAttribute('data-estado', 'bloqueado')
  await expect(slot(page, 'dimm-1')).toHaveAttribute('data-estado', 'neutro')
  await page.mouse.up()
  await expect(slot(page, 'cpu')).toHaveClass(/slot--recusado/)

  await expect(slot(page, 'cpu')).not.toContainText('Core i5-12400')
  await expect(page.getByRole('main').getByRole('status')).toContainText(/socket/)
})

test('da busca para a Bandeja e da Bandeja para o Slot, com subtotal atualizado', async ({
  page,
}) => {
  await arrastarDaBusca(page, 'b650m aorus', slot(page, 'placa-mae'))
  const bandeja = page.getByTestId('bandeja')
  await arrastarDaBusca(page, 'ryzen 7600', bandeja)
  await expect(bandeja.getByText('Ryzen 5 7600')).toBeVisible()
  await expect
    .poll(() => texto(page.getByTestId('bandeja-subtotal')))
    .toBe(brl(medio('cpu-ryzen-5-7600')))

  await arrastar(
    page,
    bandeja.getByRole('button', { name: 'Arrastar Ryzen 5 7600' }),
    slot(page, 'cpu'),
  )
  await expect(slot(page, 'cpu')).toContainText('Ryzen 5 7600')
  await expect(bandeja.getByText('Ryzen 5 7600')).toHaveCount(0)
  await expect.poll(() => texto(page.getByTestId('bandeja-subtotal'))).toBe(brl(0))
})

test('trocar a placa-mãe por arraste manda as incompatíveis para a Bandeja', async ({ page }) => {
  await arrastarDaBusca(page, 'b650m aorus', slot(page, 'placa-mae'))
  await arrastarDaBusca(page, 'ryzen 7600', slot(page, 'cpu'))
  await arrastarDaBusca(page, 'vengeance 2x16', slot(page, 'dimm-1'))
  await arrastarDaBusca(page, 'b760m ds3h', slot(page, 'placa-mae'))

  await expect(slot(page, 'placa-mae')).toContainText('B760M DS3H')
  await expect(slot(page, 'cpu')).not.toContainText('Ryzen 5 7600')
  await expect
    .poll(() => texto(page.getByTestId('orcamento-medio')))
    .toBe(brl(medio('placa-mae-b760m-ds3h-ddr4')))
  await expect
    .poll(() => texto(page.getByTestId('bandeja-subtotal')))
    .toBe(
      brl(soma('placa-mae-b650m-aorus-elite', 'cpu-ryzen-5-7600', 'ram-corsair-32gb-ddr5-6000')),
    )
})

test('teclado: Espaço pega, setas levam ao socket e Espaço encaixa', async ({ page }) => {
  await arrastarDaBusca(page, 'b650m aorus', slot(page, 'placa-mae'))
  await pesquisar(page, 'ryzen 7600')
  await alcaNaBusca(page).focus()
  await page.keyboard.press('Space')

  // O dnd-kit mede os destinos e atualiza o "sobre" de forma assíncrona: uma seta por vez,
  // esperando o estado assentar antes da próxima, até chegar ao socket.
  await expect(async () => {
    if (!(await slot(page, 'cpu').getAttribute('class'))?.includes('slot--sobre')) {
      await page.keyboard.press('ArrowRight')
    }
    await expect(slot(page, 'cpu')).toHaveClass(/slot--sobre/, { timeout: 300 })
  }).toPass()
  await page.keyboard.press('Space')

  await expect(slot(page, 'cpu')).toContainText('Ryzen 5 7600')
})
