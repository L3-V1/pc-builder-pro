import { describe, expect, it } from 'vitest'
import type { Peca } from '../src/catalogo'
import { validarCatalogo } from '../src/catalogo/validar'
import i5 from './teste/amostras/cpu-core-i5-12400.json'
import ryzen from './teste/amostras/cpu-ryzen-5-5600.json'
import fx from './teste/amostras/cpu-fx-8350-am3.json'
import ak400 from './teste/amostras/cooler-deepcool-ak400.json'
import strix from './teste/amostras/gpu-asus-rog-strix-rtx-4060.json'
import { ErroMontagem, montarCatalogo } from './montar'
import type { EntradaMontagem } from './montar'

const faixa = (medio: number) => ({ min: medio - 10, medio, max: medio + 10 })

const legadoCpu: Peca = {
  id: 'cpu-ryzen-5-5600',
  nome: 'Ryzen 5 5600',
  marca: 'AMD',
  faixaPreco: faixa(650),
  categoria: 'cpu',
  socket: 'AM4',
  nucleos: 6,
  threads: 12,
  consumoW: 65,
  videoIntegrado: false,
  coolerBox: true,
  indices: { jogos: 62, produtividade: 26 },
}
const legadoCooler: Peca = {
  id: 'cooler-deepcool-ak400',
  nome: 'AK400',
  marca: 'DeepCool',
  faixaPreco: faixa(200),
  categoria: 'cooler',
  tipo: 'ar',
  socketsSuportados: ['AM4'],
}

function entrada(mudar: Partial<EntradaMontagem> = {}): EntradaMontagem {
  return {
    registros: { cpu: [ryzen, i5], cooler: [ak400], gpu: [strix] },
    indices: { cpu: { 'ryzen-5-5600': { jogos: 62, produtividade: 26 } }, gpu: {} },
    pares: [
      { idAntigo: 'cpu-ryzen-5-5600', opendbId: ryzen.opendb_id },
      { idAntigo: 'cooler-deepcool-ak400', opendbId: ak400.opendb_id },
    ],
    legado: { dataReferencia: '2026-10', pecas: [legadoCpu, legadoCooler] },
    ...mudar,
  }
}

