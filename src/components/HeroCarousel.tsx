import React from 'react';

interface Style {
  id: number;
  nombre: string;
  imagen: string;
}

interface HeroCarouselProps {
  styles: Style[];
}

const HeroCarousel: React.FC<HeroCarouselProps> = ({ styles }) => {
  if (styles.length === 0) return null;

  // Para un bucle infinito perfecto, duplicamos el contenido
  // y nos aseguramos de que el contenedor se desplace exactamente el 50%
  const doubleStyles = [...styles, ...styles];

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none select-none">
      {/* Capas de degradado para integración */}
      <div className="absolute inset-0 bg-radial-at-c from-transparent via-black/40 to-black z-20" />
      <div className="absolute inset-0 bg-linear-to-b from-black via-transparent to-black z-20" />
      
      {/* Contenedor del Marquee */}
      <div className="flex flex-col gap-8 rotate-[-10deg] scale-150 md:scale-125 opacity-20">
        {/* Fila 1: Derecha a Izquierda */}
        <div className="flex gap-8 animate-marquee whitespace-nowrap w-fit">
          {doubleStyles.map((style, i) => (
            <div
              key={`row1-${style.id}-${i}`}
              className="w-48 h-64 md:w-64 md:h-80 rounded-2xl overflow-hidden border border-white/10 bg-white/5 shrink-0"
            >
              <img
                src={`/api/images/${style.imagen}`}
                alt={style.nombre}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>

        {/* Fila 2: Izquierda a Derecha */}
        <div className="flex gap-8 animate-marquee-reverse whitespace-nowrap w-fit">
          {doubleStyles.map((style, i) => (
            <div
              key={`row2-${style.id}-${i}`}
              className="w-48 h-64 md:w-64 md:h-80 rounded-2xl overflow-hidden border border-white/10 bg-white/5 shrink-0"
            >
              <img
                src={`/api/images/${style.imagen}`}
                alt={style.nombre}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-reverse {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .animate-marquee {
          animation: marquee 60s linear infinite;
        }
        .animate-marquee-reverse {
          animation: marquee-reverse 60s linear infinite;
        }
      `}} />
      
      {/* Overlay adicional para desenfoque suave */}
      <div className="absolute inset-0 backdrop-blur-[1px] z-10" />
    </div>
  );
};

export default HeroCarousel;
