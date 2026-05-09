# SKINLAB Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build SKINLAB, un demo e-commerce beauty con Astro 4 SSG, Sanity v3, Stripe Payment Links e Netlify, con target PageSpeed mobile 95-100/100.

**Architecture:** Output statico puro (`output: 'static'`), nessun adapter, nessun JS client-side. Sanity interrogato a build time via `@sanity/client`. Font self-hosted in `public/fonts/`. Immagini WebP via CDN Sanity con dimensioni esplicite.

**Tech Stack:** Astro 4, Tailwind CSS, @sanity/client, Sanity Studio v3 (embedded, dev-only), Stripe Payment Links (URL statici), Netlify, Vitest, TypeScript strict.

---

## File Map

| File | Ruolo |
|---|---|
| `astro.config.mjs` | Config Astro: SSG, Tailwind, Sharp, remote patterns |
| `tailwind.config.mjs` | Colori brand, font family |
| `src/styles/global.css` | Tailwind directives + @font-face |
| `src/layouts/BaseLayout.astro` | HTML shell: head (preload font, meta), Nav, Footer, slot |
| `src/lib/sanity.ts` | Client Sanity, tipi TypeScript, query GROQ, helper buildImageUrl |
| `src/lib/sanity.test.ts` | Vitest tests per buildImageUrl |
| `src/components/Nav.astro` | Navbar: logo rosa, link bianchi su sfondo nero |
| `src/components/Footer.astro` | Footer: tagline + copyright |
| `src/components/ProductCard.astro` | Card verticale: immagine 3/4 + nome + tagline + prezzo |
| `src/components/Hero.astro` | Hero split: copy sinistra, immagine destra |
| `src/components/ProductGrid.astro` | Griglia 3-col prodotti, lazy load selettivo |
| `src/pages/index.astro` | Homepage: Hero + ProductGrid |
| `src/pages/prodotti/[slug].astro` | PDP: stack verticale + CTA Stripe |
| `public/fonts/inter-variable.woff2` | Font self-hosted (copiato da @fontsource-variable/inter) |
| `sanity/schemaTypes/product.ts` | Schema documento `product` |
| `sanity/schemaTypes/index.ts` | Export schema types |
| `sanity.config.ts` | Config Sanity Studio |
| `netlify.toml` | Build command, cache headers |
| `.env` | Variabili locali (non committare) |
| `.env.example` | Template variabili |

---

## Task 1: Scaffold Astro nel repo esistente

**Files:**
- Create: tutti i file base Astro in `/Users/alessio/skinlab/`

- [ ] **Step 1: Scaffolda Astro nella directory esistente**

```bash
cd /Users/alessio/skinlab && npm create astro@latest . -- --template minimal --typescript strict --no-git --install --yes
```

Expected output: `✔ Done!` — sovrascrive solo i file Astro, non tocca `docs/` o `.git/`.

- [ ] **Step 2: Installa dipendenze aggiuntive**

```bash
cd /Users/alessio/skinlab && npm install @astrojs/tailwind tailwindcss @sanity/client sanity @fontsource-variable/inter && npm install -D vitest
```

