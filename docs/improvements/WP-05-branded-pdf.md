# WP-05: Report PDF Brandizzato + Grafici

**Agente:** Codex (CX)
**Priorita:** P1 | **Effort:** Medio | **Dipendenze:** Nessuna

## Contesto

Il sistema PDF (`src/lib/pdf/`) usa Playwright per generare report A4. Ha un design system con colori definiti (`src/lib/pdf/colors.ts`) e renderers per sezioni (cover, measurements, diet, weekly, supplements, instructions, recipes). Il model `Professional` ha gia' un campo `logoUrl`. I competitor (NutriAdmin, Cronometer Pro) offrono report brandizzati con logo, colori personalizzati, e grafici ricchi.

## Obiettivo

1. Integrare branding del professionista nel PDF (logo, colori, contatti)
2. Aggiungere grafici nel report (trend peso, composizione corporea, aderenza macro)
3. Aggiungere confronto visite side-by-side

## Specifiche

### 1. Branding nel PDF

**Dati gia' disponibili in `ReportData`:**
```typescript
professional: {
  name: string;
  title: string | null;
  email: string;
  phone: string | null;
  logoUrl: string | null; // <- questo e' il campo chiave
}
```

**Modifiche ai renderers:**

a) **Cover page** (`src/lib/pdf/renderers/cover.ts`):
- Se `logoUrl` presente, mostrare il logo in alto a sinistra (max 120x60px)
- Nome studio piu' prominente
- Aggiungere tagline/titolo se presente

b) **Header/footer globale** (`src/lib/pdf/generator.ts`):
- Il generatore Playwright supporta gia' header/footer HTML
- Aggiungere: logo piccolo (30px) a sinistra + nome professionista + data + numero pagina a destra
- Attualmente il footer mostra solo il numero pagina

c) **Colori personalizzati** (opzionale, fase 2):
- Per ora usare i colori esistenti (`PDF_COLORS`)
- In futuro: aggiungere `brandColor` al model Professional

### 2. Grafici SVG migliorati

I grafici sono generati come SVG inline (vedi `src/lib/pdf/renderers/charts.ts`).

**Aggiungere al renderer `measurements.ts`:**

a) **Grafico trend peso** — line chart con le ultime 10 visite:
- Asse X: date delle visite
- Asse Y: peso in kg
- Linea con punti, valori annotati
- Se presente un obiettivo peso (WP-09), mostrare linea tratteggiata target

b) **Grafico composizione corporea** — gia' presente un donut chart, migliorarlo:
- Aggiungere leggenda con kg e %
- Aggiungere confronto con visita precedente (delta)

c) **Grafico trend BF%** — line chart parallelo al peso:
- Stessa struttura del trend peso ma per body fat %

**Aggiungere al renderer `diet.ts`:**

d) **Grafico distribuzione macro** — pie/donut chart per scenario rest:
- Carboidrati %, Proteine %, Grassi %
- Colori distinti, leggenda con grammi

e) **Grafico distribuzione pasti** — horizontal bar chart:
- Ogni pasto con la sua % di kcal
- Colori per pasto coerenti con il tema

### 3. Confronto visite side-by-side

Aggiungere una nuova sezione PDF `comparison`:

```typescript
// In src/lib/pdf/types.ts
type ReportSection = 'cover' | 'measurements' | 'comparison' | 'diet' | ...

// In SECTION_LABELS
'comparison': 'Confronto visite'
```

**Renderer `src/lib/pdf/renderers/comparison.ts`:**
- Tabella a 3 colonne: Misura | Prima visita | Ultima visita | Delta
- Righe: peso, BMI, BF%, massa grassa, massa magra, vita, fianchi
- Delta con colore: verde se miglioramento, rosso se peggioramento
- "Miglioramento" dipende dalla misura: peso e BF% in calo = verde, massa magra in aumento = verde

### 4. Note personalizzate per sezione

In `ReportGenerator` (`src/components/report/report-generator.tsx`):
- Per ogni sezione selezionata, mostrare un campo testo opzionale "Note"
- Le note vengono passate come query param aggiuntivi all'API
- Nel renderer, se la nota e' presente, mostrarla come paragrafo sotto il titolo sezione

## File da modificare

| File | Azione |
|------|--------|
| `src/lib/pdf/renderers/cover.ts` | Logo del professionista |
| `src/lib/pdf/generator.ts` | Header/footer con logo |
| `src/lib/pdf/renderers/measurements.ts` | Grafici trend migliorati |
| `src/lib/pdf/renderers/diet.ts` | Grafici macro e distribuzione pasti |
| `src/lib/pdf/renderers/charts.ts` | Nuove funzioni SVG chart |
| `src/lib/pdf/types.ts` | Aggiungere sezione 'comparison' |
| Nuovo: `src/lib/pdf/renderers/comparison.ts` | Renderer confronto visite |
| `src/lib/pdf/template.ts` | Integrare nuova sezione |
| `src/lib/pdf/data-loader.ts` | Caricare prima/ultima visita per confronto |
| `src/components/report/report-generator.tsx` | Note per sezione, nuova checkbox comparison |

## Perche' Codex

- I renderers PDF sono funzioni pure (HTML string → output)
- Pattern chiaro e ripetibile: ogni renderer segue la stessa struttura
- I grafici SVG sono generazione di markup con calcoli matematici semplici
- Non richiede comprensione profonda dell'architettura Next.js

## Vincoli

- I grafici sono SVG inline (no librerie JS client-side nel PDF)
- Il logo puo' essere un URL esterno — usare tag `<img>` con dimensioni fisse
- Il footer di Playwright ha limitazioni: solo HTML semplice, no SVG
- Mantenere i colori coerenti con `PDF_COLORS`

## Acceptance Criteria

- [ ] Logo professionista visibile su cover page e header pagine
- [ ] Grafico trend peso con le ultime 10 visite nel PDF
- [ ] Grafico composizione corporea migliorato con leggenda e delta
- [ ] Grafico distribuzione macro nel piano dieta
- [ ] Sezione "Confronto visite" con tabella delta colorata
- [ ] Note personalizzate per sezione visibili nel PDF
- [ ] Il PDF rimane leggibile e ben formattato con/senza le nuove sezioni
- [ ] Nessuna regressione sulle sezioni PDF esistenti
