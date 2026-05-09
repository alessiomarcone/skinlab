# SKINLAB — Design Spec

**Data:** 2026-05-09  
**Stack:** Astro 4 + Vite · Tailwind CSS · Sanity v3 · Stripe Payment Links · Netlify  
**Obiettivo:** Demo e-commerce beauty con PageSpeed mobile 95-100/100

---

## 1. Architettura

### Rendering strategy

`output: 'static'` — SSG puro. Tutto pre-renderizzato a build time, output HTML+CSS in `dist/`. Nessun adapter Netlify, nessun server-side runtime.

Aggiornamento contenuti: webhook Sanity → trigger rebuild Netlify (~45s). Sufficiente per un demo.

### Configurazione Astro

```js
// astro.config.mjs
export default defineConfig({
  output: 'static',
  integrations: [tailwind()],
  image: { service: 'sharp' },
})
```

### Struttura progetto

```
skinlab/
├── src/
│   ├── pages/
│   │   ├── index.astro
│   │   └── prodotti/
│   │       └── [slug].astro
│   ├── components/
│   │   ├── Nav.astro
│   │   ├── Footer.astro
│   │   ├── Hero.astro
│   │   ├── ProductGrid.astro
│   │   └── ProductCard.astro
│   ├── lib/
│   │   └── sanity.ts
│   └── styles/
│       └── global.css
├── public/
│   └── fonts/
│       └── inter-variable.woff2
├── sanity/
│   └── schemaTypes/
│       └── product.ts
└── netlify.toml
```

### Font strategy

Inter Variable (woff2, subset latin, ~25KB). Caricato con `<link rel="preload" as="font" crossorigin>` nel `<head>`. `font-display: swap`. Nessuna dipendenza esterna.

---

## 2. Brand

| Token | Valore |
|---|---|
| Rosa principale | `#FF6B9D` |
| Rosa chiaro | `#FFE4F0` |
| Bianco | `#FFFFFF` |
| Nero | `#0D0D0D` |
| Font | Inter Variable |
| Tagline | "We believe in your skin. Literally." |
| Tono | Diretto, ironico, anti-bullshit |

---

## 3. Schema Sanity

### Document type: `product`

| Campo | Tipo | Note |
|---|---|---|
| `name` | `string` | Nome prodotto |
| `slug` | `slug` | URL: `/prodotti/[slug]` |
| `tagline` | `string` | Una riga, tono brand |
| `description` | `text` | Corpo lungo per PDP |
| `price` | `number` | Es. `28.00` |
| `category` | `string` | "Siero" · "Crema" · "Tonico" |
| `image` | `image` | Hotspot abilitato |
| `stripePaymentLink` | `url` | Link diretto Stripe Payment Link |
| `isBestseller` | `boolean` | Badge opzionale |
| `ingredients` | `string` | "Vitamina C 15%, Niacinamide 5%" |

### Query GROQ — homepage

```groq
*[_type == "product"] | order(_createdAt asc) {
  _id, name, slug, tagline, price, category, isBestseller,
  "imageUrl": image.asset->url
}
```

### Query GROQ — PDP

```groq
*[_type == "product" && slug.current == $slug][0] {
  name, tagline, description, price, category,
  stripePaymentLink, ingredients,
  "imageUrl": image.asset->url
}
```

Immagini servite via CDN Sanity con parametri `?w=800&fm=webp&q=85`.

---

## 4. Pagine

### Nav.astro

- Background `#0D0D0D`, logo "SKINLAB" in `#FF6B9D`, link bianchi
- Zero JS — nessun menu hamburger
- Su mobile: link in riga scrollabile orizzontale

### Footer.astro

- Una riga: tagline + copyright
- Sfondo `#0D0D0D`, testo grigio
- Nessuna interazione

### Homepage (`index.astro`)

**Hero — split 50/50 desktop, stack mobile:**

- Sinistra: `<h1>` headline, tagline, CTA "Scopri i prodotti" (anchor `#prodotti`)
- Destra: immagine prodotto hero (primo bestseller da Sanity), `loading="eager"`, `fetchpriority="high"`, dimensioni esplicite

**ProductGrid:**

- Layout: 3 colonne desktop / 2 tablet / 1 mobile (CSS Grid, niente JS)
- Prima riga immagini: `loading="eager"`, resto: `loading="lazy"`
- Click card → `<a href="/prodotti/[slug]">` — navigazione nativa, zero JS

**ProductCard:**

- Immagine tall, aspect-ratio 3/4, formato verticale editoriale
- Nome prodotto, tagline (una riga, tono brand), prezzo in `#FF6B9D`

### PDP (`/prodotti/[slug].astro`)

Stack verticale, ordine:

1. Breadcrumb `← Tutti i prodotti` (`<a href="/">`)
2. Immagine — full width mobile, max 600px centrato desktop, WebP, dimensioni esplicite
3. Categoria (label uppercase), `<h1>` nome, tagline in corsivo
4. Prezzo in `#FF6B9D`
5. Descrizione lunga
6. Ingredienti attivi (condizionale — solo se campo non vuoto)
7. CTA: `<a href={stripePaymentLink} target="_blank" rel="noopener">ACQUISTA</a>` — link puro, niente JS

`getStaticPaths()` interroga Sanity a build time e genera una route per ogni slug.

---

## 5. Performance

| Tecnica | Implementazione |
|---|---|
| Zero JS client | Nessuna Astro island, nessuno `<script>` |
| Immagini WebP | `?fm=webp` CDN Sanity + componente `<Image>` Astro |
| Dimensioni esplicite | `width` e `height` su ogni `<img>` → CLS = 0 |
| Lazy load selettivo | `loading="eager"` su LCP image, `loading="lazy"` sul resto |
| Font preload | `<link rel="preload" as="font" crossorigin>` in `<head>` |
| CSS minimale | Tailwind purge → solo classi usate, ~8KB gzipped |
| Cache headers | `Cache-Control: max-age=31536000` su `/fonts/` e assets statici via `netlify.toml` |

**Target:** PageSpeed mobile 95-100/100.

---

## 6. Deploy

- **Netlify** — build command: `npm run build`, publish dir: `dist`
- **Webhook:** Sanity → Netlify build hook → rebuild automatico su publish prodotto
- **Env vars su Netlify:** `PUBLIC_SANITY_PROJECT_ID`, `PUBLIC_SANITY_DATASET`
- `.gitignore`: `dist/`, `.env`, `node_modules/`, `.superpowers/`
