import './Marca.css'

export function Marca() {
  return (
    <div className="marca">
      <svg className="marca__simbolo" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <rect x="4" y="4" width="27" height="27" className="marca__sombra" />
        <rect x="1" y="1" width="27" height="27" className="marca__fundo" />
        <rect x="8" y="8" width="13" height="13" className="marca__chip" />
        <path
          d="M11.5 8V5M14.5 8V5M17.5 8V5M11.5 24v-3M14.5 24v-3M17.5 24v-3M8 11.5H5M8 14.5H5M8 17.5H5M24 11.5h-3M24 14.5h-3M24 17.5h-3"
          className="marca__pinos"
        />
        <rect x="12.5" y="12.5" width="4" height="4" className="marca__led" />
      </svg>
      <div>
        <h1>PC Builder Pro</h1>
        <p className="marca__lema">Monte um PC peça por peça e entenda cada escolha</p>
      </div>
    </div>
  )
}
