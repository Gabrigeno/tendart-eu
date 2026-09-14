import { Suspense, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Float, PresentationControls } from '@react-three/drei';
import type { Group } from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { IslandScene } from './IslandScene';

gsap.registerPlugin(ScrollTrigger);

interface SplitSection {
  key: string;
  title: string;
  text: string;
  accent: string;
}

// Ritmo della timeline (unità astratte, lo scrub le mappa sullo scroll):
// per ogni sezione una "sosta" (testo visibile, isola ferma al centro) e tra
// una sosta e l'altra una "transizione" (l'isola ruota, arretra e torna avanti
// mentre il testo nuovo si materializza).
const HOLD = 1;
const TRANS = 1.6;
const INTRO = 0.9;

// Scena procedurale autorata centrata sull'origine, isola larga ~4.6 unità
// (slab 4 × scala x 1.15). Qui SOLO la yaw di posa iniziale: il tilt di
// ripresa (0.42 su x) sta FUORI dal group animato da scroll, altrimenti la
// rotazione y accumulata farebbe "affondare" l'isola di lato invece di
// girarla come un giradischi.
function IslandArt({ reducedMotion }: { reducedMotion: boolean }) {
  const model = (
    <group rotation={[0, -0.5, 0]} position={[0, -0.15, 0]}>
      <IslandScene reducedMotion={reducedMotion} />
    </group>
  );
  // reduced-motion: nessun idle loop (Float usa useFrame permanente) — modello statico
  if (reducedMotion) return model;
  return (
    <Float speed={1.2} rotationIntensity={0.25} floatIntensity={0.4}>
      {model}
    </Float>
  );
}

// L'isola è protagonista a tutto palco: scala calcolata dal frustum reale
// (viewport r3f a z=0) così sta dentro sia il widescreen sia il 390px mobile.
// Il group `onGroup` è il bersaglio della timeline GSAP (rotation/position);
// sta FUORI dal group di scala, quindi i tween di posizione sono in unità
// mondo e non vengono ridotti su mobile. PresentationControls avvolge tutto:
// il drag compone sopra la rotazione da scroll senza conflitti.
function IslandRig({ reducedMotion, onGroup }: { reducedMotion: boolean; onGroup: (g: Group | null) => void }) {
  const viewport = useThree((s) => s.viewport);
  const scale = Math.min(0.62, (viewport.width * 0.82) / 4.6);
  return (
    <PresentationControls global={false} snap speed={1.4} polar={[-0.4, 0.4]} azimuth={[-0.7, 0.7]}>
      {/* tilt di ripresa fisso (vista dall'alto in 3/4): resta fermo mentre
          il group interno ruota, così lo spin da scroll è un giradischi e il
          recede in z porta l'isola indietro e leggermente in alto (frame
          inclinato), rafforzando la profondità. */}
      <group rotation={[0.42, 0, 0]}>
        <group ref={onGroup}>
          <group scale={scale}>
            <IslandArt reducedMotion={reducedMotion} />
          </group>
        </group>
      </group>
    </PresentationControls>
  );
}

function StageCanvas({ reducedMotion, onGroup }: { reducedMotion: boolean; onGroup: (g: Group | null) => void }) {
  return (
    <>
      {/* alone al neon dietro il disegno: la scritta/i colori scuri sparirebbero
          sul palco nero senza un controluce colorato. Sotto la Canvas in z-order
          (nessuna z-index esplicita necessaria: precede il <Canvas> nel DOM). */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[72%] w-[62%] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            'radial-gradient(closest-side, rgba(255,0,84,0.4), rgba(0,245,212,0.12) 60%, transparent 75%)',
          filter: 'blur(48px)',
        }}
      />
      <Canvas
        camera={{ position: [0, 0, 4], fov: 40 }}
        onCreated={({ gl }) => {
          gl.domElement.style.touchAction = 'pan-y';
        }}
      >
        {/* rig tarato per la scena flat-shaded: colori cartoon accesi senza slavarli */}
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 4, 5]} intensity={1.6} />
        <directionalLight position={[-3, 1, -2]} intensity={0.35} color="#00f5d4" />
        <pointLight position={[-3, -1.5, -2.5]} intensity={0.25} color="#ff0054" decay={0} />
        <Suspense fallback={null}>
          <IslandRig reducedMotion={reducedMotion} onGroup={onGroup} />
        </Suspense>
      </Canvas>
    </>
  );
}

function Caption({ section }: { section: SplitSection }) {
  return (
    <>
      <h2
        className="split-title text-bbh text-5xl font-extrabold uppercase md:text-7xl"
        style={{ color: section.accent, textShadow: '4px 4px 0 #000' }}
      >
        {section.title}
      </h2>
      <p
        className="split-text text-sora mt-6 max-w-md text-lg text-white md:text-xl"
        style={{ textShadow: '0 2px 14px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.8)' }}
      >
        {section.text}
      </p>
    </>
  );
}

