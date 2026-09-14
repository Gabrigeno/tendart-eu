import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Isola tendart procedurale low-poly — riproduce l'illustrazione (isola.jpg):
 * zolla verde con crosta di terra, tenda a sinistra, falò al centro, sabbia a
 * destra con le rocce dei petroglifi dietro, alberi-personaggio con lucine
 * intorno al bordo, funghetti e asse di legno come dettagli.
 * Niente scritta TENDART: solo l'isola e i suoi abitanti.
 * Gruppo puro (nessuna Canvas): si monta dentro la Canvas di SplitScroll.
 */

// hash pseudo-casuale deterministico dalla POSIZIONE del vertice: i vertici
// coincidenti (seam/cap dei cilindri sono duplicati) ricevono lo stesso offset,
// quindi il jitter non apre crepe nella mesh.
function posHash(x: number, y: number, z: number, seed: number) {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + seed * 53.37) * 43758.5453;
  return s - Math.floor(s);
}

function jitter(geom: THREE.BufferGeometry, amp: number, seed = 1, ampY = amp * 0.4) {
  const pos = geom.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    pos.setXYZ(
      i,
      x + (posHash(x, y, z, seed) - 0.5) * amp,
      y + (posHash(x, y, z, seed + 9) - 0.5) * ampY,
      z + (posHash(x, y, z, seed + 17) - 0.5) * amp
    );
  }
  pos.needsUpdate = true;
  geom.computeVertexNormals();
  return geom;
}

// La zolla è scalata [1.15, 1, 0.9] e il top è leggermente bombato:
// quota del prato in (x,z) per appoggiare gli oggetti senza farli fluttuare.
const SLAB_SCALE_X = 1.15;
const SLAB_SCALE_Z = 0.9;
const GRASS_TOP = 0.11;
const DOME = 0.13;
function groundY(x: number, z: number) {
  const r = Math.min(1, Math.hypot(x / SLAB_SCALE_X, z / SLAB_SCALE_Z) / 2);
  return GRASS_TOP + DOME * (1 - r) - 0.02;
}

const FLAT = { flatShading: true } as const;

function IslandSlab() {
  const grass = useMemo(() => {
    const g = new THREE.CylinderGeometry(2.02, 2.08, 0.13, 12, 1);
    // bombatura del prato: alza il cap superiore verso il centro
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      if (y > 0.05) {
        const r = Math.min(1, Math.hypot(pos.getX(i), pos.getZ(i)) / 2);
        pos.setY(i, y + DOME * (1 - r) + 0.05);
      }
    }
    return jitter(g, 0.18, 3, 0.04);
  }, []);
  const dirt = useMemo(() => jitter(new THREE.CylinderGeometry(2.1, 1.8, 0.45, 12, 1), 0.18, 3, 0.06), []);
  return (
    <group scale={[SLAB_SCALE_X, 1, SLAB_SCALE_Z]}>
      <mesh geometry={grass}>
        <meshStandardMaterial color="#6da34d" {...FLAT} />
      </mesh>
      <mesh geometry={dirt} position={[0, -0.28, 0]}>
        <meshStandardMaterial color="#b5975f" {...FLAT} />
      </mesh>
    </group>
  );
}

function SandPatch() {
  const geom = useMemo(() => jitter(new THREE.CylinderGeometry(0.85, 0.9, 0.05, 10, 1), 0.14, 7, 0.015), []);
  return (
    <mesh geometry={geom} position={[1.0, groundY(1.0, 0.3) + 0.02, 0.3]} scale={[1.15, 1, 0.75]}>
      <meshStandardMaterial color="#e6c860" {...FLAT} />
    </mesh>
  );
}

function Tent() {
  // prisma triangolare: cilindro a 3 segmenti con thetaStart=PI/2 e rotazione z
  // -> colmo orizzontale lungo X, un vertice in alto
  const prism = useMemo(() => jitter(new THREE.CylinderGeometry(0.46, 0.46, 0.72, 3, 1, false, Math.PI / 2), 0.03, 11), []);
  const gy = groundY(-1.05, 0.35);
  return (
    <group position={[-1.05, gy, 0.35]} rotation={[0, -0.9, 0]}>
      <mesh geometry={prism} rotation={[0, 0, Math.PI / 2]} position={[0, 0.23, 0]}>
        <meshStandardMaterial color="#f0c9a4" {...FLAT} />
      </mesh>
      {/* apertura scura sul lato d'ingresso (cap triangolare del prisma) */}
      <mesh position={[0.4, 0.2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <circleGeometry args={[0.24, 3, Math.PI / 2]} />
        <meshStandardMaterial color="#241a12" {...FLAT} />
      </mesh>
      {/* stuoia arrotolata sul colmo */}
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0.68, 0]}>
        <cylinderGeometry args={[0.095, 0.095, 0.46, 7]} />
        <meshStandardMaterial color="#c08a55" {...FLAT} />
      </mesh>
    </group>
  );
}

