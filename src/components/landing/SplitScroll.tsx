import { Suspense, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, PresentationControls } from '@react-three/drei';
import type { AmbientLight, Group } from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'react-router-dom';
import { IslandScene, nightState } from './IslandScene';
import { NightSky } from './NightSky';
import { FanzineIcon } from './FanzineIcon';

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
// transizione FINALE (Concerti -> recap+CTA): più lunga delle normali perché
// deve leggersi in tre battute — vola via piccola / FLASH / rientro col finale.
const FTRANS = 2.0;

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

// luce ambiente che cala col buio: il falò (che intanto cresce) resta la fonte calda
function NightAmbient() {
  const ref = useRef<AmbientLight>(null);
  useFrame(() => {
    if (ref.current) ref.current.intensity = 0.8 - nightState.value * 0.3;
  });
  return <ambientLight ref={ref} intensity={0.8} />;
}

function StageCanvas({
  reducedMotion,
  onGroup,
  onFanzineGroup,
  onIconReady,
}: {
  reducedMotion: boolean;
  onGroup: (g: Group | null) => void;
  // opzionale: SOLO il palco animato lo passa. Nel fallback reduced-motion
  // (Canvas separata sopra i testi statici, niente pin/timeline) l'icona 3D
  // non avrebbe un punto di sincronia sensato col bottone HTML più in basso
  // nel flusso — quindi qui viene semplicemente omessa.
  onFanzineGroup?: (g: Group | null) => void;
  // trigger del flourish esposto da FanzineIcon: il link HTML "Guarda le
  // nostre fanzine →" in SplitScroll lo richiama per animare l'icona prima
  // di navigare. Passato solo insieme a onFanzineGroup (palco animato).
  onIconReady?: (trigger: (() => void) | null) => void;
}) {
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
        // densità pixel limitata: sui telefoni dpr 3 raddoppia il lavoro della GPU per
        // un guadagno invisibile su una scena flat-shaded
        dpr={[1, 1.5]}
        onCreated={({ gl }) => {
          gl.domElement.style.touchAction = 'pan-y';
        }}
      >
        {/* rig tarato per la scena flat-shaded: colori cartoon accesi senza slavarli */}
        <NightAmbient />
        <directionalLight position={[3, 4, 5]} intensity={1.6} />
        <directionalLight position={[-3, 1, -2]} intensity={0.35} color="#00f5d4" />
        <pointLight position={[-3, -1.5, -2.5]} intensity={0.25} color="#ff0054" decay={0} />
        <Suspense fallback={null}>
          <IslandRig reducedMotion={reducedMotion} onGroup={onGroup} />
          {onFanzineGroup && (
            // Sorella dell'isola ma FUORI da PresentationControls: non deve
            // seguire il drag/rotazione manuale dell'isola, resta ancorata
            // vicino al link "Guarda le nostre fanzine →" (basso, vicino al
            // centro nel finale) — x ravvicinato al centro (non -0.6 come
            // prima) così icona 3D e link HTML leggono come UNA coppia
            // affiancata, non due elementi sparsi ai lati opposti dello
            // schermo. Scale quasi-zero di partenza: la timeline GSAP la
            // porta a FANZINE_SCALE in sync col resto del finale — evita un
            // flash a piena scala prima che l'effetto giri.
            <group ref={onFanzineGroup} scale={0.0001} position={[0, -0.78, 0.45]}>
              <FanzineIcon reducedMotion={reducedMotion} onReady={onIconReady} />
            </group>
          )}
        </Suspense>
      </Canvas>
    </>
  );
}

function Caption({ section }: { section: SplitSection }) {
  return (
    <>
      <h2
        className="split-title text-bbh text-4xl font-extrabold uppercase md:text-7xl"
        style={{ color: section.accent, textShadow: '4px 4px 0 #000' }}
      >
        {section.title}
      </h2>
      <p
        className="split-text text-sora mt-3 max-w-md text-base text-white md:mt-6 md:text-xl"
        style={{ textShadow: '0 2px 14px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.8)' }}
      >
        {section.text}
      </p>
    </>
  );
}

