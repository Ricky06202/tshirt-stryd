import React, { useState, useEffect } from 'react'

interface Talla {
  id: number
  talla: string
  nombre: string
}

const SizesManager: React.FC = () => {
  const [sizes, setSizes] = useState<Talla[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({ talla: '', nombre: '' })

  // Modals state
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [errorOpen, setErrorOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    fetchSizes()
  }, [])

  const fetchSizes = async () => {
    try {
      const res = await fetch('/api/admin/tallas')
      if (!res.ok) {
        throw new Error(`Error ${res.status}: No se pudieron cargar las tallas`)
      }
      const data = (await res.json()) as Talla[]
      setSizes(data)
    } catch (e) {
      console.error('Error fetching sizes:', e)
      setErrorMessage('Error al cargar las tallas. Asegúrate de estar autenticado.')
      setErrorOpen(true)
    } finally {
      setLoading(false)
    }
  }

  const openConfirmDelete = (id: number) => {
    setConfirmId(id)
    setConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!confirmId) return
    try {
      const res = await fetch('/api/admin/tallas', {
        method: 'DELETE',
        body: JSON.stringify({ id: confirmId }),
      })

      if (!res.ok) {
        let message = 'No se pudo borrar la talla'
        try {
          const errJson = (await res.json()) as { error?: string }
          if (errJson && typeof errJson.error === 'string') message = errJson.error
        } catch (_) {}
        throw new Error(message)
      }

      setConfirmOpen(false)
      setConfirmId(null)
      fetchSizes()
    } catch (e) {
      console.error(e)
      setErrorMessage('Error al borrar la talla. Intenta nuevamente.')
      setErrorOpen(true)
      setConfirmOpen(false)
    }
  }

  const handleEdit = (size: Talla) => {
    setEditingId(size.id)
    setFormData({
      talla: size.talla,
      nombre: size.nombre,
    })
    setIsAdding(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = '/api/admin/tallas'
    const method = editingId ? 'PUT' : 'POST'
    const body = editingId ? { ...formData, id: editingId } : formData

    try {
      const res = await fetch(url, {
        method,
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        let message = 'No se pudo guardar la talla'
        try {
          const errJson = (await res.json()) as { error?: string }
          if (errJson && typeof errJson.error === 'string') message = errJson.error
        } catch (_) {}
        throw new Error(message)
      }

      setFormData({ talla: '', nombre: '' })
      setIsAdding(false)
      setEditingId(null)
      fetchSizes()
    } catch (e) {
      console.error(e)
      setErrorMessage('Hubo un error al guardar la talla')
      setErrorOpen(true)
    }
  }

  const cancelAction = () => {
    setIsAdding(false)
    setEditingId(null)
    setFormData({ talla: '', nombre: '' })
  }

  if (loading) return <div className="text-gray-400">Cargando tallas...</div>

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Configuración de Tallas</h2>
        <button
          onClick={() => (isAdding ? cancelAction() : setIsAdding(true))}
          className={`px-4 py-2 rounded-lg font-bold transition-colors ${isAdding ? 'bg-white/10 hover:bg-white/20' : 'bg-green-600 hover:bg-green-700'}`}
        >
          {isAdding ? 'Cancelar' : 'Nueva Talla'}
        </button>
      </div>

      {isAdding && (
        <form
          onSubmit={handleSubmit}
          className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row gap-4 animate-in fade-in slide-in-from-top-4"
        >
          <input
            placeholder="Talla (ej. XL, L, 32)"
            value={formData.talla}
            onChange={(e) =>
              setFormData({ ...formData, talla: e.target.value })
            }
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 focus:ring-2 focus:ring-green-500 outline-none text-white"
            required
          />
          <input
            placeholder="Nombre descriptivo (ej. Extra Large)"
            value={formData.nombre}
            onChange={(e) =>
              setFormData({ ...formData, nombre: e.target.value })
            }
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 focus:ring-2 focus:ring-green-500 outline-none text-white"
            required
          />
          <button className="px-8 py-2 bg-green-600 rounded-xl font-bold hover:bg-green-700 transition-all text-white">
            {editingId ? 'Actualizar' : 'Añadir'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {sizes.map((size) => (
          <div
            key={size.id}
            className="bg-white/5 border border-white/10 rounded-2xl p-4 flex justify-between items-center group"
          >
            <div>
              <span className="text-xl font-bold text-white block">
                {size.talla}
              </span>
              <span className="text-gray-500 text-xs uppercase">
                {size.nombre}
              </span>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleEdit(size)}
                className="p-2 text-gray-500 hover:text-blue-400 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                </svg>
              </button>
              <button
                onClick={() => openConfirmDelete(size.id)}
                className="p-2 text-gray-500 hover:text-red-500 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Confirm Delete Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="bg-[#151515] border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h4 className="text-lg font-bold mb-2">Eliminar talla</h4>
            <p className="text-gray-400 mb-6">
              ¿Seguro que quieres eliminar esta talla? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setConfirmOpen(false)
                  setConfirmId(null)
                }}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {errorOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="bg-[#151515] border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h4 className="text-lg font-bold mb-2 text-red-400">Ocurrió un error</h4>
            <p className="text-gray-400 mb-6">{errorMessage}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setErrorOpen(false)}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SizesManager
