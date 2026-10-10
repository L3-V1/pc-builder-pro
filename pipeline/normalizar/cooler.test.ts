import { describe, expect, it } from 'vitest'
import alpine from '../teste/amostras/cooler-arctic-alpine-11.json'
import h100i from '../teste/amostras/cooler-corsair-h100i-elite.json'
import ak400 from '../teste/amostras/cooler-deepcool-ak400.json'
import { normalizarCooler } from './cooler'

describe('normalizarCooler', () => {
  it('mapeia water_cooled e filtra os sockets do app', () => {
    expect(normalizarCooler(ak400)).toEqual({
      ok: true,
      peca: {
        opendbId: '010abcce-a3d8-488c-a89d-9713092820c1',
        categoria: 'cooler',
        marca: 'DeepCool',
        nome: 'AK400 Air 155mm Black / Silver',
        tipo: 'ar',
        socketsSuportados: ['AM4', 'AM5', 'LGA1700', 'LGA1851'],
      },
    })
    expect(normalizarCooler(h100i)).toMatchObject({
      ok: true,
      peca: { tipo: 'water', socketsSuportados: ['AM4', 'AM5', 'LGA1700', 'LGA1851'] },
    })
  })

  it('descarta cooler sem socket do app ou sem water_cooled', () => {
    expect(normalizarCooler(alpine)).toEqual({
      ok: false,
      motivo: 'socket não suportado: LGA 1150, LGA 1151, LGA 1155, LGA 1156, LGA 1200, LGA 775',
    })
    expect(normalizarCooler({ ...ak400, water_cooled: undefined })).toEqual({
      ok: false,
      motivo: 'spec faltando: tipo',
    })
  })
})
