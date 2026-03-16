import type { CollectionConfig } from 'payload'

export const Activities: CollectionConfig = {
  slug: 'activities',
  admin: { useAsTitle: 'title' },
  fields: [
    {
      name: 'edition',
      type: 'relationship',
      relationTo: 'festivaleditions',
      hasMany: false,
      required: true,
    },
    { name: 'title', type: 'text', required: true },
    { name: 'description', type: 'richText' },
    {
      name: 'type',
      type: 'select',
      options: [
        { label: 'Expo', value: 'expo' },
        { label: 'Talk', value: 'talk' },
        { label: 'Workshop', value: 'workshop' },
        { label: 'Social', value: 'social' },
        { label: 'Entertainment', value: 'entertainment' },
      ],
    },
    { name: 'audience', type: 'array', fields: [{ name: 'audienceType', type: 'text' }] },
    { name: 'guests', type: 'relationship', relationTo: 'guests', hasMany: true },
    { name: 'section', type: 'relationship', relationTo: 'festivalsections', hasMany: false },
  ],
}
