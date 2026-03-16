import type { CollectionConfig } from 'payload'

export const Volunteers: CollectionConfig = {
  slug: 'volunteers',
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
    { name: 'photo', type: 'relationship', relationTo: 'media', hasMany: false },
    { name: 'organization', type: 'text' },
    { name: 'birthDate', type: 'date' },
    { name: 'phone', type: 'text' },
    { name: 'agreementDocument', type: 'relationship', relationTo: 'media', hasMany: false },
    { name: 'coordinator', type: 'relationship', relationTo: 'members', hasMany: false },
    { name: 'userAccount', type: 'relationship', relationTo: 'users', hasMany: false },
  ],
}
