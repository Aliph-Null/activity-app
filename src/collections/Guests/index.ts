import type { CollectionConfig } from 'payload'

export const Guests: CollectionConfig = {
  slug: 'guests',
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
    { name: 'organization', type: 'text' },
    {
      name: 'guestType',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Speaker', value: 'speaker' },
        { label: 'Workshop Holder', value: 'workshop_holder' },
        { label: 'Exhibitor', value: 'exhibitor' },
      ],
    },
    { name: 'bio', type: 'richText' },
    { name: 'photo', type: 'relationship', relationTo: 'media', hasMany: false },
    { name: 'website', type: 'text' },
  ],
}
