import { Suspense, useMemo } from 'react';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { Center, Float, PresentationControls } from '@react-three/drei';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import * as THREE from 'three';
import HeroBackdrop from './HeroBackdrop';

export function webglAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

// Scala il testo in base alla larghezza viewport (mobile: scritta più piccola)
function ResponsiveGroup({ children }: { children: React.ReactNode }) {
  const { viewport } = useThree();
  const scale = Math.min(0.65, viewport.width / 6.8);
  return <group scale={scale}>{children}</group>;
}

function NeonLogo() {
  const svg = useLoader(SVGLoader, '/tendart-logo.svg');
  const geometry = useMemo(() => {
    const shapes = svg.paths.flatMap((p) => SVGLoader.createShapes(p));
    return new THREE.ExtrudeGeometry(shapes, {
      depth: 60,
      bevelEnabled: true,
      bevelSize: 4,
      bevelThickness: 5,
      curveSegments: 8,
    });
  }, [svg]);
  return (
    <Center>
      {/* SVG ha Y verso il basso: scala Y negativa per raddrizzare.
          DoubleSide: le pareti interne dei buchi (D, A, R) escono con la normale invertita
          e verrebbero scartate, lasciando la D "bucata" invece che scavata */}
      <mesh geometry={geometry} scale={[0.006, -0.006, 0.006]}>
        <meshStandardMaterial
          color="#ff0054"
          emissive="#ff0054"
          emissiveIntensity={0.2}
          metalness={0.3}
          roughness={0.25}
          side={THREE.DoubleSide}
        />
      </mesh>
    </Center>
  );
}

function ScrollHint() {
  return (
    <div className="pointer-events-none absolute bottom-8 z-20 w-full animate-bounce text-center text-sora text-white/70">
      scroll ↓
    </div>
  );
}

const REDUCED = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// dal nero al blu notte: in fondo è esattamente il colore d'apertura del crepuscolo
// (NightSky .sky-dusk, #03061a), così hero e sezione isola si fondono senza stacco
const HERO_BG = 'linear-gradient(180deg, #000 0%, #01020a 55%, #03061a 100%)';

export default function Hero3D() {
  if (!webglAvailable()) {
    // Fallback CSS neon senza WebGL
    return (
      <section className="relative flex h-screen w-full items-center justify-center" style={{ background: HERO_BG }}>
        <HeroBackdrop />
        <h1
          className="relative z-10 text-bbh text-6xl font-extrabold uppercase md:text-9xl"
          style={{ color: '#ff0054', textShadow: '0 0 20px #ff0054, 0 0 60px #00f5d4' }}
        >
          TENDART
        </h1>
        <ScrollHint />
      </section>
    );
  }

  return (
    <section className="relative h-screen w-full" style={{ background: HERO_BG }}>
      <HeroBackdrop />
      <Canvas
        className="relative z-10"
        camera={{ position: [0, 0, 5], fov: 45 }}
        onCreated={({ gl }) => { gl.domElement.style.touchAction = 'pan-y'; }}
      >
        <ambientLight intensity={0.15} />
        <directionalLight position={[3, 4, 5]} intensity={2} color="#ffffff" />
        <pointLight position={[4, 2, 4]} color="#00f5d4" intensity={25} />
        <pointLight position={[-4, -2, 3]} color="#8cff00" intensity={18} />
        <Suspense fallback={null}>
          <PresentationControls global snap speed={1.4} polar={[-0.6, 0.6]} azimuth={[-1, 1]}>
            <ResponsiveGroup>
              {/* ondeggiamento lento da logo di menu; fermo con reduced-motion */}
              <Float speed={REDUCED ? 0 : 2} rotationIntensity={REDUCED ? 0 : 0.6} floatIntensity={REDUCED ? 0 : 1.6} floatingRange={[-0.15, 0.15]}>
                <NeonLogo />
              </Float>
            </ResponsiveGroup>
          </PresentationControls>
        </Suspense>
      </Canvas>
      <ScrollHint />
    </section>
  );
}
