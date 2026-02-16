import React from 'react'

interface ProductCardProps {
  id: number
  nombre: string
  imagen: string
  precio?: number // Optional as not all styles might have it in the DB view used
}

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  nombre,
  imagen,
  precio = 35.0,
}) => {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/10">
      {/* Image Container */}
      <div className="relative aspect-3/4 w-full overflow-hidden bg-white/5">
        <div className="absolute inset-0 bg-radial-at-c from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
        <img
          src={`/api/images/${imagen}`}
          alt={nombre}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />

        {/* Quick Action Overlay (Optional - visible on hover) */}
        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-20">
          <a
            href="/nuevo-pedido"
            className="block w-full py-3 text-center text-sm font-bold text-white bg-orange-600 rounded-xl shadow-lg hover:bg-orange-700 transition-colors"
          >
            Ordenar Ahora
          </a>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col grow">
        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-orange-500 transition-colors line-clamp-1">
          {nombre}
        </h3>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-gray-400 text-sm">Edición Limitada</span>
          <span className="text-xl font-bold text-white">
            ${precio.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  )
}

export default ProductCard
