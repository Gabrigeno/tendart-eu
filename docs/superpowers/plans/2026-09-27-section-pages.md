# Pagine di sezione sull'isola — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 4 pagine di sezione (`/chi-siamo`, `/mostre`, `/eventi`, `/concerti`) ambientate sull'isola low-poly della landing: la camera vola sul "posto" della sezione, riquadro di testo stile menu PS2, foto in cornici sfaccettate, navigazione fra sezioni senza ricaricare.

**Architecture:** Una layout route di react-router (senza path) monta uno stage 3D fisso (`NightSky` + canvas r3f con `IslandScene`) e il contenuto scorrevole; le 4 route figlie non hanno element: la layout legge la sezione attiva dal pathname. Il cambio sezione cambia solo i dati passati al rig della camera (tween GSAP) e al riquadro, quindi il canvas resta montato. Tutti i contenuti stanno in `src/data/sections.ts`.

**Tech Stack:** React 19, react-router-dom 7 (data router già in `src/App.tsx`), @react-three/fiber 9, @react-three/drei 10, three 0.186, GSAP 3, Tailwind 4, TypeScript. Nessuna dipendenza nuova.

**Spec:** `docs/superpowers/specs/2026-09-27-section-pages-design.md`

## Global Constraints

- Nessuna dipendenza npm nuova; non toccare `package.json` / `package-lock.json`.
- Commit solo dei file del task (`git commit -- <file…>`), messaggio `tendart: …`, identità già configurata nel repo (`141853891+Gabrigeno@users.noreply.github.com`): verificare con `git config user.email` prima del primo commit. Nessun footer Co-Authored-By / Generated.
- Si parte da working tree pulito (solo questo piano non tracciato): verificare con `git status --short` prima del Task 1.
- Niente `backdrop-filter`/blur sopra il canvas (causava scatti su mobile).
- Canvas: `dpr={[1, 1.5]}`.
- `prefers-reduced-motion`: niente volo camera, segnalino fermo, testo subito visibile, niente parallasse.
- Il CSS globale in `src/index.css` impone stili unlayered su `button` (padding, bg, border, font-size) e `h1` (font-size 3.2em): sui button e h1 nuovi usare utility con `!` (es. `!p-0 !bg-transparent !border-0`, `!text-3xl`).
- Colori sezione (esistenti in Landing): chi-siamo `#00f5d4`, mostre `#ff0054`, eventi `#8cff00`, concerti `#00f5d4`.
- Nessun test runner nel repo: la verifica è `npx tsc -b`, `npm run build` e gli script Playwright del task, salvati nella scratchpad (`$SCRATCH` = `/private/tmp/claude-501/-Users-gabrielegenovesi-gabri-tendart/16dde2d2-29b4-42db-937c-8a62173f4572/scratchpad`, dove `playwright` è installato con `npm i --no-save playwright`; se manca: `cd $SCRATCH && npm i --silent --no-save playwright`). Browser: `executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'`. Dev server per le prove: `npx vite --port 5181 --strictPort` (lanciato in background dalla root del repo, fermato a fine prova con `pkill -f "vite --port 5181"`).
- Gli screenshot Playwright headless non catturano in modo affidabile le View Transition: non usarli per giudicarle (non riguardano questo piano, solo da sapere).

## Review Focus

- URL diretto (ricarica su `/eventi`): la pagina deve aprirsi già sulla sezione giusta, con volo dall'inquadratura larga — pinned in Task 2 (check `direct-load`) e Task 3 (camera finale).
- Cambio sezione rapido/ripetuto (frecce premute più volte durante il volo): la camera deve fermarsi sull'ultima sezione scelta, senza tween sovrapposti — pinned in Task 3 (check `rapid-switch`).
- Frecce ai bordi: su Chi siamo la freccia "precedente" è disattivata, su Concerti la "successiva"; i tasti ← → non fanno nulla oltre i bordi — pinned in Task 2 (check `edges`).
- Resize desktop ↔ mobile con la pagina aperta: l'inquadratura passa a quella del nuovo breakpoint — pinned in Task 3 (check `resize`).
- Tasti ← → mentre il focus è in un campo di input: non esistono input nella pagina, quindi nessun test; il listener ignora comunque eventi con modificatori (Task 2).

