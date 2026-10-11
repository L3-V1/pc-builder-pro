import { describe, expect, it } from 'vitest'
import { definirVariavel, escolherModoColeta } from './ambiente'

describe('definirVariavel', () => {
  it('troca o valor da variável e preserva as outras linhas', () => {
    const antes =
      '# Mercado Livre\nML_CLIENT_ID=123\nML_REFRESH_TOKEN=TG-velho\nML_CLIENT_SECRET=s\n'
    expect(definirVariavel(antes, 'ML_REFRESH_TOKEN', 'TG-novo')).toBe(
      '# Mercado Livre\nML_CLIENT_ID=123\nML_REFRESH_TOKEN=TG-novo\nML_CLIENT_SECRET=s\n',
    )
  })

  it('acrescenta a variável no fim quando ela não existe', () => {
    expect(definirVariavel('ML_CLIENT_ID=123', 'ML_REFRESH_TOKEN', 'TG-1')).toBe(
      'ML_CLIENT_ID=123\nML_REFRESH_TOKEN=TG-1\n',
    )
    expect(definirVariavel('', 'ML_REFRESH_TOKEN', 'TG-1')).toBe('ML_REFRESH_TOKEN=TG-1\n')
  })
})

describe('escolherModoColeta', () => {
  const credenciais = { ML_CLIENT_ID: '123', ML_CLIENT_SECRET: 's3cr3t' }

  it('coleta quando as credenciais do Mercado Livre estão preenchidas', () => {
    expect(escolherModoColeta([], credenciais)).toEqual({ coletar: true })
  })

  it('cai no modo sem coleta quando ID e secret estão vazios', () => {
    expect(escolherModoColeta([], { ML_CLIENT_ID: '' })).toEqual({
      coletar: false,
      motivo: 'ML_CLIENT_ID e ML_CLIENT_SECRET vazios, veja .env.example',
    })
  })

  it('com só uma credencial tenta coletar, para o erro de configuração aparecer', () => {
    expect(escolherModoColeta([], { ML_CLIENT_ID: '123' })).toEqual({ coletar: true })
  })

  it('--sem-coleta força o modo sem coleta mesmo com credenciais', () => {
    expect(escolherModoColeta(['--sem-coleta'], credenciais)).toEqual({
      coletar: false,
      motivo: '--sem-coleta',
    })
  })

  it('--exigir-coleta desliga o fallback sem credenciais', () => {
    expect(escolherModoColeta(['--exigir-coleta'], {})).toEqual({ coletar: true })
  })

  it('recusa --sem-coleta junto com --exigir-coleta', () => {
    expect(() => escolherModoColeta(['--sem-coleta', '--exigir-coleta'], {})).toThrow(
      'não podem ser usadas juntas',
    )
  })
})
