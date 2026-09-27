import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import ArrowButton from '@/components/ArrowButton';
import type { Section } from '@/data/sections';

// Riquadro neutro: lastra nera quasi opaca (niente blur sopra il canvas), bordo grigio
// sottile. Il 3D viene da un'estrusione: ombre grigie impilate e sfalsate in basso a
// destra (una "lastra" spessa), più un filo di luce sul bordo alto.
const EXTRUDE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  .map((i) => `${i}px ${i}px 0 rgb(${62 - i * 3},${62 - i * 3},${68 - i * 3})`)
  .concat('14px 16px 24px rgba(0,0,0,.55)', 'inset 0 1px 0 rgba(255,255,255,.1)')
  .join(', ');

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
    <div ref={body} className="relative border border-white/15 bg-[#0a0a0c]/95 p-6 md:p-8" style={{ boxShadow: EXTRUDE }}>
      <p data-reveal className="text-sora text-[11px] uppercase tracking-[0.3em]" style={{ color: section.accent }}>
        ◆ {pad(index + 1)} / {pad(total)}
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
      {section.links && (
        <div data-reveal className="mt-6 flex flex-wrap gap-3">
          {section.links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              // link esterni (es. Google Form) in nuova scheda
              {...(l.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="text-sora border px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] !text-white transition-colors hover:!text-black hover:[background:var(--c)]"
              style={{ borderColor: section.accent, '--c': section.accent } as React.CSSProperties}
            >
              ▸ {l.label}
            </a>
          ))}
        </div>
      )}
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
  );
}