---

## File Structure

- Create `src/data/sections.ts` — dati delle 4 sezioni (testi, colori, foto, posto, segnalino, inquadrature camera). Unica sorgente.
- Create `src/pages/SectionLayout.tsx` — layout route: stage fisso + contenuto scorrevole (riquadro, foto, footer), navigazione, tastiera.
- Create `src/components/sections/SectionStage.tsx` — canvas r3f: isola di notte, rig camera con volo e parallasse, segnalino.
- Create `src/components/sections/SectionPanel.tsx` — riquadro stile menu PS2 (etichetta, titolo, testo con reveal, frecce).
- Create `src/components/sections/SectionPhotos.tsx` — griglia foto in cornici sfaccettate.
- Modify `src/App.tsx` — layout route + figlie generate da `sections`.
- Modify `src/pages/Landing.tsx` — usa `sections` invece dell'array locale `SECTIONS`.
- Modify `src/components/landing/SplitScroll.tsx` — blocchi del finale: `<a href="#">` → `<Link to={s.href}>`.
- Modify `src/components/landing/Hero3D.tsx` — esporta `webglAvailable` (riuso per il fallback).

---

### Task 1: Dati delle sezioni + landing collegata

**Files:**
- Create: `src/data/sections.ts`
- Modify: `src/pages/Landing.tsx:1-30` (array `SECTIONS`)

**Interfaces:**
- Produces:
  ```ts
  export type CameraView = { position: [number, number, number]; target: [number, number, number] };
  export type Section = {
    key: 'chi-siamo' | 'mostre' | 'eventi' | 'concerti';
    href: string;            // '/chi-siamo' …
    title: string;           // 'Chi siamo' …
    text: string;            // testo breve (didascalie landing)
    accent: string;          // colore sezione
    place: string;           // 'La tenda' …
    body: string[];          // paragrafi della spiegazione
    photos: string[];        // URL immagini (import Vite)
    marker: [number, number, number]; // posizione segnalino, spazio isola
    camera: { desktop: CameraView; mobile: CameraView };
  };
  export const sections: Section[];
  export const WIDE_VIEW: CameraView; // inquadratura larga di partenza
  ```

- [ ] **Step 1: Creare `src/data/sections.ts`**

