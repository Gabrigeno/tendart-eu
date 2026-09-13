import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface PunkSectionProps {
  title: string;
  text: string;
  photos: string[];
  accent: string;
}

const ROTATIONS = [-8, 6, -4, 9];
const POSITIONS = [
  'top-[6%] left-[4%] w-[48%] md:w-[32%]',
  'top-[18%] right-[5%] w-[52%] md:w-[36%]',
  'bottom-[10%] left-[16%] w-[50%] md:w-[30%]',
  'bottom-[16%] right-[18%] w-[42%] md:w-[26%] hidden md:block',
];

export default function PunkSection({ title, text, photos, accent }: PunkSectionProps) {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!root.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: '+=120%',
          pin: true,
          scrub: 0.5,
        },
      });
      // Movimenti secchi (steps) — niente easing morbidi, stile punk
      tl.from('.punk-photo', { yPercent: 140, rotation: 25, stagger: 0.12, ease: 'steps(6)' })
        .from('.punk-caption', { opacity: 0, scale: 2.6, rotation: -6, ease: 'steps(4)' }, '<0.3')
        .to('.punk-photo', { yPercent: -150, rotation: -20, stagger: 0.1, ease: 'steps(6)' }, '+=0.4');
    }, root.current);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="relative h-screen w-full overflow-hidden bg-black">
      {photos.map((src, i) => (
        <div
          key={src}
          className={`punk-photo absolute ${POSITIONS[i % POSITIONS.length]}`}
          style={{ rotate: `${ROTATIONS[i % ROTATIONS.length]}deg` }}
        >
          <img
            src={src}
            alt=""
            className="w-full border-4 border-white/90"
            style={{ filter: 'grayscale(1) contrast(1.6)' }}
          />
          {/* duotone: tinta neon sopra la foto in bianco/nero */}
          <div
            className="pointer-events-none absolute inset-0 mix-blend-color"
            style={{ background: accent, opacity: 0.65 }}
          />
        </div>
      ))}
      <div className="punk-caption absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center">
        <h2
          className="text-bbh text-6xl font-extrabold uppercase md:text-8xl"
          style={{ color: accent, textShadow: '4px 4px 0 #000' }}
        >
          {title}
        </h2>
        <p className="text-sora mt-4 max-w-xl bg-black/70 p-3 text-lg text-white md:text-2xl">
          {text}
        </p>
      </div>
    </section>
  );
}
