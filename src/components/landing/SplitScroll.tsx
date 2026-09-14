import { Suspense, useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Float, PresentationControls, useTexture } from '@react-three/drei';
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

// Aspect ratio reale del PNG con sfondo trasparente (749x609).
const CART_ASPECT = 609 / 749;

function CartArt({ reducedMotion }: { reducedMotion: boolean }) {
  const texture = useTexture('/tendart-cart.png');
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  const mesh = (
    <mesh>
      <planeGeometry args={[3.4, 3.4 * CART_ASPECT]} />
      <meshBasicMaterial
        map={texture}
        side={THREE.DoubleSide}
        transparent
        alphaTest={0.05}
        toneMapped={false}
      />
    </mesh>
  );
  // reduced-motion: nessun idle loop (Float usa useFrame permanente) — mesh statica
  if (reducedMotion) return mesh;
  return (
    <Float speed={1.2} rotationIntensity={0.25} floatIntensity={0.4}>
      {mesh}
    </Float>
  );
}

export default function SplitScroll({ sections }: { sections: SplitSection[] }) {
  const root = useRef<HTMLDivElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  useLayoutEffect(() => {
    const reduced = reducedMotion;
    if (!root.current) return;
    const ctx = gsap.context(() => {
      const blocks = gsap.utils.toArray<HTMLElement>('.split-block');
      if (reduced) return; // contenuto resta visibile, canvas resta a sinistra, niente animazioni

      // reveal testo — comparsa morbida (titolo poi testo, leggero stagger)
      blocks.forEach((block) => {
        const title = block.querySelectorAll('.split-title');
        const text = block.querySelectorAll('.split-text');
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: block,
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        });
        tl.from(title, { autoAlpha: 0, y: 40, duration: 0.8, ease: 'power2.out' }).from(
          text,
          { autoAlpha: 0, y: 40, duration: 0.8, ease: 'power2.out' },
          '-=0.6'
        );
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
              gsap.to(canvasWrapRef.current, { xPercent: toRight ? 100 : 0, ease: 'power3.inOut', duration: 0.8 }),
            onEnterBack: () =>
              gsap.to(canvasWrapRef.current, { xPercent: toRight ? 100 : 0, ease: 'power3.inOut', duration: 0.8 }),
          });
        });
      });
    }, root);
    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section ref={root} className="relative bg-black">
      {/* livello visivo: sticky (da md in su), l'illustrazione 3D che salta lato.
          overflow-hidden: la canvas che scivola (xPercent 0/100) resta sempre
          contenuta entro i 2 pannelli, mai oltre il bordo del viewport. */}
      <div className="relative z-0 h-[45vh] w-full overflow-hidden md:sticky md:top-0 md:h-screen">
        <div
          ref={canvasWrapRef}
          className="pointer-events-auto relative h-full w-full bg-black md:absolute md:left-0 md:top-0 md:w-1/2"
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
                <CartArt reducedMotion={reducedMotion} />
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