```ts
// Sezioni del collettivo: testi della landing + pagine di sezione sull'isola.
// Ogni sezione è un "posto" dell'isola (IslandScene): la pagina ci vola sopra con la camera.
// Coordinate in spazio isola (IslandScene senza trasformazioni). Le inquadrature si tarano
// a vista: cambiarle qui, zero codice.
export type CameraView = { position: [number, number, number]; target: [number, number, number] };

export type Section = {
  key: 'chi-siamo' | 'mostre' | 'eventi' | 'concerti';
  href: string;
  title: string;
  text: string;
  accent: string;
  place: string;
  body: string[];
  photos: string[];
  marker: [number, number, number];
  camera: { desktop: CameraView; mobile: CameraView };
};

// Foto provvisorie: le 12 di "Foto landing 1", 3 per sezione in ordine di nome file.
const photoModules = import.meta.glob('../assets/Foto landing 1/*.{jpg,jpeg,JPG,JPEG,png,webp}', {
  eager: true,
  import: 'default',
});
const PHOTOS = Object.keys(photoModules)
  .sort()
  .map((k) => photoModules[k] as string);
const photosFor = (i: number) => PHOTOS.slice(i * 3, i * 3 + 3);

const LOREM = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse.',
];

// inquadratura larga da cui parte il volo all'arrivo sulla pagina
export const WIDE_VIEW: CameraView = { position: [0, 3.4, 6.2], target: [0, 0.2, 0] };

export const sections: Section[] = [
  {
    key: 'chi-siamo',
    href: '/chi-siamo',
    title: 'Chi siamo',
    text: 'Tendart è un collettivo di promozione artistica. Mostre, eventi, concerti: facciamo spazio a chi ha qualcosa da dire.',
    accent: '#00f5d4',
    place: 'La tenda',
    body: LOREM,
    photos: photosFor(0),
    marker: [-1.05, 1.05, 0.35],
    camera: {
      desktop: { position: [0.6, 1.3, 2.6], target: [-0.35, 0.45, 0.35] },
      mobile: { position: [-0.55, 0.6, 1.9], target: [-1.05, 0.45, 0.35] },
    },
  },
  {
    key: 'mostre',
    href: '/mostre',
    title: 'Mostre',
    text: 'Esposizioni indipendenti, spazi non convenzionali, artisti emergenti.',
    accent: '#ff0054',
    place: 'Le rocce',
    body: LOREM,
    photos: photosFor(1),
    marker: [0.95, 0.95, -0.42],
    camera: {
      desktop: { position: [2.3, 1.2, 1.6], target: [1.55, 0.35, -0.42] },
      mobile: { position: [1.25, 0.5, 0.75], target: [0.95, 0.35, -0.42] },
    },
  },
  {
    key: 'eventi',
    href: '/eventi',
    title: 'Eventi',
    text: 'Serate, performance, incontri. Dove succede qualcosa, ci siamo.',
    accent: '#8cff00',
    place: 'Gli alberi',
    body: LOREM,
    photos: photosFor(2),
    marker: [-0.45, 1.95, -1.0],
    camera: {
      desktop: { position: [0.9, 1.6, 1.4], target: [0.2, 1.0, -1.0] },
      mobile: { position: [-0.2, 0.8, 0.35], target: [-0.45, 1.05, -1.0] },
    },
  },
  {
    key: 'concerti',
    href: '/concerti',
    title: 'Concerti',
    text: 'Live, rumore, palchi veri. La musica come la vogliamo noi.',
    accent: '#00f5d4',
    place: 'Il falò',
    body: LOREM,
    photos: photosFor(3),
    marker: [-0.1, 1.05, 0.55],
    camera: {
      desktop: { position: [1.2, 1.1, 2.3], target: [0.5, 0.4, 0.55] },
      mobile: { position: [0.25, 0.5, 1.55], target: [-0.1, 0.4, 0.55] },
    },
  },
];
```

- [ ] **Step 2: Landing usa i dati condivisi**

In `src/pages/Landing.tsx` eliminare l'intero `const SECTIONS: … = [ … ];` (righe 5-30 circa) e aggiungere l'import; sostituire l'uso:

```tsx
import { sections } from '@/data/sections';
// …
      <SplitScroll sections={sections} />
```

(`SplitSection` in SplitScroll richiede `key/title/text/accent`: `Section` è un superset, compatibile.)

- [ ] **Step 3: Verificare**

Run: `npx tsc -b && npm run build 2>&1 | grep -E "error|✓ built"`
Expected: nessun errore, `✓ built`.

Poi screenshot di controllo del finale della landing (deve essere identico a prima: stessi 4 titoli/testi). Script `$SCRATCH/t1.mjs`:

```js
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:5181/'); await p.waitForTimeout(2000);
const start = await p.evaluate(() => document.querySelector('.split-caption').closest('section').getBoundingClientRect().top + scrollY);
await p.evaluate(y => scrollTo(0, y), start + 4.8 * 900); await p.waitForTimeout(1500);
const titles = await p.locator('.split-finale h3').allTextContents();
console.log(titles);
if (titles.length !== 4 || !titles[0].includes('Chi siamo')) throw new Error('finale sections wrong');
await b.close();
```

Run (dev server attivo): `cd $SCRATCH && node t1.mjs`
Expected: stampa i 4 titoli (con la freccia `→`), nessun errore.

- [ ] **Step 4: Commit**

```bash
git commit -m "tendart: shared sections data (landing texts + island places)" -- src/data/sections.ts src/pages/Landing.tsx
```

---

### Task 2: Layout route, riquadro PS2, foto, navigazione (senza 3D)

**Files:**
- Create: `src/pages/SectionLayout.tsx`
- Create: `src/components/sections/SectionPanel.tsx`
- Create: `src/components/sections/SectionPhotos.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/landing/SplitScroll.tsx` (FinaleBlocks, `<a href="#">` → `<Link>`)

