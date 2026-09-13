import { Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Center, PresentationControls, Text3D } from '@react-three/drei';

function webglAvailable(): boolean {
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
  const scale = Math.min(1, viewport.width / 9);
  return <group scale={scale}>{children}</group>;
}

function NeonText() {
  return (
    <Center>
      <Text3D
        font="/fonts/helvetiker_bold.typeface.json"
        size={1.1}
        height={0.35}
        bevelEnabled
        bevelSize={0.02}
        bevelThickness={0.03}
        curveSegments={8}
      >
        TENDART
        <meshStandardMaterial
          color="#ff0054"
          emissive="#ff0054"
          emissiveIntensity={0.9}
          metalness={0.3}
          roughness={0.25}
        />
      </Text3D>
    </Center>
  );
}

function ScrollHint() {
  return (
    <div className="pointer-events-none absolute bottom-8 w-full animate-bounce text-center text-sora text-white/70">
      scroll ↓
    </div>
  );
}

export default function Hero3D() {
  if (!webglAvailable()) {
    // Fallback CSS neon senza WebGL
    return (
      <section className="relative flex h-screen w-full items-center justify-center bg-black">
        <h1
          className="text-bbh text-6xl font-extrabold uppercase md:text-9xl"
          style={{ color: '#ff0054', textShadow: '0 0 20px #ff0054, 0 0 60px #00f5d4' }}
        >
          TENDART
        </h1>
        <ScrollHint />
      </section>
    );
  }

  return (
    <section className="relative h-screen w-full bg-black">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }} onCreated={({ gl }) => { gl.domElement.style.touchAction = 'pan-y'; }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[4, 2, 4]} color="#00f5d4" intensity={3} />
        <pointLight position={[-4, -2, 3]} color="#8cff00" intensity={2} />
        <Suspense fallback={null}>
          <PresentationControls global snap speed={1.4} polar={[-0.6, 0.6]} azimuth={[-1, 1]}>
            <ResponsiveGroup>
              <NeonText />
            </ResponsiveGroup>
          </PresentationControls>
        </Suspense>
      </Canvas>
      <ScrollHint />
    </section>
  );
}
