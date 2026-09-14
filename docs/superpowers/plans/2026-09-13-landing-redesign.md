# Tendart Landing Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rifare la pagina `/` di tendart: hero con scritta TENDART 3D trascinabile + scroll experience punk a 4 schermate pinnate con collage foto e didascalie.

**Architecture:** Hero = canvas react-three-fiber con `Text3D` di drei dentro `PresentationControls` (drag/ruota, ritorno elastico). Scroll experience = 4 sezioni full-screen pinnate con GSAP ScrollTrigger (già in bundle), ogni sezione anima l'ingresso/uscita di 3-4 foto collage e una didascalia a scatti. Foto = placeholder SVG duotone in `public/punk/`, manifest centralizzato in `src/components/landing/photos.ts` per sostituzione futura.

**Tech Stack:** React 19, Vite 7, Tailwind 4, GSAP 3 (esistenti) + `three`, `@react-three/fiber`, `@react-three/drei` (nuove).

**Spec:** `docs/superpowers/specs/2026-09-13-landing-redesign-design.md`

## Global Constraints

- Si modifica SOLO la pagina `/` (Landing) e file nuovi sotto `src/components/landing/`; fanzine, library, routing intatti.
- Palette dark punk: fondo nero, accenti `#00f5d4` (teal), `#ff0054` (magenta), `#8cff00` (acid).
- Font utility esistenti: classi `text-bbh` e `text-sora` (definite in `src/index.css`).
- Alias import: `@` → `./src` (vite.config.ts).
- Nessun test framework nel repo: verifica = `npm run build` (tsc + vite) pulito + verifica manuale su dev server. Non aggiungere vitest.
- `prefers-reduced-motion: reduce` → niente pin/animazioni scroll, contenuto statico visibile.
- WebGL assente → fallback scritta TENDART CSS neon.
- Commit a fine task (flusso concordato con l'utente).

---

### Task 1: Dipendenze 3D + font typeface

**Files:**
- Modify: `package.json` (via npm install)
- Create: `public/fonts/helvetiker_bold.typeface.json` (copiato da three)

**Interfaces:**
- Produces: pacchetti `three`, `@react-three/fiber`, `@react-three/drei` importabili; font typeface servito a `/fonts/helvetiker_bold.typeface.json` (consumato da Task 3).

- [ ] **Step 1: Installa le dipendenze**

```bash
npm install three @react-three/fiber @react-three/drei
npm install -D @types/three
```

- [ ] **Step 2: Copia il font typeface per Text3D**

```bash
mkdir -p public/fonts
cp node_modules/three/examples/fonts/helvetiker_bold.typeface.json public/fonts/
```

- [ ] **Step 3: Verifica build pulita**

Run: `npm run build`
Expected: exit 0, nessun errore tsc.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json public/fonts/helvetiker_bold.typeface.json
git commit -m "tendart: add three/r3f/drei deps and typeface font for 3D hero"
```

---

### Task 2: Placeholder foto punk + manifest

**Files:**
- Create: `public/punk/chi-siamo-{1,2,3}.svg`, `public/punk/mostre-{1,2,3}.svg`, `public/punk/eventi-{1,2,3}.svg`, `public/punk/concerti-{1,2,3}.svg` (12 file)
- Create: `src/components/landing/photos.ts`

**Interfaces:**
- Produces: `PHOTOS: Record<SectionKey, string[]>` e `type SectionKey = 'chi-siamo' | 'mostre' | 'eventi' | 'concerti'` da `@/components/landing/photos` (consumato da Task 5).

- [ ] **Step 1: Genera i 12 placeholder SVG**

```bash
mkdir -p public/punk
for section in chi-siamo:00f5d4 mostre:ff0054 eventi:8cff00 concerti:00f5d4; do
  name="${section%%:*}"; color="${section##*:}"
  for i in 1 2 3; do
    cat > "public/punk/${name}-${i}.svg" <<EOF
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="#111"/>
  <rect x="20" y="20" width="760" height="560" fill="none" stroke="#${color}" stroke-width="8" stroke-dasharray="30 14"/>
  <circle cx="$((i * 200))" cy="300" r="120" fill="#${color}" opacity="0.5"/>
  <text x="400" y="320" font-family="monospace" font-size="48" fill="#fff" text-anchor="middle">${name} ${i}</text>
  <text x="400" y="380" font-family="monospace" font-size="24" fill="#${color}" text-anchor="middle">PLACEHOLDER</text>
</svg>
EOF
  done
done
```

Nota: la shell è fish — se il loop dà errore di sintassi, eseguirlo via `bash -c '...'`.

- [ ] **Step 2: Crea il manifest**

Create `src/components/landing/photos.ts`:

```ts
export type SectionKey = 'chi-siamo' | 'mostre' | 'eventi' | 'concerti';

// ponytail: placeholder SVG — quando arrivano le foto reali basta
// sostituire i path qui sotto (jpg/png in public/punk/).
export const PHOTOS: Record<SectionKey, string[]> = {
  'chi-siamo': ['/punk/chi-siamo-1.svg', '/punk/chi-siamo-2.svg', '/punk/chi-siamo-3.svg'],
  mostre: ['/punk/mostre-1.svg', '/punk/mostre-2.svg', '/punk/mostre-3.svg'],
  eventi: ['/punk/eventi-1.svg', '/punk/eventi-2.svg', '/punk/eventi-3.svg'],
  concerti: ['/punk/concerti-1.svg', '/punk/concerti-2.svg', '/punk/concerti-3.svg'],
};
```

- [ ] **Step 3: Verifica build**

Run: `npm run build`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add public/punk src/components/landing/photos.ts
git commit -m "tendart: add punk placeholder photos and manifest"
```

---

### Task 3: Hero3D — scritta TENDART 3D trascinabile

**Files:**
- Create: `src/components/landing/Hero3D.tsx`

**Interfaces:**
- Consumes: `/fonts/helvetiker_bold.typeface.json` (Task 1).
- Produces: `export default function Hero3D(): JSX.Element` — sezione full-screen autonoma, nessuna prop (consumato da Task 5).

- [ ] **Step 1: Crea il componente**

Create `src/components/landing/Hero3D.tsx`:

```tsx
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
  const scale = Math.min(1, viewport.width / 7);
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
          emissiveIntensity={0.35}
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
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[4, 2, 4]} color="#00f5d4" intensity={60} />
        <pointLight position={[-4, -2, 3]} color="#8cff00" intensity={40} />
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
```

- [ ] **Step 2: Smoke test visivo**

Montare temporaneamente `<Hero3D />` in cima a `src/pages/Landing.tsx` (import + prima riga del JSX), lanciare `npm run dev`, aprire il browser: scritta TENDART 3D visibile, drag con mouse la ruota e torna elastica. Poi RIMUOVERE la modifica temporanea a Landing.tsx (il montaggio definitivo è in Task 5).

- [ ] **Step 3: Verifica build**

Run: `npm run build`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/components/landing/Hero3D.tsx
git commit -m "tendart: add Hero3D draggable neon TENDART text"
```

---

### Task 4: PunkSection — schermata collage + didascalia

**Files:**
- Create: `src/components/landing/PunkSection.tsx`

**Interfaces:**
- Produces: `export default function PunkSection(props: { title: string; text: string; photos: string[]; accent: string }): JSX.Element` — sezione full-screen pinnata (consumato da Task 5).

- [ ] **Step 1: Crea il componente**

Create `src/components/landing/PunkSection.tsx`:

```tsx
import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface PunkSectionProps {
  title: string;
  text: string;
  photos: string[];
  accent: string;
}

const ROTATIONS = [-8, 6, -4, 9];
const POSITIONS = [
  'top-[6%] left-[4%] w-[48%] md:w-[32%]',
  'top-[18%] right-[5%] w-[52%] md:w-[36%]',
  'bottom-[10%] left-[16%] w-[50%] md:w-[30%]',
  'bottom-[16%] right-[18%] w-[42%] md:w-[26%] hidden md:block',
];

export default function PunkSection({ title, text, photos, accent }: PunkSectionProps) {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: '+=120%',
          pin: true,
          scrub: 0.5,
        },
      });
      // Movimenti secchi (steps) — niente easing morbidi, stile punk
      tl.from('.punk-photo', { yPercent: 140, rotation: 25, stagger: 0.12, ease: 'steps(6)' })
        .from('.punk-caption', { opacity: 0, scale: 2.6, rotation: -6, ease: 'steps(4)' }, '<0.3')
        .to('.punk-photo', { yPercent: -150, rotation: -20, stagger: 0.1, ease: 'steps(6)' }, '+=0.4');
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="relative h-screen w-full overflow-hidden bg-black">
      {photos.map((src, i) => (
        <div
          key={src}
          className={`punk-photo absolute ${POSITIONS[i % POSITIONS.length]}`}
          style={{ rotate: `${ROTATIONS[i % ROTATIONS.length]}deg` }}
        >
          <img
            src={src}
            alt=""
            className="w-full border-4 border-white/90"
            style={{ filter: 'grayscale(1) contrast(1.6)' }}
          />
          {/* duotone: tinta neon sopra la foto in bianco/nero */}
          <div
            className="pointer-events-none absolute inset-0 mix-blend-color"
            style={{ background: accent, opacity: 0.65 }}
          />
        </div>
      ))}
      <div className="punk-caption absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center">
        <h2
          className="text-bbh text-6xl font-extrabold uppercase md:text-8xl"
          style={{ color: accent, textShadow: '4px 4px 0 #000' }}
        >
          {title}
        </h2>
        <p className="text-sora mt-4 max-w-xl bg-black/70 p-3 text-lg text-white md:text-2xl">
          {text}
        </p>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verifica build**

