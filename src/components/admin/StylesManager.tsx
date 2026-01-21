import React, { useState, useEffect, useMemo, useRef } from 'react'

interface Estilo {
  id: number
  estilo: number
  nombre: string
  imagen: string
  precio: number
}

const StylesManager: React.FC = () => {
  const [styles, setStyles] = useState<Estilo[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    estilo: '',
    precio: '',
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchStyles()
  }, [])

  const fetchStyles = async () => {
    const res = await fetch('/api/admin/estilos')
    const data = (await res.json()) as Estilo[]
    setStyles(data)
    setLoading(false)
  }

  const styleGroups = useMemo(() => {
    const groups: Record<number, Estilo[]> = {}
    styles.forEach((s) => {
      if (!groups[s.estilo]) groups[s.estilo] = []
      groups[s.estilo].push(s)
    })
    return groups
  }, [styles])

  const groupedNumbers = Object.keys(styleGroups)
    .sort((a, b) => Number(a) - Number(b))
    .map(Number)

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro que quieres eliminar este diseño?')) return
    await fetch('/api/admin/estilos', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    })
    fetchStyles()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setSelectedFile(file)

    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setImagePreview(null)
    }
  }

  const handleEdit = (style: Estilo) => {
    setEditingId(style.id)
    setFormData({
      nombre: style.nombre,
      estilo: style.estilo.toString(),
      precio: style.precio.toString(),
    })
    setIsAdding(true)
    setSelectedFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!editingId) {
        // MODE: ADD
        if (!selectedFile) {
          alert('Debes seleccionar una imagen para el nuevo estilo')
          setIsSubmitting(false)
          return
        }

        const data = new FormData()
        data.append('file', selectedFile)
        data.append('nombre', formData.nombre)
        data.append('estilo', formData.estilo)
        data.append('precio', formData.precio)

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: data,
        })

        if (!res.ok) throw new Error('Error al subir imagen y crear estilo')
      } else {
        // MODE: EDIT
        let imageKey = styles.find((s) => s.id === editingId)?.imagen || ''

        if (selectedFile) {
          // If new image selected, upload it first
          const data = new FormData()
          data.append('file', selectedFile)
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: data,
          })
          const uploadData = (await uploadRes.json()) as { key: string }
          imageKey = uploadData.key
        }

        const res = await fetch('/api/admin/estilos', {
          method: 'PUT',
          body: JSON.stringify({
            id: editingId,
            nombre: formData.nombre,
            estilo: formData.estilo,
            precio: formData.precio,
            imagen: imageKey,
          }),
        })

        if (!res.ok) throw new Error('Error al actualizar estilo')
      }

      setFormData({ nombre: '', estilo: '', precio: '' })
      setSelectedFile(null)
      setImagePreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setIsAdding(false)
      setEditingId(null)
      fetchStyles()
    } catch (error) {
      console.error(error)
      alert('Hubo un error al procesar la solicitud')
    } finally {
      setIsSubmitting(false)
    }
  }

  const cancelAction = () => {
    setIsAdding(false)
    setEditingId(null)
    setFormData({ nombre: '', estilo: '', precio: '' })
    setSelectedFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (loading) return <div className="text-gray-400">Cargando estilos...</div>

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Catálogo de Estilos</h2>
        <button
          onClick={() => (isAdding ? cancelAction() : setIsAdding(true))}
          className={`px-4 py-2 rounded-lg font-bold transition-colors ${isAdding ? 'bg-white/10 hover:bg-white/20' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {isAdding ? 'Cancelar' : 'Nuevo Estilo'}
        </button>
      </div>

      {isAdding && (
        <form
          onSubmit={handleSubmit}
          className="bg-white/5 border border-white/10 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4"
        >
          <h3 className="md:col-span-2 text-lg font-bold mb-2">
            {editingId ? 'Editar Diseño' : 'Crear Nuevo Diseño'}
          </h3>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                Nombre del diseño
              </label>
              <input
                placeholder="Ej. Classic Black"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                Colección (Número)
              </label>
              <input
                placeholder="Ej. 1"
                type="number"
                value={formData.estilo}
                onChange={(e) =>
                  setFormData({ ...formData, estilo: e.target.value })
                }
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                Precio
              </label>
              <input
                placeholder="Ej. 25.99"
                type="number"
                step="0.01"
                value={formData.precio}
                onChange={(e) =>
                  setFormData({ ...formData, precio: e.target.value })
                }
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                Imagen del Producto
              </label>
              <div className="mt-1 flex flex-col gap-4">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-600/20 file:text-blue-500 hover:file:bg-blue-600/30 transition-all cursor-pointer"
                />

                {imagePreview && (
                  <div className="mt-4 border border-white/10 rounded-xl overflow-hidden bg-white/5 p-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-contain rounded-lg"
                    />
                    <p className="text-xs text-center text-gray-400 mt-2">
                      Vista previa
                    </p>
                  </div>
                )}

                {selectedFile ? (
                  <p className="text-xs text-green-500 font-medium italic">
                    Archivo seleccionado: {selectedFile.name}
                  </p>
                ) : (
                  editingId && (
                    <p className="text-xs text-gray-500 font-medium italic">
                      Deja en blanco para mantener la imagen actual
                    </p>
                  )
                )}
              </div>
            </div>

            <button
              disabled={isSubmitting}
              className="w-full py-4 bg-blue-600 rounded-xl font-bold hover:bg-blue-700 transition-all text-white disabled:opacity-50 mt-auto"
            >
              {isSubmitting
                ? 'Procesando...'
                : editingId
                  ? 'Actualizar Diseño'
                  : 'Guardar Diseño'}
            </button>
          </div>
        </form>
      )}

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
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-4 items-center group relative overflow-hidden"
                >
                  <div className="w-16 h-16 bg-white/5 rounded-xl overflow-hidden shrink-0 border border-white/5">
                    <img
                      src={
                        style.imagen
                          ? `/api/images/${style.imagen}`
                          : '/images/placeholder.webp'
                      }
                      className="w-full h-full object-cover opacity-80"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-white">{style.nombre}</h4>
                    <p className="text-xl font-bold text-orange-500 mt-1">
                      ${style.precio}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(style)}
                      className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                      title="Editar"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(style.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      title="Eliminar"
                    >
                      <svg
                        className="w-5 h-5"
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
        ))}
      </div>
    </div>
  )
}

export default StylesManager