**Interfaces:**
- Consumes: `sections`, `Section` da Task 1; `NightSky` (`src/components/landing/NightSky.tsx`, props `{ dusk?: number; night?: number }`); `ArrowButton` (`src/components/ArrowButton.tsx`, props `{ dir: 'prev'|'next'; label: string; accent: string; disabled: boolean; onClick: () => void }`); `Footer` (`src/components/Footer.tsx`, default export).
- Produces: `SectionLayout` (default export, nessuna prop). Nel layout, uno slot per lo stage: `<div data-stage className="fixed inset-0 -z-10">` dove Task 3 monterà `<SectionStage section={…} />`. `SectionPanel` props `{ section: Section; index: number; total: number; prev?: Section; next?: Section; onGo: (s: Section) => void }`. `SectionPhotos` props `{ section: Section }`.

- [ ] **Step 1: Script di verifica (fallisce finché le pagine non esistono)**

`$SCRATCH/t2.mjs`:

```js
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
const h1 = () => p.locator('h1').first().textContent();
// direct-load
await p.goto('http://localhost:5181/eventi'); await p.waitForTimeout(1200);
if ((await h1()) !== 'Eventi') throw new Error('direct-load: ' + await h1());
// arrows + url
await p.getByLabel('Sezione successiva').click(); await p.waitForTimeout(600);
if (!p.url().endsWith('/concerti') || (await h1()) !== 'Concerti') throw new Error('next arrow');
// edges
if (!(await p.getByLabel('Sezione successiva').isDisabled())) throw new Error('edges: next not disabled on last');
await p.keyboard.press('ArrowRight'); await p.waitForTimeout(400);
if (!p.url().endsWith('/concerti')) throw new Error('edges: key went past last');
await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(600);
if (!p.url().endsWith('/eventi')) throw new Error('keyboard left');
await p.goto('http://localhost:5181/chi-siamo'); await p.waitForTimeout(800);
if (!(await p.getByLabel('Sezione precedente').isDisabled())) throw new Error('edges: prev not disabled on first');
// photos + footer
const photos = await p.locator('[data-section-photo]').count();
if (photos !== 3) throw new Error('photos: ' + photos);
if ((await p.locator('footer:has-text("Tendart")').count()) !== 1) throw new Error('footer');
// finale link from landing
await p.goto('http://localhost:5181/'); await p.waitForTimeout(2000);
const start = await p.evaluate(() => document.querySelector('.split-caption').closest('section').getBoundingClientRect().top + scrollY);
await p.evaluate(y => scrollTo(0, y), start + 4.8 * 900); await p.waitForTimeout(1500);
await p.locator('.split-finale a[aria-label="Mostre"]').click(); await p.waitForTimeout(800);
if (!p.url().endsWith('/mostre')) throw new Error('finale link: ' + p.url());
console.log('OK', errs);
if (errs.length) throw new Error('page errors');
await b.close();
```

Run: `cd $SCRATCH && node t2.mjs`
Expected: FAIL (`direct-load: …` — la route non esiste).

- [ ] **Step 2: `src/components/sections/SectionPanel.tsx`**

