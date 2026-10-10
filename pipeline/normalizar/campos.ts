// Acesso tolerante a registros do OpenDB, que chegam como `unknown`.
export function ler(registro: unknown, caminho: string): unknown {
  return caminho
    .split('.')
    .reduce<unknown>(
      (atual, chave) =>
        typeof atual === 'object' && atual !== null
          ? (atual as Record<string, unknown>)[chave]
          : undefined,
      registro,
    )
}

export function texto(registro: unknown, caminho: string): string | undefined {
  const v = ler(registro, caminho)
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined
}

export function inteiro(registro: unknown, caminho: string): number | undefined {
  const v = ler(registro, caminho)
  return typeof v === 'number' && Number.isInteger(v) && v > 0 ? v : undefined
}

// "AMD Ryzen 5 5600" com fabricante "AMD" → marca "AMD", nome "Ryzen 5 5600".
export function marcaENome(registro: unknown): { marca: string; nome: string } {
  const marca = texto(registro, 'metadata.manufacturer') ?? ''
  const completo = texto(registro, 'metadata.name') ?? ''
  const prefixo = `${marca.toLowerCase()} `
  const nome = completo.toLowerCase().startsWith(prefixo)
    ? completo.slice(prefixo.length).trim()
    : completo
  return { marca, nome }
}

// Campos que toda Peça normalizada carrega, além das specs da Categoria.
export function base(registro: unknown): { opendbId: string; marca: string; nome: string } {
  return { opendbId: texto(registro, 'opendb_id') ?? '', ...marcaENome(registro) }
}

type Exigidos<T> = { [K in keyof T]: Exclude<T[K], undefined> }

// A chave de cada spec é o rótulo que aparece no motivo do descarte.
export function exigir<T extends Record<string, unknown>>(
  specs: T,
): { ok: true; specs: Exigidos<T> } | { ok: false; motivo: string } {
  const falta = Object.keys(specs).find((k) => specs[k] === undefined)
  return falta === undefined
    ? { ok: true, specs: specs as Exigidos<T> }
    : { ok: false, motivo: `spec faltando: ${falta}` }
}

export function lista(registro: unknown, caminho: string): unknown[] {
  const v = ler(registro, caminho)
  return Array.isArray(v) ? v : []
}

export function naoNegativo(registro: unknown, caminho: string): number {
  const v = ler(registro, caminho)
  return typeof v === 'number' && Number.isInteger(v) && v > 0 ? v : 0
}

type Convertidos<T extends Record<string, readonly [string, unknown]>> = {
  [K in keyof T]: Exclude<T[K][1], undefined>
}

// Cada par é [valor bruto do OpenDB, valor convertido para o enum do app ou indefinido].
export function converter<T extends Record<string, readonly [string, unknown]>>(
  pares: T,
): { ok: true; specs: Convertidos<T> } | { ok: false; motivo: string } {
  const specs: Record<string, unknown> = {}
  for (const [rotulo, [bruto, convertido]] of Object.entries(pares)) {
    if (convertido === undefined) return { ok: false, motivo: `${rotulo} não suportado: ${bruto}` }
    specs[rotulo] = convertido
  }
  return { ok: true, specs: specs as Convertidos<T> }
}

// Lista de textos convertida para um enum do app, sem repetições e na ordem do enum.
export function filtrarEnum<T extends string>(
  brutos: string[],
  converter: (valor: string) => T | undefined,
  ordem: readonly T[],
): T[] {
  const aceitos = new Set(brutos.map(converter).filter((v) => v !== undefined))
  return ordem.filter((v) => aceitos.has(v))
}

export function textos(registro: unknown, caminho: string): string[] | undefined {
  const v = ler(registro, caminho)
  if (!Array.isArray(v)) return undefined
  const lista = v.filter((x): x is string => typeof x === 'string')
  return lista.length > 0 ? lista : undefined
}
