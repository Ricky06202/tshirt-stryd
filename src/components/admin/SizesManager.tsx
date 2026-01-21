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

  useEffect(() => {
    fetchSizes()
  }, [])

  const fetchSizes = async () => {
    const res = await fetch('/api/admin/tallas')
    const data = (await res.json()) as Talla[]
    setSizes(data)
    setLoading(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar talla?')) return
    await fetch('/api/admin/tallas', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    })
    fetchSizes()
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

    await fetch(url, {
      method,
      body: JSON.stringify(body),
    })

    setFormData({ talla: '', nombre: '' })
    setIsAdding(false)
    setEditingId(null)
    fetchSizes()
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
                onClick={() => handleDelete(size.id)}
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
    </div>
  )
}

export default SizesManager
