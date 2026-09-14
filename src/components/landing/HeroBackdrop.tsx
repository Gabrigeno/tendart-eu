import { useLayoutEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';

// Roster costruito a build-time da Vite: qualunque foto l'utente metta in
// src/assets/Foto landing 1/ appare qui senza modifiche al codice.
const modules = import.meta.glob('../../assets/Foto landing 1/*.{jpg,jpeg,JPG,JPEG,png,PNG,webp,svg}', {
  eager: true,
  import: 'default',
});
const ROSTER = Object.values(modules) as string[];

interface Slot {
  top: number;
  left: number;
  width: number;
  rotate: number;
}

// Esattamente 10 posizioni/dimensioni/rotazioni fisse: ogni foto del roster
// viene assegnata a una di queste in sequenza (foto i -> slot i % 10), così
// qualsiasi numero di foto (10, 17, 20...) funziona senza altre modifiche.
const SLOTS: Slot[] = [
  { top: 4, left: 6, width: 26, rotate: -8 },
  { top: 12, left: 58, width: 32, rotate: 6 },
  { top: 40, left: 2, width: 22, rotate: 10 },
  { top: 55, left: 64, width: 28, rotate: -5 },
  { top: 2, left: 34, width: 24, rotate: 4 },
  { top: 62, left: 30, width: 30, rotate: -10 },
  { top: 28, left: 70, width: 20, rotate: 9 },
  { top: 48, left: 44, width: 26, rotate: -3 },
  { top: 8, left: 78, width: 22, rotate: -7 },
  { top: 66, left: 6, width: 34, rotate: 3 },
];

export default function HeroBackdrop() {
  const root = useRef<HTMLDivElement>(null);
  const reducedMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  useLayoutEffect(() => {
    if (reducedMotion) return;
    if (ROSTER.length === 0) return;
    if (!root.current) return;
    const ctx = gsap.context(() => {
      const images = gsap.utils.toArray<HTMLImageElement>('.backdrop-photo');
      const tl = gsap.timeline({ repeat: -1 });
      const spacing = 0.5; // secondi tra un crossfade e il successivo
      const fadeIn = 0.5; // durata del crossfade in
      const hold = 0.4; // secondi di visibilità piena
      const fadeOut = 0.5; // durata del crossfade out
      // finestra totale a alpha>0 = fadeIn + hold + fadeOut = 1.4s con spacing 0.5s
      // -> ~2-3 immagini concorrenti visibili in ogni istante, mai di più
      images.forEach((img, i) => {
        const start = i * spacing;
        tl.to(img, { autoAlpha: 1, duration: fadeIn, ease: 'power1.inOut' }, start)
          .to(img, { autoAlpha: 0, duration: fadeOut, ease: 'power1.inOut' }, start + fadeIn + hold);
      });
    }, root.current);
    return () => ctx.revert();
  }, [reducedMotion]);

  if (ROSTER.length === 0) return null;

  // Ogni foto del roster appare nel tempo, assegnata a uno dei 10 slot fissi.
  const appearances = ROSTER.map((src, i) => ({ src, slot: SLOTS[i % SLOTS.length] }));
  const visibleAppearances = reducedMotion
    ? appearances.slice(0, Math.min(2, appearances.length))
    : appearances;

  return (
    <div ref={root} className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {visibleAppearances.map(({ src, slot }, i) => (
        <img
          key={`${src}-${i}`}
          src={src}
          alt=""
          className={reducedMotion ? undefined : 'backdrop-photo'}
          style={{
            position: 'absolute',
            top: `${slot.top}%`,
            left: `${slot.left}%`,
            width: `${slot.width}vw`,
            transform: `rotate(${slot.rotate}deg)`,
            opacity: reducedMotion ? 0.3 : 0,
            visibility: reducedMotion ? 'visible' : 'hidden',
            filter: 'grayscale(1) contrast(1.5) brightness(0.55)',
          }}
        />
      ))}
    </div>
  );
}
