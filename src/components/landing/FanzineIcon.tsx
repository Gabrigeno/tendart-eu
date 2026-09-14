import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Center } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';

/**
 * Icona 3D low-poly "pila di fanzine" — accento cliccabile nel finale, stesso
 * linguaggio visivo dell'isola (IslandScene.tsx): flat-shading, proporzioni
 * cartoon, palette neon del sito. Da feedback (task 18) è rimasto l'UNICO
 * elemento della CTA fanzine insieme al link testuale HTML in SplitScroll —
 * niente più bottone/heading bordati.
 *
 * Bob + rotazione idle via useFrame, gated su reducedMotion come il Float
 * dell'isola in SplitScroll. Lo scale-in/out in sync con la timeline del
 * finale è gestito DA FUORI (SplitScroll anima lo scale del group wrapper),
 * qui dentro il component gestisce il proprio idle loop, l'hover e il
 * "flourish" — uno spin+pop vistoso al click, prima della navigazione.
 * `onReady` espone la funzione di trigger a SplitScroll (via callback-ref,
 * stesso pattern di onGroup/onFanzineGroup) così anche il link HTML
 * "Guarda le nostre fanzine →" può far partire lo stesso flourish sull'icona.
 *
 * FIX (task 18, review): le copertine sono impilate "alla rinfusa" con
 * posizioni sfalsate rispetto all'origine locale del group (vedi COVERS).
 * Ruotare/scalare quel group direttamente pivotava attorno all'origine
 * ARBITRARIA (0,0,0), non attorno al centro VISIVO della pila — con la
 * scala idle/hover (1 -> 1.08) la deriva era impercettibile, ma col pop del
 * flourish (fino a 1.55x) la pila "scappava" visibilmente lontano dal testo
 * CTA accanto. Fix: le mesh vivono dentro un <Center> di drei (stesso
 * componente già usato in Hero3D per il logo SVG) che le ricentra sul proprio
 * pivot — rotazione e scala (idle, hover, flourish) si applicano ORA al
 * gruppo esposto da <Center> (`visual`), non più al group esterno `group`
 * (che resta solo l'ancora per eventi puntatore + il bob idle in Y,
 * traslazione pura → nessuna deriva possibile).
 */
const FLAT = { flatShading: true } as const;

// 3 copertine impilate "alla rinfusa" come una pila di albi spillati: non un
// parallelepipedo perfetto, ogni albo leggermente sfalsato e ruotato. Le y
// sono calcolate per appoggiarsi l'una sull'altra senza compenetrare.
// Colori più VIVIDI del giro precedente (task 18, feedback utente): oltre al
// color diffuse ogni copertina neon ha ora un emissive proprio (stessa tinta,
// intensità moderata) — legge come "acceso"/punchy anche sotto il rig luci
// piuttosto neutro della Canvas, non solo più saturo sulla carta.
const COVERS = [
  {
    size: [0.46, 0.055, 0.34] as const,
    pos: [0, 0, 0] as const,
    rotY: 0,
    rotZ: -0.05,
    color: '#ff1670',
    emissive: '#ff0054',
    emissiveIntensity: 0.55,
  },
  {
    size: [0.42, 0.05, 0.31] as const,
    pos: [0.035, 0.052, -0.018] as const,
    rotY: 0.12,
    rotZ: 0.09,
    color: '#1bffe0',
    emissive: '#00f5d4',
    emissiveIntensity: 0.6,
  },
  {
    size: [0.44, 0.045, 0.32] as const,
    pos: [-0.025, 0.1, 0.012] as const,
    rotY: -0.18,
    rotZ: -0.13,
    color: '#0a0a0a',
    emissive: '#000000',
    emissiveIntensity: 0,
  },
];

// Durata del flourish ostentato al click: spin grosso (2 giri pieni) + pop di
// scala, poi la navigazione. 0.5s sta nel range richiesto (0.4-0.6s) ed è
// abbastanza breve da non sembrare un ritardo, ma leggibile come "gesto".
const FLOURISH_DURATION = 0.5;