Run: `npm run build`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/landing/PunkSection.tsx
git commit -m "tendart: add PunkSection pinned collage with stamp captions"
```

---

### Task 5: Landing riscritta — composizione completa

**Files:**
- Modify: `src/pages/Landing.tsx` (riscrittura completa)

**Interfaces:**
- Consumes: `Hero3D` (Task 3), `PunkSection` (Task 4), `PHOTOS`/`SectionKey` (Task 2), `ElectricButton` esistente (`props: { buttonText: string }`, linka già a `/library`).

- [ ] **Step 1: Riscrivi Landing.tsx**

Sostituire l'intero contenuto di `src/pages/Landing.tsx` con:

```tsx
import Hero3D from '@/components/landing/Hero3D';
import PunkSection from '@/components/landing/PunkSection';
import { PHOTOS, type SectionKey } from '@/components/landing/photos';
import ElectricButton from '@/components/ElectricButton';

const SECTIONS: { key: SectionKey; title: string; text: string; accent: string }[] = [
  {
    key: 'chi-siamo',
    title: 'Chi siamo',
    text: 'Tendart è un collettivo di promozione artistica. Mostre, eventi, concerti: facciamo spazio a chi ha qualcosa da dire.',
    accent: '#00f5d4',
  },
  {
    key: 'mostre',
    title: 'Mostre',
    text: 'Esposizioni indipendenti, spazi non convenzionali, artisti emergenti.',
    accent: '#ff0054',
  },
  {
    key: 'eventi',
    title: 'Eventi',
    text: 'Serate, performance, incontri. Dove succede qualcosa, ci siamo.',
    accent: '#8cff00',
  },
  {
    key: 'concerti',
    title: 'Concerti',
    text: 'Live, rumore, palchi veri. La musica come la vogliamo noi.',
    accent: '#00f5d4',
  },
];