- [ ] **Step 3: Copia font Inter Variable in public/fonts/**

```bash
mkdir -p /Users/alessio/skinlab/public/fonts && cp /Users/alessio/skinlab/node_modules/@fontsource-variable/inter/files/inter-latin-wf-variable-full.woff2 /Users/alessio/skinlab/public/fonts/inter-variable.woff2
```

Expected: file presente in `public/fonts/inter-variable.woff2`, ~28KB.

- [ ] **Step 4: Crea .env.example**

Crea il file `skinlab/.env.example`:
```
PUBLIC_SANITY_PROJECT_ID=your-project-id
PUBLIC_SANITY_DATASET=production
SANITY_STUDIO_PROJECT_ID=your-project-id
SANITY_STUDIO_DATASET=production
```

- [ ] **Step 5: Crea .env da .env.example (con i valori reali)**

```bash
cp /Users/alessio/skinlab/.env.example /Users/alessio/skinlab/.env
```

Poi apri `.env` e inserisci il tuo `projectId` Sanity (visibile su sanity.io/manage) e `dataset` (di default: `production`).

- [ ] **Step 6: Aggiorna .gitignore**

Assicurati che `.gitignore` contenga:
```
dist/
.env
node_modules/
.superpowers/
```

- [ ] **Step 7: Commit**

```bash
cd /Users/alessio/skinlab && git add -A && git commit -m "feat: scaffold Astro project with dependencies"
```

---

## Task 2: Configura Astro + Tailwind

**Files:**
- Modify: `astro.config.mjs`
- Create: `tailwind.config.mjs`

- [ ] **Step 1: Sovrascrivi astro.config.mjs**

```js
// astro.config.mjs
import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'

export default defineConfig({
  output: 'static',
  integrations: [tailwind()],
  image: {
    service: { entrypoint: 'astro/assets/services/sharp' },
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }],
  },
})
```

- [ ] **Step 2: Crea tailwind.config.mjs**

```js
// tailwind.config.mjs
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter Variable', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: '#FF6B9D',
        'brand-light': '#FFE4F0',
        dark: '#0D0D0D',
      },
    },
  },
}
```

- [ ] **Step 3: Verifica che Astro si avvii senza errori**

```bash
cd /Users/alessio/skinlab && npm run dev -- --port 4321
```

Expected: `Local http://localhost:4321/` senza errori in console. Premi Ctrl+C per fermare.

- [ ] **Step 4: Commit**

```bash
cd /Users/alessio/skinlab && git add astro.config.mjs tailwind.config.mjs && git commit -m "feat: configure Astro SSG + Tailwind with brand tokens"
```

---

## Task 3: Font + global CSS + BaseLayout

**Files:**
- Create: `src/styles/global.css`
- Create: `src/layouts/BaseLayout.astro`
- Delete: `src/pages/index.astro` (verrà ricreato al Task 10)

- [ ] **Step 1: Crea src/styles/global.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@font-face {
  font-family: 'Inter Variable';
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url('/fonts/inter-variable.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA,
    U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212,
    U+2215, U+FEFF, U+FFFD;
}
```

- [ ] **Step 2: Crea src/layouts/BaseLayout.astro**

```astro
---
import Nav from '../components/Nav.astro'
import Footer from '../components/Footer.astro'
import '../styles/global.css'

interface Props {
  title: string
  description?: string
}

const { title, description = 'Skincare onesta. We believe in your skin. Literally.' } = Astro.props
---
<!DOCTYPE html>
<html lang="it">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content={description} />
    <title>{title} — SKINLAB</title>
    <link
      rel="preload"
      href="/fonts/inter-variable.woff2"
      as="font"
      type="font/woff2"
      crossorigin
    />
  </head>
  <body class="bg-white text-dark font-sans antialiased">
    <Nav />
    <main>
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

- [ ] **Step 3: Crea placeholder src/components/Nav.astro e Footer.astro per sbloccare il build**

`src/components/Nav.astro`:
```astro
---
---
<nav></nav>
```

`src/components/Footer.astro`:
```astro
---
---
<footer></footer>
```

- [ ] **Step 4: Aggiorna src/pages/index.astro per usare BaseLayout**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro'
---
<BaseLayout title="Home">
  <p>In costruzione</p>
</BaseLayout>
```

- [ ] **Step 5: Verifica build**

```bash
cd /Users/alessio/skinlab && npm run build 2>&1 | tail -5
```

Expected: `✓ Completed in` senza errori.

- [ ] **Step 6: Commit**

```bash
cd /Users/alessio/skinlab && git add src/ && git commit -m "feat: add BaseLayout with font preload and Tailwind global CSS"
```

---

## Task 4: Sanity client, tipi TypeScript e test

**Files:**
- Create: `src/lib/sanity.ts`
- Create: `src/lib/sanity.test.ts`
- Create: `vitest.config.ts`

- [ ] **Step 1: Crea vitest.config.ts**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
  },
})
```

Aggiungi lo script di test a `package.json` (nella sezione `"scripts"`):
```json
"test": "vitest run"
```

- [ ] **Step 2: Scrivi i test prima dell'implementazione**

`src/lib/sanity.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { buildImageUrl } from './sanity'

describe('buildImageUrl', () => {
  const base = 'https://cdn.sanity.io/images/proj/dataset/photo.jpg'

  it('appends webp format', () => {
    expect(buildImageUrl(base)).toContain('fm=webp')
  })

  it('appends width when provided', () => {
    expect(buildImageUrl(base, { w: 800 })).toContain('w=800')
  })

  it('defaults to quality 85', () => {
    expect(buildImageUrl(base)).toContain('q=85')
  })

  it('allows overriding quality', () => {
    expect(buildImageUrl(base, { q: 60 })).toContain('q=60')
  })

  it('preserves original URL protocol and host', () => {
    const result = buildImageUrl(base)
    expect(result.startsWith('https://cdn.sanity.io')).toBe(true)
  })
})
```

- [ ] **Step 3: Esegui i test e verifica che falliscano**

```bash
cd /Users/alessio/skinlab && npm test
```

Expected: `FAIL src/lib/sanity.test.ts` — `buildImageUrl` non è ancora definita.

- [ ] **Step 4: Implementa src/lib/sanity.ts**

```ts
// src/lib/sanity.ts
import { createClient } from '@sanity/client'

export const sanityClient = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
  dataset: import.meta.env.PUBLIC_SANITY_DATASET,
  useCdn: true,
  apiVersion: '2024-01-01',
})

export interface ProductSummary {
  _id: string
  name: string
  slug: { current: string }
  tagline: string
  price: number
  category: string
  isBestseller: boolean
  imageUrl: string
}

export interface ProductDetail {
  name: string
  tagline: string
  description: string
  price: number
  category: string
  stripePaymentLink: string
  ingredients?: string
  imageUrl: string
}

export const PRODUCTS_QUERY = `
  *[_type == "product"] | order(_createdAt asc) {
    _id, name, slug, tagline, price, category, isBestseller,
    "imageUrl": image.asset->url
  }
`

export const PRODUCT_BY_SLUG_QUERY = `
  *[_type == "product" && slug.current == $slug][0] {
    name, tagline, description, price, category,
    stripePaymentLink, ingredients,
    "imageUrl": image.asset->url
  }
`

export function buildImageUrl(
  imageUrl: string,
  opts: { w?: number; q?: number } = {}
): string {
  const url = new URL(imageUrl)
  url.searchParams.set('fm', 'webp')
  url.searchParams.set('q', String(opts.q ?? 85))
  if (opts.w) url.searchParams.set('w', String(opts.w))
  return url.toString()
}
```

- [ ] **Step 5: Esegui i test e verifica che passino**

```bash
cd /Users/alessio/skinlab && npm test
```

Expected:
```
✓ src/lib/sanity.test.ts (5)
Test Files  1 passed (1)
```

- [ ] **Step 6: Commit**

```bash
cd /Users/alessio/skinlab && git add src/lib/ vitest.config.ts package.json && git commit -m "feat: add Sanity client, types, GROQ queries, and buildImageUrl with tests"
```

---

## Task 5: Sanity Studio schema

**Files:**
- Create: `sanity/schemaTypes/product.ts`
- Create: `sanity/schemaTypes/index.ts`
- Create: `sanity.config.ts`

- [ ] **Step 1: Crea sanity/schemaTypes/product.ts**

```ts
// sanity/schemaTypes/product.ts
import { defineField, defineType } from 'sanity'

export const productType = defineType({
  name: 'product',
  title: 'Prodotto',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Nome',
      type: 'string',
      validation: r => r.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name' },
      validation: r => r.required(),
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      description: 'Una riga. Tono diretto. Es: "Per chi vuole risultati, non promesse."',
      validation: r => r.required(),
    }),
    defineField({
      name: 'description',
      title: 'Descrizione',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'price',
      title: 'Prezzo (€)',
      type: 'number',
      validation: r => r.required().positive(),
    }),
    defineField({
      name: 'category',
      title: 'Categoria',
      type: 'string',
      options: {
        list: ['Siero', 'Crema', 'Tonico', 'Scrub', 'Maschera'],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'image',
      title: 'Immagine',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'stripePaymentLink',
      title: 'Stripe Payment Link',
      type: 'url',
      description: 'URL diretto al Stripe Payment Link per questo prodotto.',
    }),
    defineField({
      name: 'isBestseller',
      title: 'Bestseller?',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'ingredients',
      title: 'Ingredienti attivi',
      type: 'string',
      description: 'Es: "Vitamina C 15%, Niacinamide 5%"',
    }),
  ],
})
```

- [ ] **Step 2: Crea sanity/schemaTypes/index.ts**

```ts
// sanity/schemaTypes/index.ts
import { productType } from './product'

export const schemaTypes = [productType]
```

- [ ] **Step 3: Crea sanity.config.ts**

```ts
// sanity.config.ts
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { schemaTypes } from './sanity/schemaTypes'

export default defineConfig({
  name: 'skinlab',
  title: 'SKINLAB Studio',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID!,
  dataset: process.env.SANITY_STUDIO_DATASET!,
  plugins: [structureTool()],
  schema: { types: schemaTypes },
})
```

- [ ] **Step 4: Aggiorna package.json — aggiungi script Studio**

Nella sezione `"scripts"` di `package.json`:
```json
"studio": "sanity dev --port 3333"
```

- [ ] **Step 5: Verifica che lo Studio si avvii**

```bash
cd /Users/alessio/skinlab && npm run studio
```

Expected: `Sanity Studio is running at http://localhost:3333`. Apri nel browser, fai login con il tuo account Sanity, verifica che compaia il tipo documento "Prodotto". Premi Ctrl+C.

- [ ] **Step 6: Commit**

```bash
cd /Users/alessio/skinlab && git add sanity/ sanity.config.ts package.json && git commit -m "feat: add Sanity Studio schema for product document"
```

---

## Task 6: Nav + Footer

**Files:**
- Modify: `src/components/Nav.astro` (sostituisce il placeholder)
- Modify: `src/components/Footer.astro` (sostituisce il placeholder)

- [ ] **Step 1: Sovrascrivi src/components/Nav.astro**

```astro
---
---
<nav class="bg-dark px-6 py-3 flex items-center justify-between sticky top-0 z-10">
  <a href="/" class="text-brand font-black tracking-widest text-sm">SKINLAB</a>
  <div class="flex gap-6 overflow-x-auto">
    <a href="/#prodotti" class="text-white text-sm whitespace-nowrap hover:text-brand transition-colors">
      Prodotti
    </a>
  </div>
</nav>
```

- [ ] **Step 2: Sovrascrivi src/components/Footer.astro**

```astro
---
const year = new Date().getFullYear()
---
<footer class="bg-dark px-6 py-5 text-center">
  <p class="text-gray-500 text-xs">
    We believe in your skin. Literally. &copy; {year} SKINLAB
  </p>
</footer>
```

- [ ] **Step 3: Verifica visiva**

```bash
cd /Users/alessio/skinlab && npm run dev -- --port 4321
```

Apri http://localhost:4321. Verifica: navbar nera con logo rosa in alto, footer nero con testo grigio in basso. Premi Ctrl+C.

- [ ] **Step 4: Commit**

```bash
cd /Users/alessio/skinlab && git add src/components/Nav.astro src/components/Footer.astro && git commit -m "feat: add Nav and Footer components"
```

---

## Task 7: ProductCard

**Files:**
- Modify: `src/components/ProductCard.astro` (sostituisce il placeholder vuoto se esiste, altrimenti crea)

- [ ] **Step 1: Crea src/components/ProductCard.astro**

```astro
---
import type { ProductSummary } from '../lib/sanity'
import { buildImageUrl } from '../lib/sanity'

interface Props {
  product: ProductSummary
  eager?: boolean
}

const { product, eager = false } = Astro.props
const imageUrl = buildImageUrl(product.imageUrl, { w: 600, q: 85 })
---
<a href={`/prodotti/${product.slug.current}`} class="group block">
  <div class="aspect-[3/4] overflow-hidden bg-brand-light">
    <img
      src={imageUrl}
      alt={product.name}
      width={600}
      height={800}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
    />
  </div>
  <div class="pt-3">
    <p class="text-xs uppercase tracking-widest text-gray-400">{product.category}</p>
    <h3 class="font-bold text-dark mt-1 leading-tight">{product.name}</h3>
    <p class="text-sm text-gray-500 mt-1 leading-snug line-clamp-2">{product.tagline}</p>
    <p class="text-brand font-semibold mt-2">€{product.price.toFixed(2)}</p>
  </div>
</a>
```

- [ ] **Step 2: Commit**

```bash
cd /Users/alessio/skinlab && git add src/components/ProductCard.astro && git commit -m "feat: add ProductCard component with tall image and tagline"
```

---

## Task 8: Hero

**Files:**
- Create: `src/components/Hero.astro`

- [ ] **Step 1: Crea src/components/Hero.astro**

```astro
---
import type { ProductSummary } from '../lib/sanity'
import { buildImageUrl } from '../lib/sanity'

interface Props {
  heroProduct: ProductSummary
}

const { heroProduct } = Astro.props
const imageUrl = buildImageUrl(heroProduct.imageUrl, { w: 900, q: 85 })
---
<section class="bg-brand-light">
  <div class="max-w-5xl mx-auto px-6 py-14 md:py-24 flex flex-col md:flex-row items-center gap-10">
    <div class="flex-1 order-2 md:order-1 text-center md:text-left">
      <p class="text-xs uppercase tracking-widest text-brand mb-3 font-semibold">
        Skincare onesta
      </p>
      <h1 class="text-4xl md:text-6xl font-black text-dark leading-tight tracking-tight">
        La skincare<br />senza bugie.
      </h1>
      <p class="text-gray-600 mt-4 text-lg">We believe in your skin. Literally.</p>
      <a
        href="#prodotti"
        class="inline-block mt-8 bg-brand text-white font-bold px-8 py-3 hover:bg-[#e85a8a] transition-colors tracking-wide"
      >
        SCOPRI I PRODOTTI →
      </a>
    </div>
    <div class="flex-1 order-1 md:order-2 w-full max-w-xs md:max-w-sm mx-auto">
      <img
        src={imageUrl}
        alt={heroProduct.name}
        width={900}
        height={1125}
        loading="eager"
        fetchpriority="high"
        decoding="sync"
        class="w-full object-cover"
      />
    </div>
  </div>
</section>
```

- [ ] **Step 2: Commit**

```bash
cd /Users/alessio/skinlab && git add src/components/Hero.astro && git commit -m "feat: add Hero component with split layout"
```

---

## Task 9: ProductGrid

**Files:**
- Create: `src/components/ProductGrid.astro`

- [ ] **Step 1: Crea src/components/ProductGrid.astro**

```astro
---
import type { ProductSummary } from '../lib/sanity'
import ProductCard from './ProductCard.astro'

interface Props {
  products: ProductSummary[]
}

const { products } = Astro.props
---
<section id="prodotti" class="px-6 py-16 max-w-6xl mx-auto">
  <h2 class="text-2xl font-black text-dark mb-10 tracking-tight">I prodotti</h2>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
    {products.map((product, index) => (
      <ProductCard product={product} eager={index < 3} />
    ))}
  </div>
</section>
```

- [ ] **Step 2: Commit**

```bash
cd /Users/alessio/skinlab && git add src/components/ProductGrid.astro && git commit -m "feat: add ProductGrid component with lazy load strategy"
```

---

## Task 10: Homepage

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Sovrascrivi src/pages/index.astro**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro'
import Hero from '../components/Hero.astro'
import ProductGrid from '../components/ProductGrid.astro'
import { sanityClient, PRODUCTS_QUERY } from '../lib/sanity'
import type { ProductSummary } from '../lib/sanity'

const products = await sanityClient.fetch<ProductSummary[]>(PRODUCTS_QUERY)

if (!products.length) {
  throw new Error('Nessun prodotto trovato in Sanity. Aggiungi almeno un prodotto prima di buildare.')
}

const heroProduct = products.find(p => p.isBestseller) ?? products[0]
---
<BaseLayout title="Home" description="Skincare onesta. We believe in your skin. Literally.">
  <Hero heroProduct={heroProduct} />
  <ProductGrid products={products} />
</BaseLayout>
```

- [ ] **Step 2: Aggiungi almeno un prodotto demo in Sanity Studio**

Avvia lo Studio:
```bash
cd /Users/alessio/skinlab && npm run studio
```

Apri http://localhost:3333, crea almeno 1 prodotto con tutti i campi compilati:
- Nome: "Vitamin C Boost"
- Slug: genera da nome
- Tagline: "Per chi vuole risultati, non promesse."
- Descrizione: (testo libero, almeno 2 righe)
- Prezzo: 28
- Categoria: Siero
- Immagine: carica un'immagine (anche placeholder)
- Stripe Payment Link: `https://buy.stripe.com/test_placeholder` (placeholder)
- Bestseller: true

Poi premi Ctrl+C per fermare lo Studio.

- [ ] **Step 3: Verifica homepage in dev**

```bash
cd /Users/alessio/skinlab && npm run dev -- --port 4321
```

Apri http://localhost:4321. Verifica: hero con immagine prodotto, griglia prodotti sotto. Premi Ctrl+C.

- [ ] **Step 4: Commit**

```bash
cd /Users/alessio/skinlab && git add src/pages/index.astro && git commit -m "feat: build homepage with Hero and ProductGrid from Sanity"
```

---

## Task 11: PDP — Product Detail Page

**Files:**
- Create: `src/pages/prodotti/[slug].astro`

- [ ] **Step 1: Crea src/pages/prodotti/[slug].astro**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro'
import {
  sanityClient,
  PRODUCTS_QUERY,
  PRODUCT_BY_SLUG_QUERY,
  buildImageUrl,
} from '../../lib/sanity'
import type { ProductSummary, ProductDetail } from '../../lib/sanity'

export async function getStaticPaths() {
  const products = await sanityClient.fetch<ProductSummary[]>(PRODUCTS_QUERY)
  return products.map(p => ({
    params: { slug: p.slug.current },
  }))
}

const { slug } = Astro.params as { slug: string }
const product = await sanityClient.fetch<ProductDetail>(PRODUCT_BY_SLUG_QUERY, { slug })

const imageUrl = buildImageUrl(product.imageUrl, { w: 1200, q: 85 })
---
<BaseLayout title={product.name} description={product.tagline}>
  <div class="max-w-2xl mx-auto px-6 py-12">

    <a
      href="/"
      class="text-sm text-gray-400 hover:text-brand transition-colors mb-8 inline-block"
    >
      ← Tutti i prodotti
    </a>

    <img
      src={imageUrl}
      alt={product.name}
      width={1200}
      height={1500}
      loading="eager"
      fetchpriority="high"
      decoding="sync"
      class="w-full object-cover mb-8"
    />

    <p class="text-xs uppercase tracking-widest text-gray-400 mb-2">{product.category}</p>
    <h1 class="text-3xl md:text-4xl font-black text-dark leading-tight mb-2">
      {product.name}
    </h1>
    <p class="text-lg text-gray-500 italic mb-4">{product.tagline}</p>
    <p class="text-2xl text-brand font-bold mb-6">€{product.price.toFixed(2)}</p>

    <p class="text-gray-700 leading-relaxed mb-6 whitespace-pre-line">
      {product.description}
    </p>

    {product.ingredients && (
      <p class="text-sm text-gray-400 mb-8 border-t border-gray-100 pt-4">
        <span class="font-semibold text-gray-500">Ingredienti attivi:</span>{' '}
        {product.ingredients}
      </p>
    )}

    <a
      href={product.stripePaymentLink}
      target="_blank"
      rel="noopener noreferrer"
      class="block w-full text-center bg-brand text-white font-bold py-4 px-8 hover:bg-[#e85a8a] transition-colors tracking-wide"
    >
      ACQUISTA →
    </a>

  </div>
</BaseLayout>
```

- [ ] **Step 2: Verifica PDP in dev**

```bash
cd /Users/alessio/skinlab && npm run dev -- --port 4321
```

Naviga su http://localhost:4321, clicca un prodotto dalla griglia. Verifica: immagine, titolo, tagline, prezzo, descrizione, bottone Acquista. Premi Ctrl+C.

- [ ] **Step 3: Commit**

```bash
cd /Users/alessio/skinlab && git add src/pages/prodotti/ && git commit -m "feat: add PDP with getStaticPaths and Stripe CTA"
```

---

## Task 12: netlify.toml + deploy config

**Files:**
- Create: `netlify.toml`

- [ ] **Step 1: Crea netlify.toml**

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"

[[headers]]
  for = "/fonts/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/_astro/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

- [ ] **Step 2: Commit**

```bash
cd /Users/alessio/skinlab && git add netlify.toml && git commit -m "feat: add netlify.toml with cache headers for fonts and assets"
```

---

## Task 13: Build finale e verifica

- [ ] **Step 1: Aggiungi almeno 5 prodotti demo in Sanity Studio**

Avvia lo Studio (`npm run studio`) e crea 5-6 prodotti con dati realistici:

| Nome | Categoria | Tagline | Prezzo |
|---|---|---|---|
| Vitamin C Boost | Siero | Per chi vuole risultati, non promesse. | 28 |
| Hydra Dense | Crema | Idratazione seria. Senza storie. | 34 |
| AHA Glow Toner | Tonico | Il tuo turno, pori. | 22 |
| Retinol Night Fix | Siero | Dormi. Il siero fa il lavoro sporco. | 42 |
| Barrier Repair Balm | Crema | Per la pelle che ne ha viste troppe. | 38 |

Per ogni prodotto: carica un'immagine, aggiungi un Stripe Payment Link placeholder, marca il primo come `isBestseller: true`.

- [ ] **Step 2: Build completo**

```bash
cd /Users/alessio/skinlab && npm run build 2>&1
```

Expected:
```
✓ Completed in Xs
dist/index.html
dist/prodotti/vitamin-c-boost/index.html
dist/prodotti/hydra-dense/index.html
... (una per ogni prodotto)
```

Nessun errore TypeScript, nessun warning Astro.

- [ ] **Step 3: Preview build locale**

```bash
cd /Users/alessio/skinlab && npm run preview -- --port 4321
```

Apri http://localhost:4321. Verifica il golden path:
1. Homepage carica con hero e griglia prodotti
2. Click su un prodotto → PDP carica correttamente
3. Nessun JS in console (`window.__astro` non esiste)
4. Network tab: immagini tutte `.webp`
5. Font caricato da `/fonts/inter-variable.woff2` (non da Google)

Premi Ctrl+C.

- [ ] **Step 4: Esegui i test**

```bash
cd /Users/alessio/skinlab && npm test
```

Expected: `Test Files 1 passed (1)` — tutti e 5 i test verdi.

- [ ] **Step 5: Deploy su Netlify**

```bash
cd /Users/alessio/skinlab && npx netlify-cli deploy --prod --dir dist
```

Se non hai Netlify CLI: installa con `npm install -g netlify-cli`, poi `netlify login`.

Oppure: push su GitHub e collega il repo a Netlify dalla dashboard (Build command: `npm run build`, Publish dir: `dist`). Imposta le env vars su Netlify:
- `PUBLIC_SANITY_PROJECT_ID`
- `PUBLIC_SANITY_DATASET`
- `SANITY_STUDIO_PROJECT_ID`
- `SANITY_STUDIO_DATASET`

- [ ] **Step 6: Commit finale**

```bash
cd /Users/alessio/skinlab && git add -A && git commit -m "chore: final build verification and deploy config"
```

---

## Note post-deploy

**Webhook Sanity → Netlify rebuild:**
1. Vai su sanity.io/manage → progetto → API → Webhooks
2. Aggiungi webhook: URL = `https://api.netlify.com/build_hooks/YOUR_BUILD_HOOK_ID`
3. Trigger: on document publish/unpublish
4. Da questo momento ogni pubblicazione in Studio triggera un rebuild automatico

**PageSpeed:**
Dopo il deploy, testa su pagespeed.web.dev con l'URL Netlify.
Target: 95-100/100 mobile. Se LCP > 2.5s, verifica che `fetchpriority="high"` sia sulla prima immagine visibile.
