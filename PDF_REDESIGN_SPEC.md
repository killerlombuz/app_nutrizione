# PDF Redesign Spec

## Stato

Implementazione iniziale completata in questa branch:

- refactor del template PDF in renderer modulari
- redesign di copertina, composizione corporea e piano alimentare
- supporto locale a Playwright tramite browser installato di sistema
- verifica locale completata con generazione PDF reale su dataset paziente

## Obiettivo

Ridisegnare il PDF paziente di NutriPlan in modo che abbia una resa:

- piu' professionale
- piu' moderna ed elegante
- coerente con il redesign Stitch gia' applicato all'app
- robusta in ambiente Vercel con `playwright-core + @sparticuz/chromium-min`

Il PDF non deve sembrare un export tecnico o una stampa da Excel. Deve diventare un documento clinico premium, leggibile, ordinato e presentabile al cliente finale.

## Baseline Verificata

### Generatore app corrente

Baseline tecnica confermata su `origin/main`:

- PR `#7`: introduzione compatibilita' serverless Chromium
- PR `#8`: `@sparticuz/chromium-min` con binary remoto
- PR `#9`: correzione URL CDN del binary
- PR `#10`: fix redirect HTTP nel download del pack Chromium

File chiave:

- `src/lib/pdf/generator.ts`
- `src/lib/pdf/template.ts`
- `src/lib/pdf/data-loader.ts`
- `src/lib/pdf/types.ts`

### Materiale legacy analizzato

Dallo ZIP allegato:

- `genera_piano_nutrizionale_v34.py`
- `Monica_Barboni_PianoNutrizionale_v34d.pdf`

Il legacy Python contiene gia' una buona logica editoriale di dominio:

- sezioni pasto forti
- tabelle specializzate per pranzo/cena
- esempi settimanali
- mix proteici
- header/footer dedicati
- gestione esplicita dei page break

## Osservazioni Chiave

### Cosa va mantenuto dal legacy

- la centralita' del piano alimentare
- la distinzione chiara tra snack, pasti principali, esempi settimanali e integrazione
- la struttura comparativa per varianti `riposo / allenamento 1 / allenamento 2`
- il comportamento prevedibile dell'impaginazione

### Cosa va superato

- look troppo "Carbon/ReportLab" e meno coerente con l'app attuale
- eccesso di elementi colorati non sistemici
- tabelle dense con tono troppo tecnico
- cover e metriche ancora poco editoriali
- footer/header troppo invasivi rispetto al contenuto

### Cosa offre gia' l'app

Il redesign Stitch introdotto nel prodotto ha gia' definito:

- palette verde clinico + superfici chiare
- tipografia heading piu' editoriale
- card morbide, gerarchia ampia, superfici tonali
- linguaggio visivo piu' premium e meno CRUD

Il PDF deve derivare da quel sistema, non introdurne un altro.

## Direzione Visiva

### Principi

- A4 verticale, margini ariosi, densita' controllata
- una gerarchia molto netta tra titolo sezione, blocchi informativi e dati tabellari
- uso del colore come struttura, non come decorazione
- poche famiglie di componenti ripetute sempre uguali
- forte attenzione alla stampa reale, non solo alla preview browser

### Linguaggio visivo proposto

- cover editoriale con grande titolo, sottotitolo, nome paziente, data e riepilogo sintetico
- sezione "hero" per il piano alimentare
- pasti resi come moduli card-based con tavole pulite e molto leggibili
- metriche cliniche raccolte in summary card compatte
- tabelle con header sticky in stampa ripetuto dove utile, zebra leggera e bordi quasi invisibili
- footer minimale, non dominante

### Tipografia PDF

Obiettivo:

- heading con il tono del redesign app
- body neutro e leggibile
- label e microtesto con contrasto alto ma non aggressivo

Decisione pratica:

- usare font locali o self-hosted, non dipendenti da runtime esterno
- evitare dipendenze Google Fonts in fase di build PDF

## Architettura Target

Refactor del generatore in tre livelli:

1. Data loading
- resta in `src/lib/pdf/data-loader.ts`
- deve produrre dati completi ma non gia' "impaginati"

2. View model
- nuovo livello di trasformazione dati per il PDF
- aggrega label, metriche, varianti, stati vuoti, righe tabellari e testi pronti al rendering

3. Rendering HTML/CSS
- renderer modulari per sezione
- componenti print-oriented riusabili

## Componenti PDF Da Introdurre

- `PdfCover`
- `PdfSectionHeader`
- `PdfMetricGrid`
- `PdfCallout`
- `PdfMealCard`
- `PdfMealMatrix`
- `PdfWeeklyGrid`
- `PdfSupplementList`
- `PdfInstructionBlock`
- `PdfRecipeCard`

## Nuova Struttura Sezioni

### 1. Cover

Contenuto:

- titolo documento
- nome paziente
- data ultimo aggiornamento
- professionista
- quick summary: altezza, peso ultimo, BMI, % massa grassa, nome piano

Obiettivo:

- aprire il documento con tono professionale
- dare immediatamente contesto al paziente

### 2. Sintesi Clinica

Contenuto:

- metriche principali dell'ultima visita
- eventuale mini trend peso / body fat
- blocco "focus attuale" con 2-3 indicatori principali

Obiettivo:

- anticipare la sezione `Composizione Corporea` con una vista piu' sintetica e leggibile

Nota:

- la sezione dettagliata delle misure resta, ma va resa meno grezza

### 3. Piano Alimentare

Questa e' la sezione guida del redesign.

Contenuto:

- summary delle varianti kcal
- meal modules ordinati
- focus forte su pranzo e cena