export default function Landing() {
  return (
    <div className="w-full bg-black text-white">
      <Hero3D />

      {SECTIONS.map((s) => (
        <PunkSection key={s.key} title={s.title} text={s.text} photos={PHOTOS[s.key]} accent={s.accent} />
      ))}

      {/* CTA Fanzine */}
      <section className="flex h-screen w-full flex-col items-center justify-center gap-8 bg-black px-6">
        <h2
          className="text-bbh text-center text-5xl font-extrabold uppercase md:text-7xl"
          style={{ color: '#ff0054', textShadow: '4px 4px 0 #000' }}
        >
          Le nostre fanzine
        </h2>
        <div className="text-sora">
          <ElectricButton buttonText="Vai alle Fanzine!" />
        </div>
      </section>

      <footer className="text-sora m-4 border-4 border-white bg-black">
        <div className="mx-auto w-full max-w-screen-xl p-4 md:flex md:items-center md:justify-between">
          <span className="text-sm text-gray-400 sm:text-center">© 2025 Tendart</span>
          <ul className="mt-3 flex flex-wrap items-center text-sm font-medium text-gray-400 sm:mt-0">
            <li>
              <a href="https://instagram.com/_tendart_/?hl=it" className="me-4 hover:underline md:me-6">Insta!</a>
            </li>
            <li>
              <a href="https://www.youtube.com/@TendArtLab" className="me-4 hover:underline md:me-6">YouTube</a>
            </li>
            <li>
              <a href="https://soundcloud.com/tendart" className="me-4 hover:underline md:me-6">SoundCloud</a>
            </li>
            <li>
              <a href="mailto:tendart01@gmail.com" className="hover:underline">Contattaci</a>
            </li>
          </ul>
        </div>
        <div className="p-4 text-left">
          <span className="text-xs text-gray-500">
            Sito realizzato con ⚡ da{' '}
            <a className="hover:underline" href="https://www.linkedin.com/in/gabriele-genovesi-developer/">
              GabriGeno
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
```

- [ ] **Step 2: Verifica build + lint**

Run: `npm run build && npm run lint`
Expected: build exit 0; lint senza errori nuovi su file toccati (warning pre-esistenti altrove tollerati).

- [ ] **Step 3: Commit**

```bash
git add src/pages/Landing.tsx
git commit -m "tendart: rewrite landing with 3D hero and punk scroll experience"
```

---

### Task 6: Verifica finale desktop + mobile + reduced-motion

**Files:**
- Nessun file nuovo previsto; eventuali fix minori sui componenti dei task 3-5.

**Interfaces:**
- Consumes: pagina completa (Task 5).

- [ ] **Step 1: Dev server e verifica desktop**

Run: `npm run dev`
Verificare nel browser (viewport desktop):
1. Hero: TENDART 3D visibile, drag ruota e torna in posa.
2. Scroll: 4 sezioni si pinnano, foto entrano/escono a scatti, didascalie appaiono.
3. CTA fanzine porta a `/library`; link footer corretti.
4. Console browser senza errori.

- [ ] **Step 2: Verifica mobile emulato**

DevTools → viewport ~390px: scritta 3D scalata e visibile, drag touch funziona, collage max 3 foto (la 4ª è `hidden md:block`), niente overflow orizzontale.

- [ ] **Step 3: Verifica reduced-motion**

DevTools → Rendering → emulate `prefers-reduced-motion: reduce`: pagina scorre senza pin, foto e didascalie statiche e visibili.

- [ ] **Step 4: Verifica route esistenti intatte**

Aprire `/library` e una fanzine: rendering invariato.

- [ ] **Step 5: Build finale**

Run: `npm run build`
Expected: exit 0.

- [ ] **Step 6: Commit di eventuali fix**

```bash
git add -A src/components/landing src/pages/Landing.tsx
git commit -m "tendart: polish landing scroll experience (mobile/reduced-motion fixes)"
```

(Se non ci sono fix, saltare il commit.)
