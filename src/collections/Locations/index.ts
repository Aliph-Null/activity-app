import type { CollectionConfig } from 'payload'

export const Locations: CollectionConfig = {
  slug: 'locations',
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
    { name: 'address', type: 'text' },
    { name: 'coordinates', type: 'point' },
    { name: 'description', type: 'richText' },
    { name: 'floorPlan', type: 'relationship', relationTo: 'media', hasMany: false },
    { name: 'capacity', type: 'number' },
    { name: 'facilities', type: 'array', fields: [{ name: 'facility', type: 'text' }] },
    { name: 'photos', type: 'relationship', relationTo: 'media', hasMany: true },
    { name: 'coordinator', type: 'relationship', relationTo: 'volunteers', hasMany: false },
  ],
}