```tsx
import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import ArrowButton from '@/components/ArrowButton';
import type { Section } from '@/data/sections';

// Riquadro stile menu PS2: pannello blu notte quasi opaco (niente blur sopra il canvas),
// doppio filo nel colore della sezione, angoli tagliati a smusso.
const CHAMFER = 'polygon(14px 0, calc(100% - 14px) 0, 100% 14px, 100% calc(100% - 14px), calc(100% - 14px) 100%, 14px 100%, 0 calc(100% - 14px), 0 14px)';

export default function SectionPanel({
  section, index, total, prev, next, onGo,
}: { section: Section; index: number; total: number; prev?: Section; next?: Section; onGo: (s: Section) => void }) {
  const body = useRef<HTMLDivElement>(null);

  // testo a righe sfalsate all'arrivo su un posto (rimontato a ogni sezione via key)
  useLayoutEffect(() => {
    if (!body.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.from('[data-reveal]', { autoAlpha: 0, y: 8, duration: 0.35, stagger: 0.07, ease: 'power2.out', delay: 0.5 });
    }, body);
    return () => ctx.revert();
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    // filo esterno = sfondo accento dietro al pannello interno, entrambi smussati
    <div className="p-[2px]" style={{ background: section.accent, clipPath: CHAMFER }}>
      <div ref={body} className="relative bg-[#070b22]/95 p-6 md:p-8" style={{ clipPath: CHAMFER }}>
        {/* filo interno sottile */}
        <div className="pointer-events-none absolute inset-[6px] border" style={{ borderColor: `${section.accent}55`, clipPath: CHAMFER }} />
        <p data-reveal className="text-sora text-[11px] uppercase tracking-[0.3em]" style={{ color: section.accent }}>
          ◆ {pad(index + 1)} / {pad(total)} · {section.place}
        </p>
        <h1
          data-reveal
          className="text-bbh mt-3 !text-4xl uppercase !leading-none md:!text-6xl"
          style={{ color: section.accent, textShadow: `0 0 18px ${section.accent}88, 3px 3px 0 #000` }}
        >
          {section.title}
        </h1>
        <div className="text-sora mt-5 space-y-3 text-sm leading-relaxed text-white/85 md:text-base">
          {section.body.map((para, i) => (
            <p key={i} data-reveal>{para}</p>
          ))}
        </div>
        <div data-reveal className="mt-6 flex items-center justify-between text-sora text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <ArrowButton dir="prev" label="Sezione precedente" accent={section.accent} disabled={!prev} onClick={() => prev && onGo(prev)} />
            {prev?.title}
          </span>
          <span className="flex items-center gap-1">
            {next?.title}
            <ArrowButton dir="next" label="Sezione successiva" accent={section.accent} disabled={!next} onClick={() => next && onGo(next)} />
          </span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: `src/components/sections/SectionPhotos.tsx`**

```tsx
import type { Section } from '@/data/sections';

// Cornici a poligono irregolare, una forma diversa per foto (a rotazione), leggera
// rotazione, filo nel colore della sezione. Bicromo blu come la hero, colori pieni in hover.
const SHAPES = [
  'polygon(4% 0, 100% 3%, 96% 100%, 0 94%)',
  'polygon(0 5%, 93% 0, 100% 92%, 6% 100%)',
  'polygon(7% 3%, 100% 0, 95% 96%, 0 100%)',
];
const TILT = [-2, 1.5, -1];

export default function SectionPhotos({ section }: { section: Section }) {
  if (!section.photos.length) return null;
  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {section.photos.map((src, i) => (
        <div
          key={src}
          data-section-photo
          className="group p-[2px]"
          style={{ background: section.accent, clipPath: SHAPES[i % SHAPES.length], transform: `rotate(${TILT[i % TILT.length]}deg)` }}
        >
          <img
            src={src}
            alt=""
            loading="lazy"
            className="block aspect-[4/3] w-full object-cover transition-[filter] duration-300 [filter:grayscale(1)_sepia(0.45)_hue-rotate(185deg)_saturate(1.5)_brightness(0.75)] group-hover:[filter:none]"
            style={{ clipPath: SHAPES[i % SHAPES.length] }}
          />
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: `src/pages/SectionLayout.tsx`**

```tsx
import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowBackIcon } from '@/components/ui/icons/akar-icons-arrow-back';
import { NightSky } from '@/components/landing/NightSky';
import Footer from '@/components/Footer';
import SectionPanel from '@/components/sections/SectionPanel';
import SectionPhotos from '@/components/sections/SectionPhotos';
import { sections, type Section } from '@/data/sections';

