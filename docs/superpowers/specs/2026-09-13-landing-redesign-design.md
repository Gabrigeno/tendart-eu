# Tendart — Redesign Landing (scroll experience + 3D)

Data: 2026-09-13
Stato: approvato in chat (approccio A)

## Obiettivo

Rifare la sola pagina `/` (Landing). Resto del sito (fanzine, library, routing) intatto.
Estetica: dark punk — fondo nero, foto in evidenza, accenti neon esistenti
(`#00f5d4` teal, `#ff0054` magenta, `#8cff00` acid).

## Stack

- Esistente: React 19, Vite, Tailwind 4, GSAP 3 (ScrollTrigger incluso, già in bundle).
- Nuove dipendenze: `three`, `@react-three/fiber`, `@react-three/drei`.
- `ogl` resta per i componenti esistenti (FlyingPosters); non si usa per il nuovo 3D.

## Struttura pagina

### 1. Hero 3D
- Canvas react-three-fiber full-screen, fondo nero.
- Scritta "TENDART" estrusa con `Text3D` di drei (font typeface JSON in `public/fonts/`),
  materiale neon (magenta/teal), 2-3 luci colorate.
- Interazione: `PresentationControls` di drei — drag/ruota con mouse e touch,
  ritorno elastico alla posa iniziale.
- Hint "scroll ↓" animato in basso.

### 2. Scroll experience (4 schermate)
Sezioni pinnate con GSAP ScrollTrigger: **Chi siamo** → **Mostre** → **Eventi** → **Concerti**.

Per ogni schermata:
- Collage full-bleed di 3-4 foto sparse: rotazioni casuali, duotone neon,
  effetto xerox/strappo (CSS filter + clip-path), z-index sovrapposti.
- Transizione tra schermate: le foto della schermata uscente scattano via,
  quelle nuove entrano (stile punk, movimenti secchi, no easing morbidi).
- Didascalia grande che appare a scatti (effetto timbro/glitch) con il testo
  della sezione.

### 3. Fanzine CTA
Sezione con invito verso `/library`, riuso `ElectricButton` esistente.

### 4. Footer
Contatti/social attuali (Insta, YouTube, SoundCloud, mail) riadattati al tema dark.

## Foto

Placeholder locali generati (duotone neon) in `public/punk/`, nomi parlanti
(`chi-siamo-1.jpg`, `mostre-2.jpg`, …). L'utente le sostituirà con foto reali
mantenendo i nomi file.

## Componenti (file nuovi)

- `src/components/landing/Hero3D.tsx` — canvas R3F + Text3D + controls.
- `src/components/landing/PunkSection.tsx` — una schermata collage + didascalia
  (props: titolo, testo, foto[]).
- `src/pages/Landing.tsx` — riscritto: compone Hero3D, 4 PunkSection, CTA fanzine, footer.

Il vecchio contenuto di Landing.tsx (TypeAnimation, Marquee, pattern geometrico) viene rimosso.

## Mobile

- Drag 3D via touch (PresentationControls lo gestisce).
- ScrollTrigger pinning testato su viewport mobile; collage ridotto a 2-3 foto per schermata.
- `prefers-reduced-motion`: scroll semplice senza pin, foto statiche.

## Error handling

- WebGL non disponibile → fallback: scritta TENDART in testo piatto stile neon (CSS).
- Font typeface non caricato → Suspense con fallback vuoto, pagina resta usabile.

## Test / verifica

- `npm run build` pulito (tsc + vite).
- Verifica manuale: dev server, scroll completo desktop + viewport mobile emulato,
  drag del logo 3D, link CTA e footer funzionanti.

## Fuori scope

- Restyling fanzine/library.
- CMS o contenuti dinamici.
- Foto reali (arrivano dopo, stessi nomi file).
