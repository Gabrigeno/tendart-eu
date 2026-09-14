import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';

/**
 * Icona 3D low-poly "pila di fanzine" — accento cliccabile nel finale, stesso
 * linguaggio visivo dell'isola (IslandScene.tsx): flat-shading, proporzioni
 * cartoon, palette neon del sito. Non sostituisce il bottone HTML della CTA
 * (resta il link accessibile primario) — è un richiamo 3D complementare che
 * funziona anche come scorciatoia cliccabile verso /library.
 *
 * Bob + rotazione idle via useFrame, gated su reducedMotion come il Float
 * dell'isola in SplitScroll. Lo scale-in/out in sync con la timeline del
 * finale è gestito DA FUORI (SplitScroll anima lo scale del group wrapper),
 * qui dentro il component gestisce solo il proprio idle loop e l'hover.
 */
const FLAT = { flatShading: true } as const;

// 3 copertine impilate "alla rinfusa" come una pila di albi spillati: non un
// parallelepipedo perfetto, ogni albo leggermente sfalsato e ruotato. Le y
// sono calcolate per appoggiarsi l'una sull'altra senza compenetrare.
const COVERS = [
  { size: [0.46, 0.055, 0.34] as const, pos: [0, 0, 0] as const, rotY: 0, rotZ: -0.05, color: '#ff0054' },
  { size: [0.42, 0.05, 0.31] as const, pos: [0.035, 0.052, -0.018] as const, rotY: 0.12, rotZ: 0.09, color: '#00f5d4' },
  { size: [0.44, 0.045, 0.32] as const, pos: [-0.025, 0.1, 0.012] as const, rotY: -0.18, rotZ: -0.13, color: '#0a0a0a' },
];

export function FanzineIcon({ reducedMotion }: { reducedMotion: boolean }) {
  const navigate = useNavigate();
  const group = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const hoverScale = useRef(1);

  // memo puro (nessuna geometria custom da ricreare): evita di ricalcolare
  // l'array a ogni render, coerente con lo stile di IslandScene.
  const covers = useMemo(() => COVERS, []);

  useFrame((state) => {
    if (!group.current) return;
    if (!reducedMotion) {
      const t = state.clock.elapsedTime;
      group.current.position.y = Math.sin(t * 1.4) * 0.055;
      group.current.rotation.y += 0.004;
    }
    // hover feedback: lerp verso 1.08 — risposta a input, non idle loop,
    // resta attiva anche con reducedMotion.
    const target = hovered ? 1.08 : 1;
    hoverScale.current += (target - hoverScale.current) * 0.15;
    group.current.scale.setScalar(hoverScale.current);
  });

  return (
    <group
      ref={group}
      onClick={(e) => {
        e.stopPropagation();
        navigate('/library');
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      {covers.map((c, i) => (
        <mesh key={i} position={c.pos} rotation={[0, c.rotY, c.rotZ]}>
          <boxGeometry args={c.size} />
          <meshStandardMaterial color={c.color} {...FLAT} />
        </mesh>
      ))}
      {/* bollino acido in cima, come un timbro appiccicato di sbieco */}
      <mesh position={[0.11, 0.1285, 0.075]} rotation={[0, -0.18, 0.5]}>
        <boxGeometry args={[0.1, 0.012, 0.1]} />
        <meshStandardMaterial color="#8cff00" {...FLAT} />
      </mesh>
    </group>
  );
}
