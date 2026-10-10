import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, rename, rm, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { CAMINHOS, OPENDB_SHA, OPENDB_TARBALL, PASTAS_OPENDB } from '../config'

// Baixa o tarball do commit fixado e extrai só as pastas usadas; com cache, não faz nada.
export async function baixarOpenDb(): Promise<string> {
  const destino = fileURLToPath(CAMINHOS.opendb)
  if (existsSync(destino)) return destino
  const cache = fileURLToPath(CAMINHOS.cache)
  await mkdir(cache, { recursive: true })
  console.log(`Baixando o OpenDB @ ${OPENDB_SHA.slice(0, 7)}…`)
  const resposta = await fetch(OPENDB_TARBALL)
  if (!resposta.ok) throw new Error(`Download do OpenDB falhou: HTTP ${resposta.status}`)
  const tarball = `${cache}opendb-${OPENDB_SHA}.tar.gz`
  await writeFile(tarball, Buffer.from(await resposta.arrayBuffer()))
  const prefixo = `buildcores-open-db-${OPENDB_SHA}`
  const pastas = Object.values(PASTAS_OPENDB).map((p) => `${prefixo}/open-db/${p}`)
  // `tar` do sistema: existe no Ubuntu da CI e no Windows 10+. Caminho relativo ao -C,
  // porque o bsdtar do Windows lê "C:" como host remoto.
  execFileSync('tar', ['-xzf', `opendb-${OPENDB_SHA}.tar.gz`, ...pastas], { cwd: cache })
  await rename(`${cache}${prefixo}/open-db`, destino)
  await rm(`${cache}${prefixo}`, { recursive: true, force: true })
  await rm(tarball, { force: true })
  return destino
}