// CTA fanzine del finale (semplificata da feedback utente, task 18): niente
// più heading/bottone bordati — solo il link testuale, maiuscolo spaziato
// in accento. Se `onTrigger` è passato
// (palco animato, icona presente) il click fa partire il flourish
// sull'icona 3D e la navigazione avviene al suo completamento; senza
// `onTrigger` (fallback reduced-motion, icona omessa) è un <Link> normale
// che naviga subito. pointer-events-auto: dentro .split-finale che è
// pointer-events-none, va riattivato qui — l'autoAlpha=0 lo disabilita da
// solo via visibility:hidden, il drag dell'isola non ne risente.
function FanzineCtaLink({ onTrigger }: { onTrigger?: () => void }) {
  const linkClassName =
    'text-sora pointer-events-auto inline-block text-sm font-bold uppercase tracking-widest hover:underline';
  const linkStyle = { color: '#ff0054', textShadow: '0 2px 10px rgba(0,0,0,0.9)' } as const;

  if (onTrigger) {
    return (
      <a
        href="/library"
        onClick={(e) => {
          e.preventDefault();
          onTrigger();
        }}
        className={linkClassName}
        style={linkStyle}
      >
        Guarda le nostre fanzine →
      </a>
    );
  }
  return (
    <Link to="/library" className={linkClassName} style={linkStyle}>
      Guarda le nostre fanzine →
    </Link>
  );
}

// Disposizione RADIALE del finale: i 4 blocchi (titolo + paragrafo COMPLETO)
// ai quattro angoli attorno all'isola — che al finale resta in scena, tornata
// nella posa di riposo ma un po' più piccola per fare spazio — e la CTA in
// basso al centro. NIENTE pannello/modale attorno al gruppo: palco nero nudo,
// leggibilità affidata alle ombre dei testi. I blocchi di destra sono allineati
// a destra così il "ventaglio" si legge simmetrico rispetto all'isola.
const FINALE_POS = [
  'left-[4%] top-[7%] w-[45%] md:left-[5%] md:top-[13%] md:w-auto md:max-w-xs',
  'right-[4%] top-[7%] w-[45%] text-right md:right-[5%] md:top-[13%] md:w-auto md:max-w-xs',
  'left-[4%] top-[52%] w-[45%] md:left-[5%] md:top-auto md:bottom-[21%] md:w-auto md:max-w-xs',
  'right-[4%] top-[52%] w-[45%] text-right md:right-[5%] md:top-auto md:bottom-[21%] md:w-auto md:max-w-xs',
];

function FinaleBlocks({ sections, onIconTrigger }: { sections: SplitSection[]; onIconTrigger?: () => void }) {
  return (
    <>
      {sections.map((s, i) => (
        // blocco intero cliccabile (area di click = tutta la didascalia), freccia minimal
        // accanto al titolo. Link ancora MOCK: le pagine di sezione non esistono ancora.
        <a
          key={s.key}
          href="#"
          onClick={(e) => e.preventDefault()}
          aria-label={s.title}
          className={`group pointer-events-auto absolute block ${FINALE_POS[i % FINALE_POS.length]}`}
        >
          <h3
            className="text-bbh text-xl font-extrabold uppercase md:text-3xl"
            style={{ color: s.accent, textShadow: '2px 2px 0 #000' }}
          >
            {s.title}
            <span className="ml-2 inline-block text-base transition-transform duration-200 group-hover:translate-x-1 md:text-xl">→</span>
          </h3>
          <p
            className="text-sora mt-1 text-xs text-white/95 md:mt-2 md:text-sm"
            style={{ textShadow: '0 2px 12px rgba(0,0,0,0.95), 0 0 4px rgba(0,0,0,0.85)' }}
          >
            {s.text}
          </p>
        </a>
      ))}
      {/* CTA testuale centrata: l'icona 3D (x=-0.22 in world units, poco a
          sinistra dell'origine) proietta appena a sinistra del centro nella
          stessa fascia verticale — il link centrato le sta "accanto" con un
          piccolo margine, non sparso all'altro capo dello schermo. */}
      <div className="absolute inset-x-0 bottom-[6%] flex justify-center md:bottom-[7%]">
        <FanzineCtaLink onTrigger={onIconTrigger} />
      </div>
    </>
  );
}

