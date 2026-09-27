import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import * as THREE from 'three';
import { IslandScene, nightState } from '@/components/landing/IslandScene';
import { WIDE_VIEW, type CameraView, type Section } from '@/data/sections';

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = () => window.matchMedia('(max-width: 767px)').matches;

function useMobile() {
  const [m, setM] = useState(isMobile);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const on = () => setM(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return m;
}

// Rig camera: `base` (posizione + punto guardato) è tweenato da GSAP; ogni frame
// camera = base + parallasse del mouse (desktop). Un tween alla volta: ogni nuova
// inquadratura uccide il precedente (cambio sezione ripetuto durante il volo).
function CameraRig({ view }: { view: CameraView }) {
  const camera = useThree((s) => s.camera);
  const base = useRef({
    px: WIDE_VIEW.position[0], py: WIDE_VIEW.position[1], pz: WIDE_VIEW.position[2],
    tx: WIDE_VIEW.target[0], ty: WIDE_VIEW.target[1], tz: WIDE_VIEW.target[2],
  });
  const pointer = useRef({ x: 0, y: 0 });
  const look = useRef(new THREE.Vector3());

  useEffect(() => {
    const to = {
      px: view.position[0], py: view.position[1], pz: view.position[2],
      tx: view.target[0], ty: view.target[1], tz: view.target[2],
    };
    gsap.killTweensOf(base.current);
    if (reduced()) Object.assign(base.current, to);
    else gsap.to(base.current, { ...to, duration: 1.2, ease: 'power2.inOut' });
  }, [view]);

  useEffect(() => {
    if (reduced() || isMobile()) return;
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  useFrame(() => {
    const b = base.current;
    camera.position.set(b.px + pointer.current.x * 0.12, b.py - pointer.current.y * 0.08, b.pz);
    look.current.set(b.tx, b.ty, b.tz);
    camera.lookAt(look.current);
    if (import.meta.env.DEV) (window as unknown as { __sectionCam: { position: number[] } }).__sectionCam = { position: [b.px, b.py, b.pz] };
  });
  return null;
}

// Segnalino: ottaedro low-poly emissivo che galleggia e ruota sopra il posto
function Marker({ position, color }: { position: [number, number, number]; color: string }) {
  const ref = useRef<THREE.Group>(null);
  const still = reduced();
  useFrame((state) => {
    if (!ref.current || still) return;
    const t = state.clock.elapsedTime;
    ref.current.position.y = position[1] + Math.sin(t * 2) * 0.05;
    ref.current.rotation.y = t * 0.9;
  });
  return (
    <group ref={ref} position={position}>
      <mesh>
        <octahedronGeometry args={[0.09, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4} flatShading />
      </mesh>
      <pointLight color={color} intensity={1.2} distance={1.4} decay={2} position={[0, -0.25, 0]} />
    </group>
  );
}

export default function SectionStage({ section }: { section: Section }) {
  const mobile = useMobile();
  // sempre notte piena sulle pagine di sezione (falò al massimo); ripristino all'uscita
  useEffect(() => {
    nightState.value = 1;
    return () => {
      nightState.value = 0;
    };
  }, []);
  const view = mobile ? section.camera.mobile : section.camera.desktop;

  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: WIDE_VIEW.position, fov: 40 }}
      onCreated={({ gl }) => {
        gl.domElement.style.touchAction = 'pan-y';
      }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 5]} intensity={1.2} />
      <directionalLight position={[-3, 1, -2]} intensity={0.35} color="#00f5d4" />
      <Suspense fallback={null}>
        <IslandScene reducedMotion={reduced()} />
        <Marker position={section.marker} color={section.accent} />
      </Suspense>
      <CameraRig view={view} />
    </Canvas>
  );
}
