import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ComponentType } from "react";
import HTMLFlipBook from "react-pageflip";
import { Document, Page, pdfjs } from "react-pdf";
import { Maximize2, Minimize2 } from "lucide-react";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { ArrowBackIcon } from "@/components/ui/icons/akar-icons-arrow-back";
import ArrowButton from "@/components/ArrowButton";
import FairyLights from "@/components/FairyLights";
import type { Fanzine } from "@/data/fanzines";

// worker locale, stessa versione di react-pdf (pdfjs-dist fissato in package.json)
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

// A5, come tutte le fanzine finora (420×595 pt)
const PAGE_RATIO = 595 / 420;
// pagine disegnate attorno a quella aperta: le altre restano bianche finché non ti avvicini.
// Renderizzarle tutte (34–54 canvas) mandava in crisi Safari iOS.
const RENDER_RADIUS = 3;

// react-pageflip dichiara tutte le opzioni obbligatorie: lo tipizziamo largo
const FlipBook = HTMLFlipBook as unknown as ComponentType<Record<string, unknown>>;

type PageFlipApi = { pageFlip: () => { flipNext: () => void; flipPrev: () => void; flip: (i: number) => void } | undefined };

// pagina corrente via context: react-pageflip clona i figli una volta sola e
// re-inizializza il libro se cambiano, quindi le pagine restano elementi stabili
// e leggono da qui se devono disegnarsi
const CurrentPage = createContext(0);

// index 0 = copertina (immagine del carosello: i PDF da sfogliare partono dalle pagine interne),
// index n = pagina n del PDF
function ZinePage({ index, cover, width, height, ref }: { index: number; cover: string; width: number; height: number; ref?: React.Ref<HTMLDivElement> }) {
  const current = useContext(CurrentPage);
  const near = Math.abs(index - current) <= RENDER_RADIUS;
  if (index === 0) {
    return (
      <div ref={ref} className="bg-white overflow-hidden flex items-center" style={{ width, height }}>
        <img src={cover} alt="" draggable={false} className="w-full h-full object-contain select-none" />
      </div>
    );
  }
  return (
    <div ref={ref} className="bg-[#f4f0e6] overflow-hidden" style={{ width, height }}>
      {near && (
        <Page
          pageNumber={index}
          width={width}
          devicePixelRatio={Math.min(window.devicePixelRatio || 1, 2)}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          loading=""
        />
      )}
    </div>
  );
}

// dimensioni pagina dallo spazio disponibile: due pagine affiancate da tablet in su, una su mobile
function fit(availW: number, availH: number) {
  const single = availW < 768;
  const w = Math.floor(Math.min(availH / PAGE_RATIO, single ? availW : availW / 2));
  return { w, h: Math.floor(w * PAGE_RATIO), single };
}