export default function SplitScroll({ sections }: { sections: SplitSection[] }) {
  const root = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  // callback-ref/onReady: il group three monta DOPO il primo commit React
  // (reconciler r3f) — lo stato forza il re-run dell'effetto quando è pronto.
  const [scrollGroup, setScrollGroup] = useState<Group | null>(null);
  const reducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  useLayoutEffect(() => {
    if (reducedMotion || !root.current || !stageRef.current || !scrollGroup) return;
    const g = scrollGroup;
    const captions = Array.from(root.current.querySelectorAll<HTMLElement>('.split-caption'));
    if (!captions.length) return;

    // matchMedia: su mobile il frustum è stretto (~1.3 unità) — le stesse
    // ampiezze del desktop spingerebbero l'isola fuori inquadratura a metà
    // transizione. La timeline si ricostruisce da sola al cambio breakpoint.
    const mm = gsap.matchMedia();
    mm.add({ mobile: '(max-width: 767px)', desktop: '(min-width: 768px)' }, (mctx) => {
      const mobile = Boolean((mctx.conditions as { mobile?: boolean }).mobile);
      const SWAY = mobile ? 0.1 : 0.35; // ondeggiamento laterale
      const BACK = mobile ? -1.0 : -1.6; // profondità del recede

      // Un solo palco pinnato: tutto il viaggio (N sezioni) avviene dentro
      // questo viewport, lo scrub lega la coreografia allo scroll.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: stageRef.current,
          start: 'top top',
          end: `+=${sections.length * 100}%`,
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
        },
      });

      // Intro: l'isola arriva dal fondo e si assesta al centro mentre il primo
      // testo si materializza (niente traslazioni verticali sul testo, mai).
      tl.fromTo(g.position, { z: BACK * 0.85 }, { z: 0, duration: INTRO, ease: 'power2.out' }, 0)
        .fromTo(g.rotation, { y: -0.45 }, { y: 0, duration: INTRO, ease: 'power2.out' }, 0)
        .fromTo(
          captions[0],
          { autoAlpha: 0, scale: 0.96 },
          { autoAlpha: 1, scale: 1, duration: INTRO * 0.55, ease: 'power2.out' },
          INTRO * 0.45
        );

      // Transizioni i -> i+1: l'isola RUOTA (~1.1 rad, ogni sosta mostra una
      // faccia diversa), ARRETRA in profondità e TORNA avanti con un leggero
      // ondeggiamento laterale alternato; il testo vecchio svanisce all'inizio,
      // il nuovo compare mentre l'isola rientra in scena.
      let t = INTRO + HOLD;
      for (let i = 0; i < captions.length - 1; i++) {
        // ondeggia dal lato OPPOSTO al testo in arrivo (testi pari a sinistra,
        // dispari a destra): l'isola non deve mai coprire la scritta che nasce
        const dir = i % 2 === 0 ? -1 : 1;
        tl.to(captions[i], { autoAlpha: 0, scale: 0.96, duration: TRANS * 0.28, ease: 'power2.in' }, t)
          .to(g.rotation, { y: `+=${1.1}`, duration: TRANS, ease: 'power2.inOut' }, t)
          .to(g.position, { z: BACK, duration: TRANS / 2, ease: 'power2.in' }, t)
          .to(g.position, { z: 0, duration: TRANS / 2, ease: 'power2.out' }, t + TRANS / 2)
          .to(g.position, { x: SWAY * dir, duration: TRANS / 2, ease: 'sine.inOut' }, t)
          .to(g.position, { x: 0, duration: TRANS / 2, ease: 'sine.inOut' }, t + TRANS / 2)
          .fromTo(
            captions[i + 1],
            { autoAlpha: 0, scale: 0.96 },
            { autoAlpha: 1, scale: 1, duration: TRANS * 0.32, ease: 'power2.out' },
            t + TRANS * 0.62
          );
        t += TRANS + HOLD;
      }
      // sosta finale: l'ultimo testo resta in scena prima dello sblocco del pin
      tl.to({}, { duration: HOLD }, t - HOLD);
    });
    return () => mm.revert();
  }, [reducedMotion, scrollGroup, sections.length]);

  // Fallback reduced-motion: niente pin, niente timeline — isola centrata
  // statica e i testi tutti visibili, impilati sotto, tutto leggibile.
  if (reducedMotion) {
    return (
      <section ref={root} className="relative bg-black">
        <div className="relative h-[60vh] w-full overflow-hidden">
          <StageCanvas reducedMotion onGroup={setScrollGroup} />
        </div>
        <div className="grid gap-14 px-8 pb-20 pt-6 md:grid-cols-2 md:px-14">
          {sections.map((s) => (
            <div key={s.key}>
              <Caption section={s} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section ref={root} className="relative bg-black">
      {/* palco unico h-screen, pinnato dalla ScrollTrigger: canvas a tutto
          schermo, isola al centro, testi in overlay assoluto che si
          materializzano sul posto (autoAlpha + micro-scale, MAI translate y). */}
      <div ref={stageRef} className="relative h-screen w-full overflow-hidden bg-black">
        <StageCanvas reducedMotion={false} onGroup={setScrollGroup} />
        {sections.map((s, i) => (
          <div
            key={s.key}
            // pointer-events-none: il drag della PresentationControls deve
            // funzionare anche sopra l'area del testo.
            className={`pointer-events-none absolute inset-x-0 bottom-8 z-10 mx-auto w-[90%] max-w-md md:inset-x-auto md:bottom-auto md:top-1/2 md:mx-0 md:w-auto md:max-w-sm md:-translate-y-1/2 ${
              i % 2 === 0 ? 'md:left-[6%]' : 'md:right-[6%]'
            }`}
          >
            {/* elemento animato separato dal wrapper posizionato: gsap tocca
                solo questo (autoAlpha/scale), il translate Tailwind resta suo.
                Su mobile un velo scuro dietro il testo per la leggibilità. */}
            <div className="split-caption invisible rounded-2xl bg-black/55 p-5 opacity-0 backdrop-blur-sm md:bg-transparent md:p-0 md:backdrop-blur-none">
              <Caption section={s} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
