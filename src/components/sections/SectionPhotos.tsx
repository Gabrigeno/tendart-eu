import type { Section } from '@/data/sections';

// Cornici a poligono irregolare, una forma diversa per foto (a rotazione), leggera
// rotazione, filo nel colore della sezione. Bicromo blu come la hero, colori pieni in hover.
const SHAPES = [
  'polygon(4% 0, 100% 3%, 96% 100%, 0 94%)',
  'polygon(0 5%, 93% 0, 100% 92%, 6% 100%)',
  'polygon(7% 3%, 100% 0, 95% 96%, 0 100%)',
];
const TILT = [-2, 1.5, -1];

export default function SectionPhotos({ section }: { section: Section }) {
  if (!section.photos.length) return null;
  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {section.photos.map((src, i) => (
        <div
          key={src}
          data-section-photo
          className="group p-[2px]"
          style={{ background: section.accent, clipPath: SHAPES[i % SHAPES.length], transform: `rotate(${TILT[i % TILT.length]}deg)` }}
        >
          <img
            src={src}
            alt=""
            loading="lazy"
            className="block aspect-[4/3] w-full object-cover transition-[filter] duration-300 [filter:grayscale(1)_sepia(0.45)_hue-rotate(185deg)_saturate(1.5)_brightness(0.75)] group-hover:[filter:none]"
            style={{ clipPath: SHAPES[i % SHAPES.length] }}
          />
        </div>
      ))}
    </div>
  );
}
