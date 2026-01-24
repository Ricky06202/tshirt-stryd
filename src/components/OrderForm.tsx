import React, { useState, useMemo, useRef, useEffect } from 'react'

interface Talla {
  id: number
  talla: string
  nombre: string
}

interface Estilo {
  id: number
  estilo: number
  nombre: string
  imagen: string
  precio: number
}

interface OrderFormProps {
  tallas: Talla[]
  estilos: Estilo[]
}

const OrderForm: React.FC<OrderFormProps> = ({ tallas, estilos }) => {
  const [step, setStep] = useState(1)
  const [persona, setPersona] = useState('')
  const [nombreCamisa, setNombreCamisa] = useState('')
  const [selectedSize, setSelectedSize] = useState<Talla | null>(null)
  const [selectedStyles, setSelectedStyles] = useState<Estilo[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [pedidoId, setPedidoId] = useState<number | null>(null)

  // Refs for auto-focus
  const personaInputRef = useRef<HTMLInputElement>(null)
  const nombreCamisaInputRef = useRef<HTMLInputElement>(null)

  // Auto-focus on step change
  useEffect(() => {
    if (step === 1 && personaInputRef.current) {
      personaInputRef.current.focus()
    } else if (step === 2 && nombreCamisaInputRef.current) {
      nombreCamisaInputRef.current.focus()
    }
  }, [step])

  // Group styles by the "estilo" integer field
  const styleGroups = useMemo(() => {
    const groups: Record<number, Estilo[]> = {}
    estilos.forEach((s) => {
      if (!groups[s.estilo]) groups[s.estilo] = []
      groups[s.estilo].push(s)
    })
    return groups
  }, [estilos])

  const groupedNumbers = Object.keys(styleGroups).map(Number)

  const totalSeleccionado = useMemo(
    () => selectedStyles.reduce((acc, s) => acc + s.precio, 0),
    [selectedStyles],
  )

  const handleSubmit = async () => {
    if (!persona || selectedStyles.length === 0 || !selectedSize) return

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona,
          nombre: nombreCamisa || 'Sín nombre',
          estiloIds: selectedStyles.map((s) => s.id),
          tallaId: selectedSize.id,
        }),
      })

      if (!response.ok) throw new Error('Error al procesar el pedido')
      const data = (await response.json()) as { pedidoId?: number }
      if (data && typeof data.pedidoId !== 'undefined') {
        setPedidoId(Number(data.pedidoId))
      }
      setSuccess(true)
    } catch (err) {
      setError(
        'Hubo un error al guardar tu pedido. Por favor intenta de nuevo.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto">
          <svg
            className="w-10 h-10"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            ></path>
          </svg>
        </div>
        <h2 className="text-3xl font-bold">¡Pedido Confirmado!</h2>
        <p className="text-gray-400">
          Gracias {persona}, hemos recibido tu pedido. Nos pondremos en contacto
          pronto.
        </p>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 space-y-2 text-left max-w-2xl mx-auto">
          <p className="text-yellow-300 font-bold">Importante</p>
          <p className="text-gray-300">
            Para procesar tu pedido necesitamos un abono del <span className="font-bold text-white">50%</span> vía Yappy al número <span className="font-bold text-white">6676-9050</span>.
          </p>
          <p className="text-gray-400 text-sm">Puedes enviarnos un mensaje por WhatsApp con el siguiente botón:</p>
          <div className="pt-2">
            <a
              href={`https://wa.me/50766769050?text=${encodeURIComponent(
                [
                  `Hola! Estoy interesado en mi pedido de camisetas y voy a realizar el abono del 50% por *Yappy*.`,
                  '',
                  '*Detalles del pedido:*',
                  `• Cliente: *${persona}*`,
                  `• Nombre en camisa: *${nombreCamisa ? nombreCamisa : 'N/A'}*`,
                  `• Talla: *${selectedSize?.talla ?? 'N/A'}*`,
                  `• Estilos: *${selectedStyles.map((s) => s.nombre).join(', ')}*`,
                  `• Total: *$${selectedStyles.reduce((a, s) => a + s.precio, 0)}*`,
                  '',
                  `Datos para el abono: *Yappy 6676-9050*`,
                  'Por favor confírmame la recepción. Gracias!',
                ].join('\n')
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-white transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z"/></svg>
              Escribir por WhatsApp
            </a>
          </div>
        </div>
        <div className="pt-6">
          <a
            href="/"
            className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-12 pb-32">
      {/* Paso 1: Quién hace el pedido */}
      <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center gap-4 mb-6">
          <span className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center font-bold text-white">
            1
          </span>
          <h2 className="text-2xl font-bold">¿Quién hace el pedido?</h2>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <input
            type="text"
            placeholder="Ej. Juan Pérez"
            value={persona}
            ref={personaInputRef}
            onChange={(e) => setPersona(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && persona.length > 2 && step === 1) {
                setStep(2)
              }
            }}
            disabled={step > 1}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {persona.length > 2 && step === 1 && (
            <button
              onClick={() => setStep(2)}
              className="mt-4 px-6 py-2 bg-orange-600 rounded-lg font-bold hover:bg-orange-700 transition-all active:scale-95 shadow-lg shadow-orange-600/20"
            >
              Confirmar Nombre
            </button>
          )}
          {step > 1 && (
            <button
              onClick={() => setStep(1)}
              className="mt-4 text-sm text-gray-500 hover:text-white transition-colors flex items-center gap-1"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
              </svg>
              Editar
            </button>
          )}
        </div>
      </section>

      {/* Paso 2: Nombre en la camisa */}
      {step >= 2 && (
        <section className="animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="flex items-center gap-4 mb-6">
            <span className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center font-bold text-white">
              2
            </span>
            <h2 className="text-2xl font-bold">
              ¿Qué nombre quieres en tu camisa?
            </h2>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <input
              type="text"
              placeholder="Ej. EL RAYO (O deja en blanco)"
              value={nombreCamisa}
              ref={nombreCamisaInputRef}
              onChange={(e) => setNombreCamisa(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && step === 2) {
                  setStep(3)
                }
              }}
              disabled={step > 2}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium text-lg disabled:opacity-50"
            />
            {step === 2 && (
              <div className="flex gap-4 mt-4">
                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-2 bg-orange-600 rounded-lg font-bold hover:bg-orange-700 transition-all active:scale-95 shadow-lg shadow-orange-600/20"
                >
                  Continuar
                </button>
              </div>
            )}
            {step > 2 && (
              <button
                onClick={() => setStep(2)}
                className="mt-4 text-sm text-gray-500 hover:text-white transition-colors flex items-center gap-1"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                </svg>
                Editar
              </button>
            )}
          </div>
        </section>
      )}

      {/* Paso 3: Selección de Talla */}
      {step >= 3 && (
        <section className="animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="flex items-center gap-4 mb-6">
            <span className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center font-bold text-white">
              3
            </span>
            <h2 className="text-2xl font-bold">Selecciona tu Talla</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {tallas.map((talla) => (
              <div
                key={talla.id}
                onClick={() => {
                  setSelectedSize(talla)
                  setStep(4)
                }}
                className={`cursor-pointer h-16 rounded-xl border-2 flex items-center justify-center font-bold transition-all ${selectedSize?.id === talla.id ? 'border-orange-500 bg-orange-500/20 text-orange-500' : 'border-white/10 hover:border-white/30 text-gray-400'} ${step > 3 && selectedSize?.id !== talla.id ? 'opacity-30' : ''}`}
              >
                {talla.talla}
              </div>
            ))}
          </div>
          {step > 3 && (
            <button
              onClick={() => setStep(3)}
              className="mt-6 text-sm text-gray-500 hover:text-white transition-colors flex items-center gap-1"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
              </svg>
              Cambiar Talla
            </button>
          )}
        </section>
      )}

      {/* Paso 4: Selección de Estilo (Agrupado por Colección) */}
      {step >= 4 && (
        <section className="animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="flex items-center gap-4 mb-6">
            <span className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center font-bold text-white">
              4
            </span>
            <h2 className="text-2xl font-bold">Elige tu Diseño</h2>
          </div>

          <div className="space-y-12">
            {groupedNumbers.map((groupNum) => (
              <div key={groupNum} className="space-y-4">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-bold text-white">
                    Colección #{groupNum}
                  </h3>
                  <div className="h-px bg-white/10 flex-1"></div>
                  <span className="text-xs font-bold text-gray-500 uppercase">
                    {styleGroups[groupNum].length} Diseños
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {styleGroups[groupNum].map((style) => (
                    <div
                      key={style.id}
                      onClick={() => {
                        setSelectedStyles((prev) => {
                          const exists = prev.find((s) => s.id === style.id)
                          if (exists) {
                            return prev.filter((s) => s.id !== style.id)
                          }
                          return [...prev, style]
                        })
                      }}
                      className={`group cursor-pointer bg-white/5 border-2 rounded-2xl overflow-hidden transition-all duration-300 ${
                        selectedStyles.some((s) => s.id === style.id)
                          ? 'border-orange-500 bg-orange-500/5'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <div className="aspect-square bg-white/5 relative overflow-hidden">
                        <img
                          src={
                            style.imagen
                              ? `/api/images/${style.imagen}`
                              : `/images/placeholder.webp`
                          }
                          alt={style.nombre}
                          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110 opacity-80"
                        />
                      </div>
                      <div className="p-4 flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{style.nombre}</h3>
                          {selectedStyles.some((s) => s.id === style.id) && (
                            <div className="mt-2 flex items-center gap-2 text-orange-500 text-sm font-bold">
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path>
                              </svg>
                              Seleccionado
                            </div>
                          )}
                        </div>
                        <div className="bg-white/10 px-3 py-1 rounded-full text-orange-500 font-bold shrink-0">
                          ${style.precio}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Resumen Final */}
      {selectedStyles.length > 0 && selectedSize && persona && (
        <section className="bg-orange-600/10 border border-orange-500/20 rounded-2xl p-8 mt-12 animate-in fade-in zoom-in duration-500">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2 text-white">
                Resumen de tu pedido
              </h3>
              <p className="text-gray-400 leading-relaxed">
                <span className="font-bold text-white">{selectedStyles.length}</span> estilo(s)
                en talla{' '}
                <span className="font-bold text-white">
                  {selectedSize.talla}
                </span>{' '}
                para <span className="font-bold text-white">{persona}</span>{' '}
                {nombreCamisa && (
                  <>
                    con el nombre "{' '}
                    <span className="font-bold text-white uppercase italic">
                      {nombreCamisa}
                    </span>
                    "
                  </>
                )}
                .
              </p>
              <ul className="mt-3 text-sm text-gray-300 list-disc pl-5">
                {selectedStyles.map((s) => (
                  <li key={s.id}>
                    {s.nombre} (Colección #{s.estilo}) - ${s.precio}
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-center md:text-right shrink-0">
              <div className="text-3xl font-bold mb-4 text-white">
                ${totalSeleccionado}
              </div>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-10 py-4 bg-orange-600 hover:bg-orange-700 rounded-xl font-bold text-lg transition-all shadow-xl shadow-orange-600/20 disabled:opacity-50 active:scale-95 text-white"
              >
                {isSubmitting ? 'Procesando...' : 'Confirmar mi Pedido'}
              </button>
            </div>
          </div>
          {error && (
            <p className="mt-4 text-red-500 text-center font-medium animate-pulse">
              {error}
            </p>
          )}
        </section>
      )}
    </div>
  )
}

export default OrderForm
