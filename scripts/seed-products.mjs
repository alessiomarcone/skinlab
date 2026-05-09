// Sanity bulk import — legge products.csv e crea i documenti product
// Usage: npm run seed
// Richiede SANITY_API_TOKEN nel .env (Editor role, da sanity.io/manage → API → Tokens)

import { createClient } from '@sanity/client'
import { parse } from 'csv-parse/sync'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const { PUBLIC_SANITY_PROJECT_ID, PUBLIC_SANITY_DATASET, SANITY_API_TOKEN } = process.env

if (!PUBLIC_SANITY_PROJECT_ID || !SANITY_API_TOKEN) {
  console.error('❌ Mancano variabili d\'ambiente. Verifica .env:')
  console.error('   PUBLIC_SANITY_PROJECT_ID, PUBLIC_SANITY_DATASET, SANITY_API_TOKEN')
  process.exit(1)
}

const client = createClient({
  projectId: PUBLIC_SANITY_PROJECT_ID,
  dataset: PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  token: SANITY_API_TOKEN,
  useCdn: false,
})

function toSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

async function uploadImageFromUrl(url, filename) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Impossibile scaricare immagine: ${url}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  const asset = await client.assets.upload('image', buffer, {
    filename,
    contentType: 'image/jpeg',
  })
  return asset._id
}

const csvPath = resolve(process.cwd(), 'products.csv')
const csvContent = readFileSync(csvPath, 'utf-8')
const records = parse(csvContent, {
  columns: true,
  delimiter: ';',
  skip_empty_lines: true,
  trim: true,
})

console.log(`\n🌿 SKINLAB — import ${records.length} prodotti\n`)

let success = 0
let failed = 0

for (const row of records) {
  process.stdout.write(`  → ${row.name}... `)

  try {
    const slug = toSlug(row.name)
    const assetId = await uploadImageFromUrl(row.imageUrl, `${slug}.jpg`)

    await client.createOrReplace({
      _type: 'product',
      _id: `product-${slug}`,
      name: row.name,
      slug: { _type: 'slug', current: slug },
      tagline: row.tagline,
      description: row.description,
      price: parseFloat(row.price),
      category: row.category,
      ingredients: row.ingredients || undefined,
      stripePaymentLink: row.stripePaymentLink || 'https://buy.stripe.com/test_placeholder',
      isBestseller: row.isBestseller === 'true',
      image: {
        _type: 'image',
        asset: { _type: 'reference', _ref: assetId },
      },
    })

    console.log('✓')
    success++
  } catch (err) {
    console.log(`✗ ${err.message}`)
    failed++
  }
}

console.log(`\n${success} importati${failed ? `, ${failed} falliti` : ''}.\n`)
if (success > 0) {
  console.log('✅ Apri Sanity Studio (npm run studio) per verificare.')
  console.log('   Poi lancia npm run build per buildare il sito.\n')
}