export default function FanzineReader({ fz }: { fz: Fanzine }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<PageFlipApi>(null);
  const [size, setSize] = useState<{ w: number; h: number; single: boolean } | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(0);
  const [failed, setFailed] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  // immersivo = solo libro + controlli. Fullscreen API dove c'è; su iPhone Safari (niente
  // fullscreen per le pagine) resta la sola modalità immersiva, che occupa già tutto il viewport.
  const [immersive, setImmersive] = useState(false);

  const toggleImmersive = useCallback(() => {
    if (immersive) {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      setImmersive(false);
    } else {
      rootRef.current?.requestFullscreen?.().catch(() => {});
      setImmersive(true);
    }
  }, [immersive]);

  // uscita dal fullscreen col tasto Esc / gesto di sistema → esci anche dall'immersivo
  useEffect(() => {
    const onChange = () => { if (!document.fullscreenElement) setImmersive(false); };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      // clientWidth/Height includono il padding: lo tolgo per non far toccare i bordi
      const cs = getComputedStyle(el);
      const next = fit(
        el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight),
        el.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom),
      );
      setSize((prev) => (prev && prev.w === next.w && prev.single === next.single ? prev : next));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const flipPrev = useCallback(() => bookRef.current?.pageFlip()?.flipPrev(), []);
  const flipNext = useCallback(() => bookRef.current?.pageFlip()?.flipNext(), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") flipPrev();
      if (e.key === "ArrowRight") flipNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipPrev, flipNext]);

  const pad = (n: number) => String(n).padStart(2, "0");
  const total = numPages ? numPages + 1 : 0; // + copertina
  // con due pagine aperte mostra la coppia (la copertina e l'ultima stanno da sole)
  const spread = size && !size.single && page > 0 && page < total - 1;
  const counter = total ? `${pad(page + 1)}${spread ? `–${pad(page + 2)}` : ""} / ${pad(total)}` : "— / —";

  return (
    <div ref={rootRef} className="relative h-dvh w-full overflow-hidden bg-black flex flex-col items-center text-sora">
      <FairyLights accent={fz.accent} className="absolute inset-0 w-full h-full z-0" />
      {/* alone del colore della fanzine dietro il libro */}
      <div
        className="pointer-events-none absolute left-1/2 top-[55%] h-[70%] w-[80%] -translate-x-1/2 -translate-y-1/2"
        style={{ background: `radial-gradient(closest-side, color-mix(in srgb, ${fz.accent} 22%, transparent), transparent 75%)`, filter: "blur(40px)" }}
      />

      {!immersive && (
        <>
          <a
            href="/library"
            aria-label="Torna alla libreria"
            className="absolute top-4 left-4 z-20 flex items-center border-2 border-white bg-black/60 p-2 !text-white transition-all duration-300 hover:bg-white hover:!text-black"
          >
            <ArrowBackIcon />
          </a>

          <header className="relative z-10 mt-6 md:mt-10 px-16 text-center">
            <h1 className="!font-bold !text-lg md:!text-2xl !leading-tight" style={{ color: fz.accent, textShadow: `0 0 14px ${fz.accent}` }}>
              &#9670; {fz.title}
            </h1>
            <p className="text-xs md:text-sm text-gray-400 mt-1">
              {fz.sub}
              <span className="mx-2 text-gray-600">·</span>
              <a href={fz.download} target="_blank" rel="noopener noreferrer" className="whitespace-nowrap !text-gray-400 hover:!text-gray-100 transition-colors">
                Scarica PDF ↓
              </a>
            </p>
          </header>
        </>
      )}

      <div ref={stageRef} className={`relative z-10 flex-1 w-full min-h-0 flex items-center justify-center ${immersive ? "px-2 py-2" : "px-5 py-5 md:py-8"}`}>
        {failed ? (
          <p className="text-gray-400 text-sm text-center">
            Non riusciamo a mostrare la fanzine qui.{" "}
            <a href={fz.download} target="_blank" rel="noopener noreferrer" style={{ color: fz.accent }}>Aprila in PDF →</a>
          </p>
        ) : (
          size && (
            <Document
              file={fz.pdf}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              onLoadError={() => setFailed(true)}
              loading={<p className="text-gray-500 text-sm animate-pulse">Un secondo che carica…</p>}
            >
              {numPages > 0 && (
                <CurrentPage.Provider value={page}>
                    <FlipBook
                      // remount al cambio dimensioni/modalità: react-pageflip non si ridimensiona da solo
                      key={`${size.w}-${size.single}`}
                      ref={bookRef}
                      width={size.w}
                      height={size.h}
                      size="fixed"
                      startPage={page}
                      showCover
                      usePortrait={size.single}
                      drawShadow
                      maxShadowOpacity={0.4}
                      flippingTime={800}
                      mobileScrollSupport
                      onFlip={(e: { data: number }) => setPage(e.data)}
                      className=""
                      style={{}}
                    >
                      {Array.from({ length: total }, (_, i) => (
                        <ZinePage key={i} index={i} cover={fz.cover} width={size.w} height={size.h} />
                      ))}
                    </FlipBook>
                </CurrentPage.Provider>
              )}
            </Document>
          )
        )}
      </div>

      <footer className={`relative z-10 w-full flex items-center justify-center gap-4 ${immersive ? "pb-3" : "pb-5 md:pb-8"}`}>
        <ArrowButton dir="prev" label="Pagina precedente" accent={fz.accent} disabled={page === 0} onClick={flipPrev} />
        <span className="text-xs tracking-widest text-gray-400 tabular-nums min-w-20 text-center">
          {counter}
        </span>
        <ArrowButton dir="next" label="Pagina successiva" accent={fz.accent} disabled={!total || page >= total - (spread ? 2 : 1)} onClick={flipNext} />
        <button
          type="button"
          onClick={toggleImmersive}
          aria-label={immersive ? "Esci da schermo intero" : "Schermo intero"}
          className="absolute right-4 md:right-8 !p-1 !bg-transparent !border-0 !rounded-none text-gray-500 hover:text-gray-100 transition-colors focus:!outline-none focus-visible:!outline-1 focus-visible:!outline-white"
        >
          {immersive ? <Minimize2 size={20} strokeWidth={1.5} /> : <Maximize2 size={20} strokeWidth={1.5} />}
        </button>
      </footer>
    </div>
  );
}
