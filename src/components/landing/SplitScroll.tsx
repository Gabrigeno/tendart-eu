import { Suspense, useLayoutEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { PresentationControls, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface SplitSection {
  key: string;
  title: string;
  text: string;
  accent: string;
}

// L'immagine sorgente ha una didascalia "Loading..." cotta nel ~18-20% inferiore:
// la tagliamo via mostrando solo la parte alta della texture (repeat/offset in V).
const CROP_KEEP = 0.8; // frazione superiore dell'immagine da mostrare (taglia il resto in basso)

function CartArt() {
  const texture = useTexture('/tendart-cart.jpg');
  texture.repeat.set(1, CROP_KEEP);
  texture.offset.set(0, 1 - CROP_KEEP);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return (
    <mesh>
      <planeGeometry args={[3.4, 3.4 * CROP_KEEP]} />
      <meshBasicMaterial map={texture} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  );
}

export default function SplitScroll({ sections }: { sections: SplitSection[] }) {
  const root = useRef<HTMLDivElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!root.current) return;
    const ctx = gsap.context(() => {
      const blocks = gsap.utils.toArray<HTMLElement>('.split-block');
      if (reduced) return; // contenuto resta visibile, canvas resta a sinistra, niente animazioni

      // reveal testo — pop-in in stile punk quando il blocco entra
      blocks.forEach((block) => {
        gsap.from(block.querySelectorAll('.split-title, .split-text'), {
          opacity: 0,
          scale: 1.4,
          yPercent: 30,
          stagger: 0.1,
          ease: 'steps(4)',
          scrollTrigger: {
            trigger: block,
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        });
      });

      // zigzag: l'illustrazione salta di lato ad ogni sezione (solo desktop)
      const mm = gsap.matchMedia();
      mm.add('(min-width: 768px)', () => {
        blocks.forEach((block, i) => {
          const toRight = i % 2 !== 0; // indici dispari: testo a sinistra -> immagine a destra
          ScrollTrigger.create({
            trigger: block,
            start: 'top center',
            end: 'bottom center',
            onEnter: () =>
              gsap.to(canvasWrapRef.current, { xPercent: toRight ? 100 : 0, ease: 'steps(3)', duration: 0.4 }),
            onEnterBack: () =>
              gsap.to(canvasWrapRef.current, { xPercent: toRight ? 100 : 0, ease: 'steps(3)', duration: 0.4 }),
          });
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="relative bg-black">
      {/* livello visivo: sticky (da md in su), l'illustrazione 3D che salta lato */}
      <div className="relative z-0 h-[45vh] w-full md:sticky md:top-0 md:h-screen">
        <div
          ref={canvasWrapRef}
          className="pointer-events-auto relative h-full w-full md:absolute md:left-0 md:top-0 md:w-1/2"
          style={{ background: '#F7F4EC' }}
        >
          <Canvas
            camera={{ position: [0, 0, 4], fov: 40 }}
            onCreated={({ gl }) => {
              gl.domElement.style.touchAction = 'pan-y';
            }}
          >
            <ambientLight intensity={0.9} />
            <directionalLight position={[3, 4, 5]} intensity={0.6} />
            <Suspense fallback={null}>
              <PresentationControls global={false} snap speed={1.4} polar={[-0.4, 0.4]} azimuth={[-0.7, 0.7]}>
                <CartArt />
              </PresentationControls>
            </Suspense>
          </Canvas>
        </div>
      </div>

      {/* livello testo: flusso normale, si sovrappone al livello visivo solo da md in su */}
      <div className="relative z-10 md:-mt-[100vh]">
        {sections.map((s, i) => (
          <div
            key={s.key}
            className={`split-block flex min-h-screen w-full flex-col justify-center px-8 md:w-1/2 md:px-14 ${
              i % 2 === 0 ? 'md:ml-[50%]' : ''
            }`}
          >
            <h2
              className="split-title text-bbh text-5xl font-extrabold uppercase md:text-7xl"
              style={{ color: s.accent, textShadow: '4px 4px 0 #000' }}
            >
              {s.title}
            </h2>
            <p className="split-text text-sora mt-6 max-w-md text-lg text-white md:text-xl">{s.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
