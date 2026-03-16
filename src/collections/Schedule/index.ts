import type { CollectionConfig } from 'payload'

export const Schedule: CollectionConfig = {
  slug: 'schedule',
  admin: { useAsTitle: 'startTime' },
  fields: [
    {
      name: 'edition',
      type: 'relationship',
      relationTo: 'festivaleditions',
      hasMany: false,
      required: true,
    },
    { name: 'startTime', type: 'date', required: true },
    { name: 'endTime', type: 'date', required: true },
    { name: 'activity', type: 'relationship', relationTo: 'activities', hasMany: false },
    { name: 'location', type: 'relationship', relationTo: 'locations', hasMany: false },
  ],
}
