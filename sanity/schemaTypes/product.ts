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