// Layout route delle 4 sezioni: resta montata passando da una all'altra (le route figlie
// non hanno element), così lo stage 3D non si ricrea e la camera vola in continuità.
export default function SectionLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const index = Math.max(0, sections.findIndex((s) => s.href === pathname));
  const section = sections[index];
  const prev = sections[index - 1];
  const next = sections[index + 1];
  const go = (s: Section) => navigate(s.href);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      if (e.key === 'ArrowLeft' && prev) navigate(prev.href);
      if (e.key === 'ArrowRight' && next) navigate(next.href);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prev, next, navigate]);

  return (
    <div className="relative min-h-screen bg-black text-white">
      {/* stage fisso dietro a tutto: cielo + (Task 3) canvas dell'isola */}
      <div data-stage className="fixed inset-0 -z-10">
        <NightSky dusk={0} night={1} />
      </div>

      <Link
        to="/"
        aria-label="Torna alla home"
        className="fixed top-4 left-4 z-30 flex items-center border-2 border-white bg-black/60 p-2 !text-white transition-all duration-300 hover:bg-white hover:!text-black"
      >
        <ArrowBackIcon />
      </Link>

      {/* primo schermo: desktop riquadro a destra (isola a sinistra), mobile pannello dal basso */}
      <div className="relative flex min-h-screen items-end px-4 pb-6 pt-[62vh] md:items-center md:justify-end md:px-[6%] md:py-16">
        {/* sfumatura sotto al pannello su mobile: niente blur */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black via-black/70 to-transparent md:hidden" />
        <div className="relative w-full md:max-w-md">
          <SectionPanel key={section.key} section={section} index={index} total={sections.length} prev={prev} next={next} onGo={go} />
        </div>
      </div>

      <section className="relative bg-gradient-to-b from-transparent via-[#03061a]/90 to-black px-4 pb-20 pt-10 md:px-[6%]">
        <div className="mx-auto max-w-6xl">
          <SectionPhotos section={section} />
        </div>
      </section>

      <Footer />
    </div>
  );
}
```

- [ ] **Step 5: Route in `src/App.tsx`**

```tsx
import SectionLayout from "./pages/SectionLayout";
import { sections } from "./data/sections";
// …dentro createBrowserRouter([...]), dopo le route delle fanzine:
  // layout route delle sezioni: figlie senza element, lo stage resta montato
  { element: <SectionLayout />, children: sections.map((s) => ({ path: s.href })) },
