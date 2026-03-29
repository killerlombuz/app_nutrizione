# WP-08: Ricette — Foto, Istruzioni, Tag

**Agente:** Codex (CX)
**Priorita:** P2 | **Effort:** Basso | **Dipendenze:** Nessuna

## Contesto

Le ricette attuali (`src/components/recipes/recipe-form.tsx`, ~233 righe) supportano solo: nome, porzioni, ingredienti con grammi, note, calcolo kcal. I competitor (That Clean Life con 7000+ ricette fotografate, Nutrium con tag allergie) offrono ricette molto piu' ricche.

## Obiettivo

Arricchire il model ricetta con: immagine, istruzioni di preparazione, tag dietetici, tempo di preparazione, difficolta'.

## Specifiche

### 1. Schema DB

Modificare il model `Recipe`:

```prisma
model Recipe {
  // campi esistenti...
  id              String   @id @default(cuid())
  professionalId  String?
  name            String
  totalKcal       Float?
  kcalPerPortion  Float?
  portions        Float?
  notes           String?

  // NUOVI CAMPI:
  imageUrl        String?
  prepTimeMin     Int?        // tempo preparazione in minuti
  cookTimeMin     Int?        // tempo cottura in minuti
  difficulty      String?     // "facile", "media", "avanzata"
  instructions    String?     // testo con istruzioni step-by-step (markdown o newline-separated)
  isVegetarian    Boolean  @default(false)
  isVegan         Boolean  @default(false)
  isGlutenFree    Boolean  @default(false)
  isLactoseFree   Boolean  @default(false)
  isLowFodmap     Boolean  @default(false)

  ingredients     RecipeIngredient[]
  professional    Professional? @relation(fields: [professionalId], references: [id])
  @@index([professionalId, name])
}
```

### 2. Form ricetta aggiornato

In `src/components/recipes/recipe-form.tsx`, aggiungere:

**Sezione "Dettagli"** (sopra ingredienti):
- Upload immagine o URL (campo testo per ora, upload S3 in fase 2)
- Tempo preparazione (input number, minuti)
- Tempo cottura (input number, minuti)
- Difficolta' (select: Facile / Media / Avanzata)

**Sezione "Istruzioni"** (sotto ingredienti):
- Textarea per istruzioni di preparazione
- Placeholder: "1. Lavare le verdure\n2. Tagliare a cubetti..."

**Sezione "Tag dietetici"** (sotto istruzioni):
- 5 checkbox: Vegetariana, Vegana, Senza glutine, Senza lattosio, Low-FODMAP

### 3. Pagina lista ricette

In `src/app/(dashboard)/recipes/page.tsx`, aggiungere:

**Filtri:**
- Dropdown difficolta'
- Checkbox tag (vegetariana, vegan, etc.)
- Range tempo preparazione

**Vista tabella aggiornata:**
- Colonna immagine (thumbnail 40x40 o placeholder)
- Colonne: Nome, Kcal/porzione, Tempo tot, Difficolta', Tag (badges)

### 4. Validazione

Aggiornare lo schema Zod per la ricetta (cercare in `src/validations/`):
- `prepTimeMin`: z.number().int().positive().optional()
- `cookTimeMin`: z.number().int().positive().optional()
- `difficulty`: z.enum(["facile", "media", "avanzata"]).optional()
- `instructions`: z.string().optional()
- `imageUrl`: z.string().url().optional()
- Tag booleani: z.boolean().default(false)

### 5. Server action

Aggiornare `src/features/recipes/actions.ts` per gestire i nuovi campi.

## File da modificare

| File | Azione |
|------|--------|
| `prisma/schema.prisma` | Nuovi campi su Recipe |
| `src/components/recipes/recipe-form.tsx` | Nuovi campi nel form |
| `src/app/(dashboard)/recipes/page.tsx` | Filtri + colonne aggiornate |
| `src/features/recipes/actions.ts` | Gestire nuovi campi |
| `src/validations/recipe.ts` (o dove si trova) | Aggiornare schema Zod |

## Perche' Codex

- Modifiche incrementali a file esistenti ben definiti
- Pattern CRUD gia' stabilito nel progetto
- Nessuna decisione architetturale nuova
- Input/output chiari per ogni file

## Acceptance Criteria

- [x] Form ricetta mostra campi: immagine, tempi, difficolta', istruzioni, tag
- [x] Nuovi campi salvati nel DB
- [x] Lista ricette filtrabile per tag e difficolta'
- [x] Thumbnail immagine nella tabella ricette
- [x] Badge tag nella tabella (es. "VEG", "GF", "LF")
- [x] Validazione Zod aggiornata
- [x] Ricette esistenti continuano a funzionare (nuovi campi opzionali)