Obiettivo:

- usare il riferimento Stitch `Nutrition Plan: Lunch & Tables (v2)` come direzione per gerarchia e composizione
- rendere pranzo e cena i blocchi piu' chiari e piu' "premium" del documento

### 4. Esempio Settimanale

Contenuto:

- griglia giorni della settimana
- distinzione visiva chiara pranzo vs cena
- eventuali mix proteici in blocco separato

Obiettivo:

- togliere effetto "tabella tecnica"
- favorire scansione rapida

### 5. Integrazione e Sport

Contenuto:

- attivita' sportive
- integratori

Obiettivo:

- usare card leggere e non tavole pesanti

### 6. Indicazioni Speciali

Contenuto:

- blocchi testuali categorizzati

Obiettivo:

- trasformare testo libero in blocchi ben separati, con titoli e callout

### 7. Ricette

Contenuto:

- card ricetta
- kcal principali
- ingredienti essenziali

Obiettivo:

- evitare la tabella standard se non necessaria

## Focus Sezione Hero: Pranzo e Cena

### Problema attuale

Nel template attuale:

- pranzo e cena sono leggibili ma ancora "HTML report"
- le colonne carbo/proteine non hanno sufficiente presenza visiva
- informazioni accessorie e istruzioni si confondono con la tabella

### Obiettivo redesign

Ogni pasto principale deve avere:

- header forte con nome sezione e metriche
- blocco informativo secondario per verdure, condimenti e regole
- matrice principale pulita per le alternative
- eventuale blocco "mix proteici" separato

### Layout target

Per `PRANZO` e `CENA`:

- header sezione
- subheader con kcal / proteine / variante
- barra informativa con verdure + condimento
- testo istruzione breve
- matrice principale:
  - colonna carboidrati
  - colonne proteiche per categoria
  - valori varianti allineati
- footer opzionale con note pratiche

### Regole di leggibilita'

- nessuna cella con 3 livelli visivi contemporanei
- nome alimento e grammature devono avere ruoli tipografici diversi
- le varianti allenamento non devono dominare la variante base
- le categorie proteiche devono essere riconoscibili senza colori urlati

## Refactor Tecnico Consigliato

### Step 1

Scomporre `src/lib/pdf/template.ts` in file dedicati:

- `src/lib/pdf/renderers/cover.ts`
- `src/lib/pdf/renderers/measurements.ts`
- `src/lib/pdf/renderers/diet.ts`
- `src/lib/pdf/renderers/weekly.ts`
- `src/lib/pdf/renderers/supplements.ts`
- `src/lib/pdf/renderers/instructions.ts`
- `src/lib/pdf/renderers/recipes.ts`
- `src/lib/pdf/renderers/shared.ts`

### Step 2

Introdurre `pdf theme tokens` dedicati:

- colori
- tipografia
- spacing
- radius
- table styles
- print utility classes

### Step 3

Creare un view model tra `data-loader` e renderer:

- formattazione numeri
- normalizzazione label pasti
- preparazione summary card
- gestione varianti
- fallback per sezioni mancanti

### Step 4

Rifare il `footerTemplate` di Playwright:

- piu' leggero
- solo nome professionista, contatti essenziali, numero pagina
- niente barra informativa eccessiva

## Vincoli di Impaginazione

- nessun titolo sezione a fondo pagina senza almeno un blocco di contenuto
- repeat header per tabelle lunghe
- righe tabellari con altezza minima stabile
- gestione robusta di testi lunghi
- compatibilita' con 1, 2 o 3 varianti caloriche
- ogni sezione opzionale deve poter sparire senza rompere il layout

## Piano di Lavoro

### Fase 1 - Spec e wireframe

Output:

- mappa sezioni definitiva
- wireframe A4 per cover, sintesi clinica, piano alimentare, esempi settimanali
- definizione componenti PDF riusabili

### Fase 2 - Fondazione tecnica

Output:

- refactor `template.ts`
- theme tokens PDF
- view model base

### Fase 3 - Implementazione hero section

Priorita':

- `Piano Alimentare`
- soprattutto `Pranzo` e `Cena`

Output:

- prima versione premium della sezione piu' importante
- dataset reali per validazione

### Fase 4 - Sezioni secondarie

Output:

- cover
- composizione corporea
- weekly
- integrazione
- istruzioni
- ricette

### Fase 5 - QA stampa e Vercel

Output:

- verifica locale
- verifica layout con page break estremi
- verifica deploy Vercel e download PDF

## Acceptance Criteria

- il PDF appare coerente con il redesign Stitch dell'app
- la sezione `Piano Alimentare` e' chiaramente il cuore del documento
- `Pranzo` e `Cena` sono piu' leggibili del legacy Python, non meno
- il documento mantiene una qualita' costante con pazienti semplici e complessi
- il deploy Vercel continua a funzionare con lo stack Playwright attuale

## Rischi

- lo screen Stitch richiesto non e' esportabile anonimamente dal solo URL pubblico, quindi il riferimento va ricostruito dal linguaggio visivo gia' presente in app oppure da export autenticato
- i font esterni non sono una base affidabile per il PDF server-side
- il template attuale e' troppo monolitico per un redesign serio senza refactor minimo

## Prossimo Passo Consigliato

Implementare subito in questo ordine:

1. estrazione renderer modulari
2. nuovi token PDF
3. redesign completo di `Piano Alimentare`
4. solo dopo, riallineamento delle sezioni restanti

Questo riduce il rischio e permette una review visiva sul blocco piu' importante prima di rifinire il resto del documento.
