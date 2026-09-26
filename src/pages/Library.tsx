import { useEffect, useRef, useState } from "react";
import { ArrowBackIcon } from "@/components/ui/icons/akar-icons-arrow-back";
import { fanzines } from "@/data/fanzines";
import ArrowButton from "@/components/ArrowButton";

// spessore albo (px) per taglio pagine / dorso / retro
const ZINE_T = 12;

export default function Library() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;

    // Inclina le copertine in base alla distanza dal centro e trova quella a fuoco
    const update = () => {
      frame = 0;
      const center = track.scrollLeft + track.clientWidth / 2;
      let closest = 0;
      let best = Infinity;
      Array.from(track.children).forEach((el, i) => {
        const card = el as HTMLElement;
        const offset = (card.offsetLeft + card.offsetWidth / 2 - center) / card.offsetWidth;
        const d = Math.max(-1.5, Math.min(1.5, offset));
        const a = Math.min(Math.abs(d), 1);
        // al centro resta un filo di 3/4 (-14°) così si vede lo spessore dell'albo
        card.style.transform = `rotateY(${d * -38 - (1 - a) * 14}deg) rotateX(${(1 - a) * 4}deg) scale(${1 - Math.abs(d) * 0.18})`;
        // niente opacity sul card: appiattirebbe il preserve-3d → scurisce un overlay
        card.style.setProperty('--dim', String(a * 0.5));
        if (Math.abs(offset) < best) { best = Math.abs(offset); closest = i; }
      });
      setActive(closest);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };

    // Rotella verticale → scorrimento orizzontale
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      track.scrollLeft += e.deltaY;
    };

    update();
    track.addEventListener('scroll', onScroll, { passive: true });
    track.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      track.removeEventListener('scroll', onScroll);
      track.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const current = fanzines[active];

  // Porta la copertina i al centro (frecce, lista, click su copertina laterale)
  const goTo = (i: number) => {
    const track = trackRef.current;
    const card = track?.children[i] as HTMLElement | undefined;
    if (!track || !card) return;
    track.scrollTo({ left: card.offsetLeft + card.offsetWidth / 2 - track.clientWidth / 2, behavior: 'smooth' });
  };

  return (
    <div className="relative w-full min-h-screen flex flex-col items-center overflow-hidden bg-black px-4 py-8 md:py-12">
      <a
        href="/"
        aria-label="Torna alla home"
        className="absolute top-4 left-4 flex items-center border-2 border-white bg-black/60 p-2 !text-white transition-all duration-300 hover:bg-white hover:!text-black"
      >
        <ArrowBackIcon />
      </a>

      <header className="flex flex-col items-center gap-4 max-w-2xl text-center mt-10 md:mt-4">
        <h1
          className="text-bbh font-extrabold uppercase text-3xl md:text-5xl leading-tight"
          style={{ color: '#ff0054', textShadow: '4px 4px 0 #000' }}
        >
          Gustati le fanzine!
        </h1>
        <p className="text-sora text-gray-300 text-sm md:text-base">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
          incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
          exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
      </header>

      <div className="flex-1 w-full flex flex-col justify-center mt-8">
        {/* Titolo della copertina a fuoco */}
        <div className="flex items-center justify-center gap-3 md:gap-6 min-h-16 mb-4 px-2">
          <ArrowButton dir="prev" label="Fanzine precedente" accent={current.accent} disabled={active === 0} onClick={() => goTo(active - 1)} />
          <div className="text-sora text-center max-w-md" aria-live="polite">
            <span className="block font-bold text-lg md:text-2xl" style={{ color: current.accent, textShadow: `0 0 14px ${current.accent}` }}>
              &#9670; {current.title}
            </span>
            <span className="block text-sm text-gray-300 mt-1">{current.sub}</span>
          </div>
          <ArrowButton dir="next" label="Fanzine successiva" accent={current.accent} disabled={active === fanzines.length - 1} onClick={() => goTo(active + 1)} />
        </div>

        <div
          ref={trackRef}
          className="relative w-full flex items-center gap-6 md:gap-10 overflow-x-auto snap-x snap-mandatory py-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ perspective: '1200px', paddingInline: 'calc(50% - min(30vw, 150px))' }}
        >
          {fanzines.map((fz, i) => (
            <a
              key={fz.href}
              href={fz.href}
              aria-label={fz.title}
              className="snap-center shrink-0 relative block w-[60vw] max-w-[300px]"
              style={{ transformStyle: 'preserve-3d' }}
              onClick={(e) => {
                // Copertina laterale: prima la porto al centro, il click successivo apre
                if (i !== active) {
                  e.preventDefault();
                  goTo(i);
                }
              }}
            >
              {/* retro */}
              <div className="absolute inset-0" style={{ background: fz.accent, transform: `translateZ(-${ZINE_T}px)` }} />
              {/* taglio pagine, lato destro */}
              <div
                className="absolute top-[3px] bottom-[3px] right-0"
                style={{
                  width: ZINE_T,
                  transformOrigin: 'right',
                  transform: 'rotateY(-90deg)',
                  background: 'repeating-linear-gradient(90deg, #f4f0e6 0 1px, #cfc8b6 1px 2px)',
                }}
              />
              {/* dorso piegato, lato sinistro */}
              <div
                className="absolute inset-y-0 left-0"
                style={{ width: ZINE_T, transformOrigin: 'left', transform: 'rotateY(90deg)', background: `linear-gradient(90deg, ${fz.accent}, color-mix(in srgb, ${fz.accent} 60%, #000))` }}
              />

              {/* copertina */}
              <div
                className="relative overflow-hidden bg-white transition-shadow duration-300"
                style={{ boxShadow: i === active ? `0 0 34px ${fz.accent}` : 'none' }}
              >
                <img src={fz.cover} alt="" draggable={false} className="w-full h-auto block select-none" />
                {/* piega del dorso */}
                <div className="absolute inset-y-0 left-0 w-5 pointer-events-none" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,.28), rgba(0,0,0,.06) 70%, transparent)', borderRight: '1px solid rgba(0,0,0,.1)' }} />
                {/* punti metallici */}
                {['24%', '76%'].map((top) => (
                  <span
                    key={top}
                    className="absolute left-[9px] w-[3px] h-6 -translate-y-1/2 rounded-full pointer-events-none"
                    style={{ top, background: 'linear-gradient(90deg, #8a8a8a, #f2f2f2, #9a9a9a)', boxShadow: '1px 1px 1px rgba(0,0,0,.35)' }}
                  />
                ))}
                {/* riflesso lucido della carta */}
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(115deg, rgba(255,255,255,.45) 0%, transparent 30%, transparent 70%, rgba(255,255,255,.12) 100%)', mixBlendMode: 'soft-light' }} />
                {/* scurimento copertine laterali (--dim dallo scroll) */}
                <div className="absolute inset-0 bg-black pointer-events-none" style={{ opacity: 'var(--dim, 0)' }} />
              </div>
            </a>
          ))}
        </div>

        {/* Lista: scelta diretta senza scorrere */}
        <nav aria-label="Elenco fanzine" className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 max-w-3xl mx-auto px-4">
          {fanzines.map((fz, i) => (
            <button
              key={fz.href}
              type="button"
              onClick={() => goTo(i)}
              aria-current={i === active}
              className="text-sora !text-xs !font-normal tracking-wide !p-0 !bg-transparent !border-0 !rounded-none flex items-center gap-2 transition-colors duration-200 text-gray-500 hover:text-gray-200 focus:!outline-none focus-visible:underline"
              style={i === active ? { color: fz.accent } : undefined}
            >
              <span className="w-1.5 h-1.5 rounded-full transition-opacity" style={{ background: fz.accent, opacity: i === active ? 1 : 0 }} />
              {String(i + 1).padStart(2, '0')} {fz.title}
            </button>
          ))}
        </nav>
        <p className="text-sora text-center text-xs text-gray-500 mt-3">clicca la copertina al centro per aprirla</p>
      </div>
    </div>
  );
}