function Campfire({ reducedMotion }: { reducedMotion: boolean }) {
  const fireRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const stones = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2 + posHash(i, 0, 0, 5) * 0.5;
        return {
          pos: [Math.cos(a) * 0.34, 0.045, Math.sin(a) * 0.3] as const,
          scale: 0.75 + posHash(i, 1, 0, 5) * 0.6,
          rot: posHash(i, 2, 0, 5) * Math.PI,
        };
      }),
    []
  );

  useFrame((state) => {
    // fiamma statica con prefers-reduced-motion
    if (reducedMotion || !fireRef.current || !lightRef.current) return;
    const t = state.clock.elapsedTime;
    const f = Math.sin(t * 11) * 0.5 + Math.sin(t * 23 + 1.7) * 0.3 + Math.sin(t * 5.3 + 0.4) * 0.2;
    lightRef.current.intensity = 1.8 + f * 0.7;
    fireRef.current.scale.setScalar(1 + f * 0.06);
  });

  const gy = groundY(-0.1, 0.55);
  return (
    <group position={[-0.1, gy, 0.55]}>
      {stones.map((s, i) => (
        <mesh key={i} position={[s.pos[0], s.pos[1], s.pos[2]]} rotation={[s.rot, s.rot * 0.7, 0]} scale={s.scale * 0.085}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#a8a29a" {...FLAT} />
        </mesh>
      ))}
      {/* due tronchetti incrociati */}
      <mesh position={[0, 0.06, 0]} rotation={[0.12, 0.6, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 0.58, 6]} />
        <meshStandardMaterial color="#7a5230" {...FLAT} />
      </mesh>
      <mesh position={[0, 0.09, 0]} rotation={[-0.1, -0.7, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 0.58, 6]} />
        <meshStandardMaterial color="#6b4628" {...FLAT} />
      </mesh>
      {/* fiamma: coni impilati, emissivi */}
      <group ref={fireRef}>
        <mesh position={[0, 0.3, 0]}>
          <coneGeometry args={[0.19, 0.46, 6]} />
          <meshStandardMaterial color="#ff7a1a" emissive="#ff7a1a" emissiveIntensity={1.6} {...FLAT} />
        </mesh>
        <mesh position={[0.02, 0.44, 0.01]}>
          <coneGeometry args={[0.11, 0.36, 5]} />
          <meshStandardMaterial color="#e0341f" emissive="#e0341f" emissiveIntensity={1.4} {...FLAT} />
        </mesh>
        <mesh position={[-0.01, 0.58, 0]}>
          <coneGeometry args={[0.055, 0.18, 5]} />
          <meshStandardMaterial color="#ffc23c" emissive="#ffc23c" emissiveIntensity={2} {...FLAT} />
        </mesh>
      </group>
      <pointLight ref={lightRef} position={[0, 0.5, 0]} color="#ff9a3c" intensity={1.8} distance={2.2} decay={2} />
    </group>
  );
}

const LIGHT_COLORS = ['#ffd23c', '#ff5c8a', '#6ee7ff', '#b6ff5c'];

interface TreeProps {
  position: [number, number, number];
  rotationY?: number;
  lean?: number;
  height?: number;
  bandColor?: string;
  seed: number;
}

