import type { CollectionConfig } from 'payload'

export const FestivalEditions: CollectionConfig = {
  slug: 'festivaleditions',
  admin: { useAsTitle: 'title' },
  fields: [
    { name: 'year', type: 'number', required: true },
    { name: 'title', type: 'text', required: true },
    { name: 'theme', type: 'text' },
    { name: 'description', type: 'richText' },
  ],
}
