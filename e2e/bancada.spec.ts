import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import armazenamento from '../src/catalogo/dados/armazenamento.json' with { type: 'json' }
import cpu from '../src/catalogo/dados/cpu.json' with { type: 'json' }
import fonte from '../src/catalogo/dados/fonte.json' with { type: 'json' }
import gabinete from '../src/catalogo/dados/gabinete.json' with { type: 'json' }
import gpu from '../src/catalogo/dados/gpu.json' with { type: 'json' }
import placaMae from '../src/catalogo/dados/placa-mae.json' with { type: 'json' }
import ram from '../src/catalogo/dados/ram.json' with { type: 'json' }

const todas = [...cpu, ...placaMae, ...ram, ...gpu, ...armazenamento, ...fonte, ...gabinete]
const medio = (id: string) => {
  const p = todas.find((x) => x.id === id)
  if (!p) throw new Error(`Peça ${id} não existe`)
  return p.faixaPreco.medio
}
const soma = (...ids: string[]) => ids.reduce((t, id) => t + medio(id), 0)
const normalizar = (s: string) => s.replace(/\s/g, ' ')
const brl = (v: number) =>
  normalizar(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v))

const slot = (page: Page, id: string) => page.locator(`[data-slot="${id}"]`)

async function texto(locator: Locator) {
  return normalizar((await locator.textContent()) ?? '')
}

async function pesquisar(page: Page, termo: string) {
  await page.getByLabel('Buscar', { exact: true }).fill(termo)
}

function alcaNaBusca(page: Page) {
  return page
    .locator('.app__resultados')
    .getByRole('button', { name: /^Arrastar / })
    .first()
}

// O PointerSensor só ativa depois de 5 px, então o movimento é feito em passos.
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
  await arrastarDaBusca(page, 'sn850x', slot(page, 'm2-1'))
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
  await arrastarDaBusca(page, 'b760m', slot(page, 'placa-mae'))

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

  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('ArrowRight')
    if ((await slot(page, 'cpu').getAttribute('class'))?.includes('slot--sobre')) break
  }
  await expect(slot(page, 'cpu')).toHaveClass(/slot--sobre/)
  await page.keyboard.press('Space')

  await expect(slot(page, 'cpu')).toContainText('Ryzen 5 7600')
})
