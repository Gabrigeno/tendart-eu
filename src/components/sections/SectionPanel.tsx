import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import ArrowButton from '@/components/ArrowButton';
import type { Section } from '@/data/sections';

// Riquadro stile menu PS2: pannello blu notte quasi opaco (niente blur sopra il canvas),
// doppio filo nel colore della sezione, angoli tagliati a smusso.
const CHAMFER =
  'polygon(14px 0, calc(100% - 14px) 0, 100% 14px, 100% calc(100% - 14px), calc(100% - 14px) 100%, 14px 100%, 0 calc(100% - 14px), 0 14px)';

export default function SectionPanel({
  section,
  index,
  total,
  prev,
  next,
  onGo,
}: {
  section: Section;
  index: number;
  total: number;
  prev?: Section;
  next?: Section;
  onGo: (s: Section) => void;
}) {
  const body = useRef<HTMLDivElement>(null);

  // testo a righe sfalsate all'arrivo su un posto. Riparte al cambio sezione senza
  // rimontare il pannello: le frecce restano gli stessi elementi e tengono il focus.
  useLayoutEffect(() => {
    if (!body.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.from('[data-reveal]', { autoAlpha: 0, y: 8, duration: 0.35, stagger: 0.07, ease: 'power2.out', delay: 0.5 });
    }, body);
    return () => ctx.revert();
  }, [section.key]);

  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    // filo esterno = sfondo accento dietro al pannello interno, entrambi smussati
    <div className="p-[2px]" style={{ background: section.accent, clipPath: CHAMFER }}>
      <div ref={body} className="relative bg-[#070b22]/95 p-6 md:p-8" style={{ clipPath: CHAMFER }}>
        {/* filo interno sottile */}
        <div
          className="pointer-events-none absolute inset-[6px] border"
          style={{ borderColor: `${section.accent}55`, clipPath: CHAMFER }}
        />
        <p data-reveal className="text-sora text-[11px] uppercase tracking-[0.3em]" style={{ color: section.accent }}>
          ◆ {pad(index + 1)} / {pad(total)} · {section.place}
        </p>
        <h1
          data-reveal
          className="text-bbh mt-3 !text-4xl uppercase !leading-none md:!text-6xl"
          style={{ color: section.accent, textShadow: `0 0 18px ${section.accent}88, 3px 3px 0 #000` }}
        >
          {section.title}
        </h1>
        <div className="text-sora mt-5 space-y-3 text-sm leading-relaxed text-white/85 md:text-base">
          {section.body.map((para, i) => (
            <p key={i} data-reveal>
              {para}
            </p>
          ))}
        </div>
        {/* riga frecce esclusa dal reveal: nascosta anche un istante perderebbe il focus */}
        <div className="text-sora mt-6 flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <ArrowButton dir="prev" label="Sezione precedente" accent={section.accent} disabled={!prev} onClick={() => prev && onGo(prev)} />
            {prev?.title}
          </span>
          <span className="flex items-center gap-1">
            {next?.title}
            <ArrowButton dir="next" label="Sezione successiva" accent={section.accent} disabled={!next} onClick={() => next && onGo(next)} />
          </span>
        </div>
      </div>
    </div>
  );
}