export default function SplitScroll({ sections }: { sections: SplitSection[] }) {
  const root = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  // callback-ref/onReady: il group three monta DOPO il primo commit React
  // (reconciler r3f) — lo stato forza il re-run dell'effetto quando è pronto.
  const [scrollGroup, setScrollGroup] = useState<Group | null>(null);
  const [fanzineGroup, setFanzineGroup] = useState<Group | null>(null);
  // trigger del flourish esposto da FanzineIcon (callback-ref, non state: non
  // serve un re-render quando cambia) — il link "Guarda le nostre fanzine →"
  // lo richiama per animare l'icona prima di navigare.
  const iconTriggerRef = useRef<(() => void) | null>(null);
  const handleIconReady = useCallback((trigger: (() => void) | null) => {
    iconTriggerRef.current = trigger;
  }, []);
  const handleIconTrigger = useCallback(() => {
    iconTriggerRef.current?.();
  }, []);
  const reducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  useLayoutEffect(() => {
    if (reducedMotion || !root.current || !stageRef.current || !scrollGroup) return;
    const g = scrollGroup;
    const captions = Array.from(root.current.querySelectorAll<HTMLElement>('.split-caption'));
    const flash = root.current.querySelector<HTMLElement>('.split-flash');
    const finale = root.current.querySelector<HTMLElement>('.split-finale');
    if (!captions.length) return;

    // matchMedia: su mobile il frustum è stretto (~1.3 unità) — le stesse
    // ampiezze del desktop spingerebbero l'isola fuori inquadratura a metà
    // transizione. La timeline si ricostruisce da sola al cambio breakpoint.
    const mm = gsap.matchMedia();
    mm.add({ mobile: '(max-width: 767px)', desktop: '(min-width: 768px)' }, (mctx) => {
      const mobile = Boolean((mctx.conditions as { mobile?: boolean }).mobile);
      const SWAY = mobile ? 0.1 : 0.35; // ondeggiamento laterale
      const BACK = mobile ? -1.0 : -1.6; // profondità del recede
      // SOLO per la transizione finale: il z-recede da solo non "vende" la
      // distanza (fov 40, poca prospettiva) — la scala del group scende in
      // sincrono col recede, l'isola vola via PICCOLA e torna a piena
      // grandezza. 0.55 = metà abbondante, leggibile come "è lontana".
      const SHRINK = 0.55;
      // scala di riposo del finale: l'isola torna "a casa" ma leggermente
      // ridotta, così i 4 blocchi radiali le respirano attorno.
      const FINAL_SCALE = 0.7;
      // scala a riposo dell'icona fanzine 3D: piccola, un accento accanto
      // alla CTA — non deve competere con l'isola per attenzione.
      const FANZINE_SCALE = 0.62;
      // su mobile i testi stanno in basso: l'isola sale per non finirci sotto,
      // e torna al centro nella transizione finale (il finale è radiale).
      const LIFT = mobile ? 0.35 : 0;
      gsap.set(g.position, { y: LIFT });

      // Un solo palco pinnato: tutto il viaggio (N sezioni + sosta finale
      // recap+CTA) avviene dentro questo viewport, lo scrub lega la
      // coreografia allo scroll: 5 soste -> distanza (N+1)×100%.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: stageRef.current,
          start: 'top top',
          end: `+=${(sections.length + 1) * 100}%`,
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

      // Transizioni NORMALI i -> i+1 (tra le 4 sezioni, nessun flash/shrink):
      // l'isola RUOTA (~1.1 rad, ogni sosta mostra una faccia diversa), ARRETRA
      // in profondità e TORNA avanti con un leggero ondeggiamento laterale
      // alternato; il testo vecchio svanisce all'inizio, il nuovo compare
      // mentre l'isola rientra in scena.
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

      // TRANSIZIONE FINALE (una sola, dopo "Concerti"): l'isola ARRETRA
      // RIMPICCIOLENDO (recede+shrink insieme = vola via lontana e piccola,
      // recede più profondo delle transizioni normali), poi rientra "A CASA":
      // la yaw chiude il giro esatto (2π ≡ posa di riposo dell'intro), quindi
      // alla sosta finale l'isola è identica all'inizio del palco. Sul rientro
      // il ritorno di scala ha un lieve overshoot (back.out) e lo "snap" a
      // piena grandezza coincide con un FLASH di luce che lava lo schermo un
      // attimo prima che il finale diventi leggibile. Niente sway: il rientro
      // è dritto al centro, il finale è centrato.
      const FBACK = BACK * 1.25;
      tl.to(captions[captions.length - 1], { autoAlpha: 0, scale: 0.96, duration: FTRANS * 0.28, ease: 'power2.in' }, t)
        .to(g.rotation, { y: Math.PI * 2, duration: FTRANS, ease: 'power2.inOut' }, t)
        .to(g.position, { z: FBACK, duration: FTRANS / 2, ease: 'power2.in' }, t)
        .to(g.position, { z: 0, duration: FTRANS / 2, ease: 'power2.out' }, t + FTRANS / 2)
        .to(g.position, { y: 0, duration: FTRANS, ease: 'power2.inOut' }, t)
        .to(g.scale, { x: SHRINK, y: SHRINK, z: SHRINK, duration: FTRANS / 2, ease: 'power2.in' }, t)
        // il rientro NON torna a scala piena: si ferma a FINAL_SCALE per fare
        // spazio ai 4 blocchi radiali del finale attorno all'isola (concesso
        // esplicitamente: posa di casa ma un filo più piccola).
        .to(g.scale, { x: FINAL_SCALE, y: FINAL_SCALE, z: FINAL_SCALE, duration: FTRANS / 2, ease: 'back.out(1.4)' }, t + FTRANS / 2);
      // flash: salita fulminea appena l'isola riparte in avanti, decadimento
      // mentre il finale si materializza (il picco ne precede la leggibilità).
      // Durate come frazioni di FTRANS: lo scrub le mappa sullo scroll, quindi
      // contano i rapporti, non i secondi.
      if (flash) {
        tl.fromTo(
          flash,
          { autoAlpha: 0 },
          { autoAlpha: 0.75, duration: FTRANS * 0.08, ease: 'power4.out' },
          t + FTRANS * 0.52
        ).to(flash, { autoAlpha: 0, duration: FTRANS * 0.24, ease: 'power2.in' }, t + FTRANS * 0.6);
      }
      // il finale (recap 4 sezioni + CTA fanzine) si materializza sul posto
      // mentre l'isola si riassesta — stesso trattamento delle caption.
      if (finale) {
        tl.fromTo(
          finale,
          { autoAlpha: 0, scale: 0.96 },
          { autoAlpha: 1, scale: 1, duration: FTRANS * 0.32, ease: 'power2.out' },
          t + FTRANS * 0.62
        );
      }
      // l'icona 3D della fanzine si materializza in sync col resto del
      // finale (stesso istante d'ingresso del div .split-finale) con un
      // piccolo overshoot back.out — stesso linguaggio del rientro
      // dell'isola, così le due "pop-in" leggono come un unico gesto.
      if (fanzineGroup) {
        tl.fromTo(
          fanzineGroup.scale,
          { x: 0.0001, y: 0.0001, z: 0.0001 },
          { x: FANZINE_SCALE, y: FANZINE_SCALE, z: FANZINE_SCALE, duration: FTRANS * 0.32, ease: 'back.out(1.6)' },
          t + FTRANS * 0.62
        );
      }
      // sosta finale: il recap+CTA resta in scena prima dello sblocco del pin
      tl.to({}, { duration: HOLD }, t + FTRANS);

      // dal tramonto alla notte lungo tutto il palco: il blu da tramonto sfuma nei primi due
      // terzi, la notte stellata sale per tutto il percorso (solo opacità); falò via nightState
      const dusk = root.current?.querySelector<HTMLElement>('.sky-dusk');
      const night = root.current?.querySelector<HTMLElement>('.sky-night');
      if (dusk) tl.fromTo(dusk, { opacity: 1 }, { opacity: 0, duration: (t + FTRANS) * 0.7, ease: 'sine.inOut' }, 0);
      if (night) tl.fromTo(night, { opacity: 0 }, { opacity: 1, duration: t + FTRANS, ease: 'sine.in' }, 0);
      tl.fromTo(nightState, { value: 0 }, { value: 1, duration: t + FTRANS, ease: 'none' }, 0);

      // affordance di scroll: invito "scorri" fino alla prima transizione, poi la
      // linea di avanzamento sul bordo destro dice quanto manca
      const hint = root.current?.querySelector<HTMLElement>('.split-hint');
      const progress = root.current?.querySelector<HTMLElement>('.split-progress');
      if (hint) tl.to(hint, { autoAlpha: 0, duration: 0.3 }, INTRO + HOLD);
      if (progress) tl.fromTo(progress, { scaleY: 0 }, { scaleY: 1, duration: t + FTRANS * 0.5, ease: 'none' }, 0);
      // nel finale radiale sfumatura e barra coprirebbero icona fanzine e testi di destra
      const scrim = root.current?.querySelector<HTMLElement>('.split-scrim');
      const track = progress?.parentElement;
      [scrim, track].forEach((el) => el && tl.to(el, { autoAlpha: 0, duration: FTRANS * 0.3 }, t + FTRANS * 0.4));
    });
    return () => mm.revert();
  }, [reducedMotion, scrollGroup, fanzineGroup, sections.length]);

  // Fallback reduced-motion: niente pin, niente timeline — isola centrata
  // statica e i testi tutti visibili, impilati sotto, tutto leggibile.
  if (reducedMotion) {
    return (
      <section ref={root} className="relative bg-black">
        <div className="relative h-[60vh] w-full overflow-hidden">
          <NightSky dusk={0.5} night={0.5} />
          <StageCanvas reducedMotion onGroup={setScrollGroup} />
        </div>
        <div className="grid gap-14 px-8 pb-20 pt-6 md:grid-cols-2 md:px-14">
          {sections.map((s) => (
            <div key={s.key}>
              <Caption section={s} />
            </div>
          ))}
          {/* anche senza animazioni la sequenza chiude con la CTA fanzine,
              statica e visibile (i 4 paragrafi completi del finale sono già
              i testi qui sopra — niente doppione nel flusso statico). Niente
              icona 3D qui (omessa, decisione task 17) né flourish: reduced-
              motion naviga subito, un <Link> normale basta. */}
          <div className="md:col-span-2">
            <FanzineCtaLink />
          </div>
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
        {/* cielo tramonto → notte: sotto al canvas (trasparente), opacità dalla timeline */}
        <NightSky />
        <StageCanvas
          reducedMotion={false}
          onGroup={setScrollGroup}
          onFanzineGroup={setFanzineGroup}
          onIconReady={handleIconReady}
        />
        {/* sfumatura statica dal basso (solo mobile) sotto i testi: niente blur */}
        <div className="split-scrim pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[48%] bg-gradient-to-t from-black via-black/75 to-transparent md:hidden" />
        {/* avanzamento del palco: linea sottile sul bordo destro, riempita dalla timeline */}
        <div className="pointer-events-none absolute right-3 top-1/2 z-10 h-32 w-[2px] -translate-y-1/2 bg-white/15 md:right-6 md:h-48">
          <div className="split-progress h-full w-full origin-top scale-y-0 bg-white/80" />
        </div>
        {/* invito a scorrere: sparisce alla prima transizione */}
        <div className="split-hint text-sora pointer-events-none absolute inset-x-0 bottom-4 z-10 flex flex-col items-center gap-1 text-[11px] uppercase tracking-[0.3em] text-white/70 md:bottom-8">
          scorri
          <span className="animate-bounce text-base leading-none">↓</span>
        </div>
        {sections.map((s, i) => (
          <div
            key={s.key}
            // pointer-events-none: il drag della PresentationControls deve
            // funzionare anche sopra l'area del testo.
            className={`pointer-events-none absolute inset-x-0 bottom-16 z-10 mx-auto w-[88%] max-w-md md:inset-x-auto md:bottom-auto md:top-1/2 md:mx-0 md:w-auto md:max-w-sm md:-translate-y-1/2 ${
              i % 2 === 0 ? 'md:left-[6%]' : 'md:right-[6%]'
            }`}
          >
            {/* elemento animato separato dal wrapper posizionato: gsap tocca
                solo questo (autoAlpha/scale), il translate Tailwind resta suo.
                Niente pannello/backdrop-blur: su mobile il blur sopra il canvas
                animato ricalcolava a ogni frame (scatti). Leggibilità dalla
                sfumatura fissa .split-scrim + ombre del testo. */}
            <div className="split-caption invisible opacity-0">
              <Caption section={s} />
            </div>
          </div>
        ))}
        {/* FINALE (dopo il flash): i 4 paragrafi completi disposti RADIALMENTE
            attorno all'isola + CTA fanzine in basso — NON è una .split-caption,
            la timeline lo gestisce a parte. Wrapper a tutto palco, nessun
            pannello: il gsap anima autoAlpha/scale di questo div. Resta
            pointer-events-none per il drag; solo la CTA riattiva i click. */}
        <div className="split-finale pointer-events-none invisible absolute inset-0 z-10 opacity-0">
          <FinaleBlocks sections={sections} onIconTrigger={handleIconTrigger} />
        </div>
        {/* flash di rientro: velo bianco caldo con cuore magenta (palette punk),
            sopra canvas e testi (z-20) — il testo nuovo diventa leggibile solo
            quando il lampo decade. Animato via autoAlpha dalla timeline. */}
        <div
          className="split-flash pointer-events-none invisible absolute inset-0 z-20 opacity-0"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.95) 0%, rgba(255,214,231,0.85) 45%, rgba(255,0,84,0.35) 100%)',
          }}
        />
      </div>
    </section>
  );
}
