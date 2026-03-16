import type { CollectionConfig } from 'payload'

export const FestivalSections: CollectionConfig = {
  slug: 'festivalsections',
  admin: { useAsTitle: 'name' },
  fields: [
    {
      name: 'edition',
      type: 'relationship',
      relationTo: 'festivaleditions',
      hasMany: false,
      required: true,
    },
    { name: 'name', type: 'text', required: true },
  ],
}