```

- [ ] **Step 6: Blocchi del finale → Link**

In `src/components/landing/SplitScroll.tsx`, dentro `FinaleBlocks`, sostituire l'`<a key={s.key} href="#" onClick={(e) => e.preventDefault()} …>` … `</a>` con `<Link key={s.key} to={s.href} …>` … `</Link>` (stesse classi e `aria-label`), e aggiornare il commento sopra: "blocco intero cliccabile verso la pagina di sezione". Il tipo `SplitSection` va esteso con `href: string` (e l'interfaccia in cima al file aggiornata di conseguenza). `Link` è già importato nel file.

- [ ] **Step 7: Verificare**

Run: `npx tsc -b && cd $SCRATCH && node t2.mjs`
Expected: `OK []`.

Screenshot visivo di `/mostre` a 1440×900 e 390×844: riquadro con doppio filo e angoli smussati, titolo "MOSTRE" magenta, 3 foto con cornici irregolari scorrendo, footer.

- [ ] **Step 8: Commit**

```bash
git commit -m "tendart: section pages layout, PS2 panel, photos and navigation" -- src/pages/SectionLayout.tsx src/components/sections/SectionPanel.tsx src/components/sections/SectionPhotos.tsx src/App.tsx src/components/landing/SplitScroll.tsx
```

---

### Task 3: Stage 3D — isola di notte, volo della camera, segnalino, parallasse

**Files:**
- Create: `src/components/sections/SectionStage.tsx`
- Modify: `src/pages/SectionLayout.tsx` (monta lo stage nello slot `data-stage`)

**Interfaces:**
- Consumes: `IslandScene`, `nightState` da `src/components/landing/IslandScene.tsx` (`IslandScene({ reducedMotion: boolean })`, `nightState: { value: number }`); `Section`, `WIDE_VIEW` da Task 1.
- Produces: `SectionStage` default export, props `{ section: Section }`. In sviluppo espone `window.__sectionCam = { position: [x,y,z] }` aggiornato a ogni frame (solo `import.meta.env.DEV`) per le verifiche.

- [ ] **Step 1: Script di verifica (fallisce: nessun canvas)**

`$SCRATCH/t3.mjs`:

```js
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
const cam = () => p.evaluate(() => window.__sectionCam?.position?.map(v => +v.toFixed(2)));
const near = (a, b) => a && a.every((v, i) => Math.abs(v - b[i]) < 0.25);
await p.goto('http://localhost:5181/mostre'); await p.waitForTimeout(2500);
if ((await p.locator('canvas').count()) !== 1) throw new Error('no canvas');
const c1 = await cam(); console.log('mostre', c1);
if (!near(c1, [2.3, 1.2, 1.6])) throw new Error('camera not on mostre desktop view');
// rapid-switch: 3 click durante il volo → deve finire su /concerti... partendo da mostre: next→eventi→concerti
await p.getByLabel('Sezione successiva').click(); await p.waitForTimeout(150);
await p.getByLabel('Sezione successiva').click(); await p.waitForTimeout(2500);
const c2 = await cam(); console.log('concerti', c2);
if (!p.url().endsWith('/concerti') || !near(c2, [1.2, 1.1, 2.3])) throw new Error('rapid-switch');
if ((await p.locator('canvas').count()) !== 1) throw new Error('canvas remounted/duplicated');
// resize → mobile view
await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(2500);
const c3 = await cam(); console.log('concerti mobile', c3);
if (!near(c3, [0.25, 0.5, 1.55])) throw new Error('resize: mobile view not applied');
console.log('OK', errs);
if (errs.length) throw new Error('page errors');
await b.close();
```

Run: `cd $SCRATCH && node t3.mjs`
Expected: FAIL (`no canvas`).

- [ ] **Step 2: `src/components/sections/SectionStage.tsx`**

```tsx
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
  const base = useRef({ px: WIDE_VIEW.position[0], py: WIDE_VIEW.position[1], pz: WIDE_VIEW.position[2], tx: WIDE_VIEW.target[0], ty: WIDE_VIEW.target[1], tz: WIDE_VIEW.target[2] });
  const pointer = useRef({ x: 0, y: 0 });
  const look = useRef(new THREE.Vector3());

  useEffect(() => {
    const to = { px: view.position[0], py: view.position[1], pz: view.position[2], tx: view.target[0], ty: view.target[1], tz: view.target[2] };
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
    return () => { nightState.value = 0; };
  }, []);
  const view = mobile ? section.camera.mobile : section.camera.desktop;

  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: WIDE_VIEW.position, fov: 40 }}
      onCreated={({ gl }) => { gl.domElement.style.touchAction = 'pan-y'; }}
      className="!absolute inset-0"
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 5]} intensity={1.2} />
      <directionalLight position={[-3, 1, -2]} intensity={0.35} color="#00f5d4" />
      <Suspense fallback={null}>
        <group rotation={[0, 0, 0]}>
          <IslandScene reducedMotion={reduced()} />
        </group>
        <Marker position={section.marker} color={section.accent} />
      </Suspense>
      <CameraRig view={view} />
    </Canvas>
  );
}
```

- [ ] **Step 3: Montare lo stage nel layout**

In `src/pages/SectionLayout.tsx` importare `SectionStage` e, nello slot, dopo `<NightSky …/>`:

```tsx
        <SectionStage section={section} />