export function FanzineIcon({
  reducedMotion,
  onReady,
}: {
  reducedMotion: boolean;
  onReady?: (trigger: (() => void) | null) => void;
}) {
  const navigate = useNavigate();
  const group = useRef<THREE.Group>(null);
  // pivot ricentrato (outer group esposto da <Center>): TUTTA la rotazione e
  // la scala (idle, hover, flourish) vive qui, mai su `group` — vedi nota
  // "FIX" in cima al file.
  const visual = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const hoverScale = useRef(1);
  // guard contro doppio-click/doppia-navigazione: mentre true il flourish è
  // in corso, altri trigger vengono ignorati finché non completa.
  const flourishing = useRef(false);
  const flourishStart = useRef<number | null>(null);
  const flourishBaseRotation = useRef(0);

  // memo puro (nessuna geometria custom da ricreare): evita di ricalcolare
  // l'array a ogni render, coerente con lo stile di IslandScene.
  const covers = useMemo(() => COVERS, []);

  // rete di sicurezza: se il componente sparisce (smonta) mentre il cursore
  // è ancora "pointer" (es. click che naviga via, o scale-out del finale
  // che porta l'oggetto fuori dal raycast prima di un pointerOut) resetta lo
  // stile globale — altrimenti resta 'pointer' ovunque sulla pagina dopo.
  useEffect(() => {
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, []);

  // trigger unico condiviso da mesh-click e dal link HTML esterno: con
  // reducedMotion naviga subito (niente flourish forzato su chi l'ha
  // disattivato); altrimenti arma il flourish, letto/animato in useFrame, che
  // naviga da solo al completamento.
  const triggerFlourish = useCallback(() => {
    if (flourishing.current) return; // già in corso: ignora
    document.body.style.cursor = 'auto';
    if (reducedMotion) {
      navigate('/library');
      return;
    }
    flourishing.current = true;
    flourishStart.current = null; // impostato al prossimo frame utile
  }, [navigate, reducedMotion]);

  // espone il trigger a SplitScroll (callback-ref pattern, come onGroup):
  // il link HTML "Guarda le nostre fanzine →" lo richiama per far partire lo
  // stesso flourish sull'icona invece di navigare per conto proprio.
  useEffect(() => {
    onReady?.(triggerFlourish);
    return () => onReady?.(null);
  }, [onReady, triggerFlourish]);

  useFrame((state) => {
    if (!group.current || !visual.current) return;
    const t = state.clock.elapsedTime;

    if (flourishing.current) {
      if (flourishStart.current === null) {
        flourishStart.current = t;
        flourishBaseRotation.current = visual.current.rotation.y;
      }
      const elapsed = t - flourishStart.current;
      const progress = Math.min(elapsed / FLOURISH_DURATION, 1);
      // ease-out cubic: spin veloce che rallenta in chiusura, ~2 giri pieni.
      const eased = 1 - Math.pow(1 - progress, 3);
      // rotazione e scala sul pivot RICENTRATO (`visual`, esposto da
      // <Center>): la pila ruota/pompa sul proprio centro visivo, non
      // sull'origine arbitraria del group esterno — niente più deriva verso
      // un bordo dello schermo mentre il testo CTA resta fermo accanto.
      visual.current.rotation.y = flourishBaseRotation.current + eased * Math.PI * 4;
      // pop/bounce: cresce fino a ~1.55x a metà corsa poi torna a 1 — un
      // "botto" visibile, non l'idle bob sottile.
      visual.current.scale.setScalar(1 + Math.sin(progress * Math.PI) * 0.55);
      if (progress >= 1) {
        flourishing.current = false;
        flourishStart.current = null;
        navigate('/library');
      }
      return; // durante il flourish l'idle bob/hover non deve interferire
    }

    if (!reducedMotion) {
      // il bob resta sul group ESTERNO: è una traslazione pura, nessun
      // pivot coinvolto, non c'entra col fix del centro visivo.
      group.current.position.y = Math.sin(t * 1.4) * 0.055;
      visual.current.rotation.y += 0.004;
    }
    // hover feedback: lerp verso 1.08 — risposta a input, non idle loop,
    // resta attiva anche con reducedMotion.
    const target = hovered ? 1.08 : 1;
    hoverScale.current += (target - hoverScale.current) * 0.15;
    visual.current.scale.setScalar(hoverScale.current);
  });

  return (
    <group
      ref={group}
      onClick={(e) => {
        e.stopPropagation();
        triggerFlourish();
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
      {/* <Center>: ricentra i figli sul proprio pivot (bbox center a runtime,
          calcolato una volta al mount) — vedi nota "FIX" in cima al file.
          `ref={visual}` è il group ESTERNO di Center: ruotarlo/scalarlo
          pivota correttamente sul centro visivo della pila, non sull'origine
          arbitraria in cui sono state autorate le mesh sfalsate. */}
      <Center ref={visual}>
        {covers.map((c, i) => (
          <mesh key={i} position={c.pos} rotation={[0, c.rotY, c.rotZ]}>
            <boxGeometry args={c.size} />
            <meshStandardMaterial
              color={c.color}
              emissive={c.emissive}
              emissiveIntensity={c.emissiveIntensity}
              {...FLAT}
            />
          </mesh>
        ))}
        {/* bollino acido in cima, come un timbro appiccicato di sbieco — più
            acceso: emissive stessa tinta per un verde acido che "spara" */}
        <mesh position={[0.11, 0.1285, 0.075]} rotation={[0, -0.18, 0.5]}>
          <boxGeometry args={[0.1, 0.012, 0.1]} />
          <meshStandardMaterial color="#9bff1a" emissive="#8cff00" emissiveIntensity={0.7} {...FLAT} />
        </mesh>
      </Center>
    </group>
  );
}
