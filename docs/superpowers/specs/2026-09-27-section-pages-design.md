# Tendart — Pagine di sezione sull'isola (Chi siamo / Mostre / Eventi / Concerti)

Data: 2026-09-27
Stato: design approvato in chat (approccio 1, "ogni sezione è un posto dell'isola")

## Obiettivo

Dare una destinazione ai 4 blocchi del finale della landing (oggi link mock `href="#"`).
Ogni sezione ha una pagina con **una spiegazione e qualche foto** — niente elenco di
eventi. L'estetica resta quella del sito: low-poly, notte, neon, "gioco PS2".

Idea centrale: le 4 pagine sono **4 posti della stessa isola** della landing. Aprire
una sezione = la camera vola su quel posto; passare a un'altra sezione = la camera
"cammina" fino al posto successivo, senza ricaricare la pagina.

## Mappatura sezione → posto dell'isola

| Sezione   | Route         | Posto (IslandScene)           | Coordinate di riferimento (spazio isola) |
|-----------|---------------|-------------------------------|------------------------------------------|
| Chi siamo | `/chi-siamo`  | la tenda (`Tent`)             | ~(-1.05, 0.35)                           |
| Mostre    | `/mostre`     | le rocce dipinte (`PetroglyphRocks`) | ~(0.95, -0.42)                    |
| Eventi    | `/eventi`     | gli alberi con le lucine (`WalkerTree`) | ~(-0.45, -1.0)                 |
| Concerti  | `/concerti`   | il falò (`Campfire`)          | ~(-0.1, 0.55)                            |

## Dati

Nuovo `src/data/sections.ts`, sorgente unica (stesso pattern di `src/data/fanzines.ts`):

- `key`, `href`, `title`, `text` (testo breve, oggi in `SECTIONS` di `Landing.tsx`),
  `accent` (colore sezione), `place` (etichetta del posto: "La tenda", "Le rocce", …),
  `body` (spiegazione lunga, array di paragrafi), `photos` (array di import immagini),
  `marker` (posizione del segnalino sopra il posto, spazio isola),
  `camera` con due inquadrature, `desktop` e `mobile`, ciascuna `{ position, target }`.
- `Landing.tsx` importa i testi brevi da qui (niente più array duplicato).
- Le 4 route figlie si generano da questo array in `App.tsx`, come per le fanzine.
- Contenuti iniziali: lorem ipsum per `body`, 3 foto per sezione prese da
  `src/assets/Foto landing 1/` (12 disponibili), finché non arrivano quelle vere.
- Le inquadrature `camera` si tarano a vista durante l'implementazione e restano nel
  file dati (una modifica di inquadratura = una riga di dati, zero codice).

## Collegamento dalla landing

I 4 blocchi del finale (`FinaleBlocks` in `SplitScroll.tsx`), oggi `<a href="#">`,
diventano `<Link to={section.href}>`. Resta tutto il blocco cliccabile con la freccia `→`.

## Pagina `SectionPage`

Una **route padre senza path proprio (layout route)** monta lo stage 3D e il contorno;
le 4 route delle sezioni sono sue figlie e cambiano solo il contenuto (letto dalla route
attiva). Così passando da una sezione all'altra lo stage resta **montato**: il volo della
camera è continuo e il canvas non si ricrea.

### Scena
- Riusa `IslandScene` così com'è, sempre **notte piena** (`nightState.value = 1`: falò al
  massimo, luce ambiente bassa), cielo `NightSky` (solo notte) dietro al canvas trasparente.
- Niente `PresentationControls` (camera guidata). Su desktop leggera **parallasse** della
  camera che segue il mouse (pochi gradi), per dare vita alla scena.
- `dpr` massimo 1.5 come la landing; un solo canvas per tutte e 4 le sezioni.

### Volo della camera
- All'arrivo sulla pagina: parte da un'inquadratura larga dell'isola intera e vola
  sull'inquadratura della sezione (~1.2 s, ease in-out). Tween GSAP su posizione camera e
  punto guardato.
- Cambio sezione con le frecce: vola dall'inquadratura attuale a quella della nuova
  sezione, stessa durata, senza ricaricare (navigazione react-router).
- Desktop: il posto inquadrato a sinistra con un po' di isola attorno.
- Mobile: camera **molto più vicina e bassa**, quasi ad altezza d'occhi — si vede solo il
  posto ingrandito, i bordi dell'isola restano fuori campo ("essere dentro").

### Segnalino
Ottaedro low-poly a facce piatte, emissivo nel colore della sezione, sopra il posto:
galleggia (bob) e ruota piano, con una piccola `pointLight` colorata sul posto. Si sposta
col cambio sezione.

### Riquadro di testo (stile menu PS2)
- Pannello blu notte quasi opaco, **senza backdrop-blur** (su mobile il blur sopra il
  canvas animato causava scatti — vedi fix della landing).
- Doppio filo nel colore della sezione (linea esterna + interna sottile) e **angoli
  tagliati a smusso** (clip-path).
- Contenuto dall'alto: etichetta `◆ 02 / 04 · LE ROCCE`; titolo `text-bbh` nel colore della
  sezione con leggero glow; paragrafi `body` in `text-sora`; in fondo le frecce minimal
  (`ArrowButton` esistente) con i nomi delle sezioni vicine: `‹ Chi siamo    Eventi ›`.
- All'arrivo su un posto il testo compare a righe sfalsate, veloce (~0.5 s), mentre la
  camera atterra. Niente effetto macchina da scrivere.
- Desktop: riquadro a destra, isola a sinistra; scorrendo sotto ci sono foto e footer.
- Mobile: canvas a tutto schermo fisso dietro; il riquadro è un **pannello che sale dal
  basso** (copre ~1/3 inferiore, sopra una sfumatura scura); scorrendo sale e mostra
  testo completo, poi foto e footer, con la scena ferma dietro.

### Foto
- Griglia 2-3 colonne (1-2 su mobile) sotto il riquadro.
- Ogni foto in una **cornice a poligono irregolare** (clip-path con angoli sfaccettati
  diversi per foto), leggera rotazione, filo sottile nel colore della sezione.
- Bicromo blu leggero come le foto della hero; a colori pieni al passaggio del mouse.
- Niente lightbox per ora.

### Navigazione e contorno
- Freccia indietro in alto a sinistra verso `/` (stesso stile della Library).
- `Footer` condiviso in fondo (come landing e Library).
- Tasti ← → della tastiera cambiano sezione, come nel lettore fanzine.

## Accessibilità e fallback

- `prefers-reduced-motion`: niente volo (camera direttamente sull'inquadratura), segnalino
  fermo, testo subito visibile, parallasse disattivata.
- Senza WebGL: stesso fallback della hero (`Hero3D` controlla il supporto WebGL) — pagina
  con sfondo stellato, riquadro di testo e foto, senza scena 3D.
- Ogni pagina ha il suo `<h1>` (titolo sezione) e le frecce hanno `aria-label`.

## Fuori scope

- Elenco/archivio di eventi, lightbox foto, testi e foto definitivi, nuovi modelli 3D.

## Verifica

- Screenshot desktop (1440) e mobile (390) di tutte e 4 le sezioni, a volo concluso.
- Prova di navigazione: blocco del finale → pagina giusta; frecce e tastiera fra sezioni
  con camera che si sposta (posizione camera letta prima/dopo); indietro verso `/`.
- Console senza errori; `npm run build` pulita; reduced-motion verificato con emulazione.