describe('montarCatalogo', () => {
  it('só inclui Peças com par no legado e aplica a Faixa de preço do ID antigo', () => {
    const { catalogo } = montarCatalogo(entrada())
    expect(catalogo.dataReferencia).toBe('2026-10')
    expect(catalogo.pecas.map((p) => p.nome)).toEqual([
      'Ryzen 5 5600',
      'AK400 Air 155mm Black / Silver',
    ])
    expect(catalogo.pecas.map((p) => p.faixaPreco)).toEqual([faixa(650), faixa(200)])
    expect(catalogo.pecas[0]).toEqual({
      id: 'cpu-amd-ryzen-5-5600',
      nome: 'Ryzen 5 5600',
      marca: 'AMD',
      faixaPreco: faixa(650),
      categoria: 'cpu',
      socket: 'AM4',
      nucleos: 6,
      threads: 12,
      consumoW: 65,
      videoIntegrado: false,
      coolerBox: true,
      indices: { jogos: 62, produtividade: 26 },
    })
  })

  it('exclui CPU/GPU sem Índice e registra o motivo no relatório', () => {
    const legadoI5: Peca = { ...legadoCpu, id: 'cpu-core-i5-12400', faixaPreco: faixa(700) }
    const comI5 = entrada({
      pares: [...entrada().pares, { idAntigo: legadoI5.id, opendbId: i5.opendb_id }],
      legado: { dataReferencia: '2026-10', pecas: [legadoCpu, legadoI5, legadoCooler] },
    })
    const erro = capturar(() => montarCatalogo(comI5))
    expect(erro.naoResolvidos).toEqual([
      { idAntigo: 'cpu-core-i5-12400', motivo: 'sem Índice: core-i5-12400' },
    ])
    expect(erro.relatorio.cpu.semIndice).toEqual(['core-i5-12400'])
  })
  it('aplica Índices de GPU por chipset e a fonteRecomendadaW da curadoria', () => {
    const legadoGpu: Peca = {
      id: 'gpu-rtx-4060',
      nome: 'GeForce RTX 4060',
      marca: 'NVIDIA',
      faixaPreco: faixa(1900),
      categoria: 'gpu',
      consumoW: 115,
      vramGB: 8,
      fonteRecomendadaW: 550,
      indices: { jogos: 40, produtividade: 30 },
    }
    const { catalogo } = montarCatalogo(
      entrada({
        indices: {
          cpu: entrada().indices.cpu,
          gpu: { 'GeForce RTX 4060': { jogos: 41, produtividade: 31, fonteRecomendadaW: 500 } },
        },
        pares: [{ idAntigo: legadoGpu.id, opendbId: strix.opendb_id }],
        legado: { dataReferencia: '2026-10', pecas: [legadoGpu] },
      }),
    )
    expect(catalogo.pecas).toEqual([
      {
        id: 'gpu-asus-rog-strix-geforce-rtx-4060-8gb-gddr6-black',
        nome: 'ROG Strix GeForce RTX 4060 8GB GDDR6 Black',
        marca: 'ASUS',
        faixaPreco: faixa(1900),
        categoria: 'gpu',
        consumoW: 115,
        vramGB: 8,
        fonteRecomendadaW: 500,
        indices: { jogos: 41, produtividade: 31 },
      },
    ])
  })
  it('gera aliases do ID antigo para o slug novo em todo par', () => {
    expect(montarCatalogo(entrada()).catalogo.aliases).toEqual({
      'cpu-ryzen-5-5600': 'cpu-amd-ryzen-5-5600',
      'cooler-deepcool-ak400': 'cooler-deepcool-ak400-air-155mm-black-silver',
    })
  })
  it('falha listando os IDs antigos sem Peça normalizada', () => {
    const semPar: Peca = { ...legadoCooler, id: 'cooler-sem-par' }
    const descartado: Peca = { ...legadoCooler, id: 'cooler-descartado' }
    const sumido: Peca = { ...legadoCooler, id: 'cooler-sumido' }
    const erro = capturar(() =>
      montarCatalogo(
        entrada({
          registros: {
            ...entrada().registros,
            cooler: [ak400, { ...ak400, opendb_id: 'x-ruim', water_cooled: null }],
          },
          pares: [
            ...entrada().pares,
            { idAntigo: descartado.id, opendbId: 'x-ruim' },
            { idAntigo: sumido.id, opendbId: 'x-inexistente' },
          ],
          legado: { dataReferencia: '2026-10', pecas: [legadoCpu, semPar, descartado, sumido] },
        }),
      ),
    )
    expect(erro.naoResolvidos).toEqual([
      { idAntigo: 'cooler-sem-par', motivo: 'sem par na curadoria' },
      { idAntigo: 'cooler-descartado', motivo: 'descartada: spec faltando: tipo' },
      { idAntigo: 'cooler-sumido', motivo: 'opendb_id não encontrado: x-inexistente' },
    ])
    expect(erro.message).toContain('- cooler-sem-par: sem par na curadoria')
  })
  it('mantém a ordem do legado na saída', () => {
    const invertido = entrada({
      legado: { dataReferencia: '2026-10', pecas: [legadoCooler, legadoCpu] },
    })
    expect(montarCatalogo(invertido).catalogo.pecas.map((p) => p.categoria)).toEqual([
      'cooler',
      'cpu',
    ])
  })
  it('a saída passa em validarCatalogo, mesmo com slugs que colidem', () => {
    const gemeo = { ...ak400, opendb_id: 'ffffffff-0000-0000-0000-000000000000' }
    const legadoGemeo: Peca = { ...legadoCooler, id: 'cooler-gemeo' }
    const { catalogo } = montarCatalogo(
      entrada({
        registros: { ...entrada().registros, cooler: [ak400, gemeo] },
        pares: [...entrada().pares, { idAntigo: legadoGemeo.id, opendbId: gemeo.opendb_id }],
        legado: { dataReferencia: '2026-10', pecas: [legadoCpu, legadoCooler, legadoGemeo] },
      }),
    )
    expect(validarCatalogo(catalogo)).toEqual({ ok: true, catalogo })
    expect(catalogo.aliases['cooler-gemeo']).toBe(
      'cooler-deepcool-ak400-air-155mm-black-silver-ffffffff',
    )
    expect(catalogo.aliases['cooler-deepcool-ak400']).toBe(
      'cooler-deepcool-ak400-air-155mm-black-silver-010abcce',
    )
  })
  it('relatório conta normalizadas, descartadas por motivo e sem preço, por Categoria', () => {
    const { relatorio } = montarCatalogo(
      entrada({ registros: { ...entrada().registros, cpu: [ryzen, i5, fx] } }),
    )
    expect(relatorio.cpu).toEqual({
      normalizadas: 2,
      descartadas: { 'socket não suportado: AM3+': 1 },
      semPreco: 1,
      semIndice: [],
    })
    expect(relatorio.gpu).toEqual({ normalizadas: 1, descartadas: {}, semPreco: 1, semIndice: [] })
    expect(relatorio.cooler).toEqual({
      normalizadas: 1,
      descartadas: {},
      semPreco: 0,
      semIndice: [],
    })
    expect(relatorio.ram).toEqual({ normalizadas: 0, descartadas: {}, semPreco: 0, semIndice: [] })
  })
})

function capturar(f: () => unknown): ErroMontagem {
  try {
    f()
  } catch (e) {
    if (e instanceof ErroMontagem) return e
    throw e
  }
  throw new Error('esperava ErroMontagem')
}
