import { describe, expect, it } from 'vitest'
import asrock from '../teste/amostras/placa-mae-asrock-b850-pro-rs.json'
import evga from '../teste/amostras/placa-mae-evga-z790-classified-eatx.json'
import asus from '../teste/amostras/placa-mae-asus-b760m-ayw-d4.json'
import { normalizarPlacaMae } from './placaMae'

describe('normalizarPlacaMae', () => {
  it('mapeia "Micro ATX" e conta slots M.2, PCIe x16 e portas SATA', () => {
    expect(normalizarPlacaMae(asus)).toEqual({
      ok: true,
      peca: {
        opendbId: '000deb7d-a2c6-4134-9d33-ffc0508cb277',
        categoria: 'placa-mae',
        marca: 'ASUS',
        nome: 'B760M-AYW WIFI D4 LGA1700 DDR4 Micro-ATX',
        socket: 'LGA1700',
        tipoRam: 'DDR4',
        formFactor: 'Micro-ATX',
        slotsDimm: 2,
        slotsM2: 2,
        slotsPcieX16: 1,
        portasSata: 4,
      },
    })
  })

  it('ignora M.2 key E (Wi-Fi), soma os x16 por quantidade e soma SATA 6 e 3 Gb/s', () => {
    const comSata = { ...asrock, storage_devices: { sata_6_gb_s: 4, sata_3_gb_s: 2, u2: 0 } }
    expect(normalizarPlacaMae(comSata)).toMatchObject({
      ok: true,
      peca: { formFactor: 'ATX', slotsM2: 5, slotsPcieX16: 2, portasSata: 6 },
    })
  })

  it('descarta form factor EATX com motivo "form factor não suportado"', () => {
    expect(normalizarPlacaMae(evga)).toEqual({
      ok: false,
      motivo: 'form factor não suportado: EATX',
    })
  })

  it('descarta placa sem ram_type com motivo "spec faltando"', () => {
    const semRam = { ...asus, memory: { ...asus.memory, ram_type: undefined } }
    expect(normalizarPlacaMae(semRam)).toEqual({ ok: false, motivo: 'spec faltando: tipo de RAM' })
  })

  it('descarta placa com zero portas SATA: o OpenDB usa 0 quando não sabe', () => {
    const semSata = { ...asus, storage_devices: { sata_6_gb_s: 0, sata_3_gb_s: 0, u2: 0 } }
    expect(normalizarPlacaMae(semSata)).toEqual({ ok: false, motivo: 'spec faltando: portas SATA' })
  })
})
