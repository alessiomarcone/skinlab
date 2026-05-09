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
