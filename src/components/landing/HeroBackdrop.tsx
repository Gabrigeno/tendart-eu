import { useLayoutEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { PHOTOS } from './photos';

const ALL_PHOTOS = Object.values(PHOTOS).flat();

interface ImageSpot {
  src: string;
  top: number;
  left: number;
  width: number;
  rotate: number;
}

function randomSpots(photos: string[]): ImageSpot[] {
  return photos.map((src) => ({
    src,
    top: Math.random() * 70,
    left: Math.random() * 70,
    width: 20 + Math.random() * 25,
    rotate: -12 + Math.random() * 24,
  }));
}

// Posizioni fisse per il fallback statico (prefers-reduced-motion)
const STATIC_SPOTS: ImageSpot[] = [
  { src: ALL_PHOTOS[0], top: 10, left: 8, width: 30, rotate: -6 },
  { src: ALL_PHOTOS[6] ?? ALL_PHOTOS[0], top: 45, left: 50, width: 32, rotate: 5 },
];

export default function HeroBackdrop() {
  const root = useRef<HTMLDivElement>(null);
  const spots = useMemo(() => randomSpots(ALL_PHOTOS), []);
  const reducedMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  useLayoutEffect(() => {
    if (reducedMotion) return;
    if (!root.current) return;
    const ctx = gsap.context(() => {
      const images = gsap.utils.toArray<HTMLImageElement>('.backdrop-photo');
      const tl = gsap.timeline({ repeat: -1 });
      const spacing = 0.5; // secondi tra un pop-in e il successivo
      const hold = 1; // secondi di visibilità di ogni immagine (~2-3 visibili insieme)
      images.forEach((img, i) => {
        const start = i * spacing;
        tl.to(img, { autoAlpha: 1, duration: 0.01, ease: 'steps(1)' }, start)
          .to(img, { autoAlpha: 0, duration: 0.01, ease: 'steps(1)' }, start + hold);
      });
    }, root.current);
    return () => ctx.revert();
  }, [reducedMotion]);

  const displaySpots = reducedMotion ? STATIC_SPOTS : spots;

  return (
    <div ref={root} className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {displaySpots.map((spot, i) => (
        <img
          key={`${spot.src}-${i}`}
          src={spot.src}
          alt=""
          className={reducedMotion ? undefined : 'backdrop-photo'}
          style={{
            position: 'absolute',
            top: `${spot.top}%`,
            left: `${spot.left}%`,
            width: `${spot.width}vw`,
            transform: `rotate(${spot.rotate}deg)`,
            opacity: reducedMotion ? 0.3 : 0,
            visibility: reducedMotion ? 'visible' : 'hidden',
            filter: 'grayscale(1) contrast(1.5) brightness(0.55)',
          }}
        />
      ))}
    </div>
  );
}