function WalkerTree({ position, rotationY = 0, lean = 0.3, height = 1.2, bandColor, seed }: TreeProps) {
  const lower = useMemo(() => jitter(new THREE.CylinderGeometry(0.075, 0.12, height * 0.55, 6, 2), 0.02, seed), [height, seed]);
  const upper = useMemo(
    () => jitter(new THREE.CylinderGeometry(0.04, 0.075, height * 0.5, 6, 2), 0.02, seed + 1),
    [height, seed]
  );
  // rametti a ventaglio in cima + punti-luce appesi su un arco che spiomba tra le punte
  const branches = useMemo(() => {
    const list: { rot: [number, number, number]; len: number }[] = [];
    const n = 3 + Math.floor(posHash(seed, 4, 0, 2) * 2); // 3-4 rami
    for (let i = 0; i < n; i++) {
      const spread = -0.95 + (i / (n - 1)) * 1.9;
      list.push({
        rot: [posHash(seed, i, 1, 2) * 0.8 - 0.4, 0, spread + (posHash(seed, i, 2, 2) - 0.5) * 0.3],
        len: 0.4 + posHash(seed, i, 3, 2) * 0.28,
      });
    }
    return list;
  }, [seed]);
  const lights = useMemo(() => {
    // catenaria approssimata tra le punte dei rami esterni
    const a = new THREE.Vector3(-0.42, 0.3, 0.08);
    const b = new THREE.Vector3(0.44, 0.34, -0.04);
    const mid = a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, -0.3, 0.12));
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    return curve.getPoints(6);
  }, []);

  const trunkTop = height * 0.52;
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh geometry={lower} position={[0, height * 0.275, 0]} rotation={[0, 0, -lean * 0.3]}>
        <meshStandardMaterial color="#8a6240" {...FLAT} />
      </mesh>
      <group position={[0, trunkTop, 0]} rotation={[0.1, 0, lean]}>
        <mesh geometry={upper} position={[0, height * 0.24, 0]}>
          <meshStandardMaterial color="#8a6240" {...FLAT} />
        </mesh>
        {/* occhi: due sferette scure, gli alberi del disegno hanno la faccia */}
        <mesh position={[0.034, height * 0.3, 0.06]} scale={[1, 1.5, 0.55]}>
          <sphereGeometry args={[0.024, 6, 5]} />
          <meshStandardMaterial color="#241708" {...FLAT} />
        </mesh>
        <mesh position={[-0.034, height * 0.31, 0.06]} scale={[1, 1.5, 0.55]}>
          <sphereGeometry args={[0.024, 6, 5]} />
          <meshStandardMaterial color="#241708" {...FLAT} />
        </mesh>
        <group position={[0, height * 0.46, 0]}>
          {branches.map((b, i) => (
            <group key={i} rotation={b.rot}>
              <mesh position={[0, b.len / 2, 0]}>
                <cylinderGeometry args={[0.008, 0.028, b.len, 5]} />
                <meshStandardMaterial color="#7a5539" {...FLAT} />
              </mesh>
            </group>
          ))}
          {/* filo di lucine: sferette emissive a colori alternati */}
          {lights.map((p, i) => (
            <mesh key={i} position={[p.x, p.y, p.z]}>
              <sphereGeometry args={[0.032, 6, 5]} />
              <meshStandardMaterial
                color={LIGHT_COLORS[(i + seed) % LIGHT_COLORS.length]}
                emissive={LIGHT_COLORS[(i + seed) % LIGHT_COLORS.length]}
                emissiveIntensity={2.2}
                {...FLAT}
              />
            </mesh>
          ))}
        </group>
      </group>
      {/* fascia/pantaloncini come nel disegno */}
      {bandColor && (
        <mesh position={[0, height * 0.32, 0]} rotation={[0, 0, -lean * 0.3]}>
          <cylinderGeometry args={[0.115, 0.125, 0.11, 6]} />
          <meshStandardMaterial color={bandColor} {...FLAT} />
        </mesh>
      )}
    </group>
  );
}

function PetroglyphRocks() {
  const rocks = useMemo(
    () => [
      { pos: [0.7, 0.24, -0.55] as const, scale: [0.38, 0.46, 0.26] as const, rot: 0.3 },
      { pos: [1.2, 0.2, -0.45] as const, scale: [0.32, 0.38, 0.22] as const, rot: -0.4 },
      { pos: [0.95, 0.12, -0.25] as const, scale: [0.22, 0.2, 0.18] as const, rot: 0.9 },
    ],
    []
  );
  return (
    <group>
      {rocks.map((r, i) => (
        <mesh
          key={i}
          position={[r.pos[0], groundY(r.pos[0], r.pos[2]) + r.scale[1] * 0.55, r.pos[2]]}
          rotation={[0, r.rot, 0]}
          scale={[r.scale[0], r.scale[1], r.scale[2]]}
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#c9c2b4" {...FLAT} />
        </mesh>
      ))}
    </group>
  );
}

function Mushroom({ x, z, s = 1 }: { x: number; z: number; s?: number }) {
  const gy = groundY(x, z);
  return (
    <group position={[x, gy, z]} scale={s}>
      <mesh position={[0, 0.045, 0]}>
        <cylinderGeometry args={[0.016, 0.024, 0.09, 6]} />
        <meshStandardMaterial color="#f2e6d0" {...FLAT} />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <coneGeometry args={[0.05, 0.07, 7]} />
        <meshStandardMaterial color="#d0342c" {...FLAT} />
      </mesh>
    </group>
  );
}

function Plank() {
  const gy = groundY(-0.1, 1.05);
  return (
    <mesh position={[-0.1, gy + 0.03, 1.05]} rotation={[0, 0.25, 0]}>
      <boxGeometry args={[0.42, 0.05, 0.13]} />
      <meshStandardMaterial color="#8a6240" {...FLAT} />
    </mesh>
  );
}

export function IslandScene({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <group>
      <IslandSlab />
      <SandPatch />
      <Tent />
      <Campfire reducedMotion={reducedMotion} />
      <PetroglyphRocks />
      {/* alberi-tendart intorno al bordo posteriore/sinistro, come nel disegno */}
      <WalkerTree position={[-1.6, groundY(-1.6, -0.55), -0.55]} rotationY={0.7} lean={0.35} height={1.3} bandColor="#5cc8e8" seed={2} />
      <WalkerTree position={[-0.45, groundY(-0.45, -1), -1]} rotationY={0.35} lean={-0.3} height={1.45} seed={5} />
      <WalkerTree position={[1.45, groundY(1.45, -0.7), -0.7]} rotationY={0.3} lean={0.28} height={1.15} bandColor="#e8973c" seed={9} />
      <Mushroom x={-0.55} z={0.95} />
      <Mushroom x={-0.44} z={1.03} s={0.75} />
      <Plank />
    </group>
  );
}
