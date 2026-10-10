import { readFileSync, readdirSync } from 'node:fs'
import { expect, test } from '@playwright/test'

// O GitHub Pages serve o app num subcaminho (/pc-builder-pro/); com caminhos relativos o
// mesmo build funciona lá e no preview local.
test('o build referencia os assets por caminho relativo', () => {
  const html = readFileSync('dist/index.html', 'utf-8')
  const caminhos = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1])
  expect(caminhos.length).toBeGreaterThan(0)
  for (const caminho of caminhos) expect(caminho).toMatch(/^\.\//)
})

// O Catálogo é buscado em dados/*.json; nenhuma Peça pode vir embutida no JavaScript.
test('o bundle não contém nenhum ID de Peça de public/dados/', () => {
  const ids = readdirSync('public/dados')
    .filter((f) => f !== 'meta.json' && f !== 'aliases.json')
    .flatMap((f) => JSON.parse(readFileSync(`public/dados/${f}`, 'utf-8')) as { id: string }[])
    .map((p) => p.id)
  expect(ids.length).toBeGreaterThan(0)
  const scripts = readdirSync('dist/assets').filter((f) => f.endsWith('.js'))
  expect(scripts.length).toBeGreaterThan(0)
  const bundle = scripts.map((f) => readFileSync(`dist/assets/${f}`, 'utf-8')).join('\n')
  expect(ids.filter((id) => bundle.includes(id))).toEqual([])
})