```

Nota: `useMemo`/stabilità di `view`: `section.camera.desktop` è un oggetto costante del modulo dati, quindi il riferimento cambia solo al cambio sezione/breakpoint (l'effetto del rig non riparte a ogni render).

- [ ] **Step 4: Verificare e tarare**

Run: `npx tsc -b && cd $SCRATCH && node t3.mjs`
Expected: `OK []`.

Poi screenshot delle 4 sezioni a 1440×900 e 390×844 a volo concluso (attesa 2.5 s). Criteri di taratura (modificare solo `camera`/`marker` in `src/data/sections.ts`):
- desktop: il posto e il segnalino nella metà sinistra dello schermo, non coperti dal riquadro a destra, con un po' di isola attorno;
- mobile: il posto riempie la parte alta (sopra al pannello, cioè nei primi ~60% di altezza), camera bassa, bordi dell'isola fuori campo;
- segnalino appena sopra l'oggetto, non dentro.
Se si ritoccano i valori, aggiornare anche le coordinate attese in `t3.mjs` e rilanciarlo.

- [ ] **Step 5: Commit**

```bash
git commit -m "tendart: section pages 3D stage with camera flight and marker" -- src/components/sections/SectionStage.tsx src/pages/SectionLayout.tsx src/data/sections.ts
```

---

### Task 4: Reduced motion e fallback senza WebGL

**Files:**
- Modify: `src/components/landing/Hero3D.tsx` (export di `webglAvailable`)
- Modify: `src/pages/SectionLayout.tsx` (niente `SectionStage` se WebGL assente)

**Interfaces:**
- Consumes: `webglAvailable(): boolean` da `src/components/landing/Hero3D.tsx` (reso `export`).

- [ ] **Step 1: Script di verifica**

`$SCRATCH/t4.mjs`:

```js
import { chromium } from 'playwright';
const exe = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
// reduced motion: camera subito sull'inquadratura (nessun volo)
let b = await chromium.launch({ executablePath: exe });
let p = await b.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
await p.goto('http://localhost:5181/mostre'); await p.waitForTimeout(300);
const c = await p.evaluate(() => window.__sectionCam?.position?.map(v => +v.toFixed(2)));
console.log('reduced cam @300ms', c);
if (!c || Math.abs(c[0] - 2.3) > 0.05) throw new Error('reduced motion: camera still flying');
const op = await p.locator('h1').evaluate(el => getComputedStyle(el).opacity);
if (op !== '1') throw new Error('reduced motion: text not immediately visible');
await b.close();
// no WebGL: niente canvas, testo e foto presenti
b = await chromium.launch({ executablePath: exe, args: ['--disable-webgl', '--disable-webgl2'] });
p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('http://localhost:5181/mostre'); await p.waitForTimeout(1200);
const canv = await p.locator('canvas').count();
const h1 = await p.locator('h1').textContent();
console.log('no-webgl canvas', canv, 'h1', h1, errs);
if (canv !== 0 || h1 !== 'Mostre' || errs.length) throw new Error('no-webgl fallback');
console.log('OK');
await b.close();
```

Run: `cd $SCRATCH && node t4.mjs`
Expected: FAIL su `no-webgl fallback` (oggi il canvas viene creato comunque / errore WebGL).

- [ ] **Step 2: Export e fallback**

In `src/components/landing/Hero3D.tsx`: `function webglAvailable()` → `export function webglAvailable()`.

In `src/pages/SectionLayout.tsx`:

```tsx
import { useMemo } from 'react';
import { webglAvailable } from '@/components/landing/Hero3D';
// …nel componente:
  // senza WebGL: solo cielo, riquadro e foto (stesso criterio della hero)
  const has3D = useMemo(() => webglAvailable(), []);
// …nello slot:
        {has3D && <SectionStage section={section} />}
```

(Unire l'import di `useMemo` con quello di `useEffect` già presente.)

- [ ] **Step 3: Verificare**

Run: `npx tsc -b && cd $SCRATCH && node t4.mjs && node t3.mjs && node t2.mjs`
Expected: tre `OK`.

- [ ] **Step 4: Commit**

```bash
git commit -m "tendart: section pages reduced-motion and no-WebGL fallback" -- src/components/landing/Hero3D.tsx src/pages/SectionLayout.tsx
```

---

### Task 5: Verifica finale

**Files:** nessuna modifica attesa (solo eventuali ritocchi emersi, committati con i file toccati).

- [ ] **Step 1: Build e check completi**

Run: `npx tsc -b && npm run build 2>&1 | grep -E "error|✓ built" && cd $SCRATCH && node t1.mjs && node t2.mjs && node t3.mjs && node t4.mjs`
Expected: `✓ built`, stampa dei titoli del finale e tre `OK`.

- [ ] **Step 2: Screenshot di consegna**

Le 4 sezioni a 1440×900 e 390×844 a volo concluso, più `/mostre` scorsa fino alle foto e al footer. Controllare a occhio i criteri di taratura del Task 3 e che il riquadro abbia doppio filo + angoli smussati.

- [ ] **Step 3: Stato git**

Run: `git status --short && git log --oneline -6`
Expected: i commit del piano (Task 1-4) sopra quello del piano stesso; working tree pulito.
