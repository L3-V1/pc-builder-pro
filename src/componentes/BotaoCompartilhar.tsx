import { useEffect, useRef, useState } from 'react'
import type { Build } from '../motor'
import { pecasDaBuild } from '../motor'
import { codificarLink } from '../persistencia'
import './BotaoCompartilhar.css'

type Props = { build: Build; meta?: number; onCopiado: () => void }

export function BotaoCompartilhar({ build, meta, onCopiado }: Props) {
  const [linkManual, setLinkManual] = useState<string>()
  const campo = useRef<HTMLInputElement>(null)
  const ids = pecasDaBuild(build).map((p) => p.id)
  const vazio = ids.length === 0 && meta === undefined

  useEffect(() => {
    campo.current?.focus()
    campo.current?.select()
  }, [linkManual])

  const copiar = async () => {
    const link = `${location.origin}${location.pathname}#${codificarLink(ids, meta)}`
    try {
      // Sem contexto seguro, navigator.clipboard não existe e a chamada lança.
      await navigator.clipboard.writeText(link)
    } catch {
      setLinkManual(link)
      return
    }
    setLinkManual(undefined)
    onCopiado()
  }

  return (
    <div className="compartilhar">
      <button type="button" disabled={vazio} onClick={copiar}>
        Copiar link
      </button>
      {linkManual && (
        <label className="compartilhar__manual">
          Copie o link abaixo
          <input ref={campo} type="text" readOnly value={linkManual} />
        </label>
      )}
    </div>
  )
}
