// src/collections/Volunteers.ts
import { CollectionConfig, CollectionSlug } from 'payload'

const Volunteers: CollectionConfig = {
  slug: 'volunteers',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'edition',
      label: 'Festival Edition',
      type: 'relationship',
      relationTo: 'festival-editions' as CollectionSlug,
      required: true,
    },
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
    },
    {
      name: 'photo',
      label: 'Photo',
      type: 'relationship',
      relationTo: 'media',
    },
    {
      name: 'organization',
      label: 'Organization',
      type: 'text',
    },
    {
      name: 'birthDate',
      label: 'Birth Date',
      type: 'date',
    },
    {
      name: 'phone',
      label: 'Phone',
      type: 'text',
    },
    {
      name: 'agreementDocument',
      label: 'Agreement Document',
      type: 'relationship',
      relationTo: 'media',
    },
    {
      name: 'coordinator',
      label: 'Coordinator',
      type: 'relationship',
      relationTo: 'members' as CollectionSlug,
    },
    {
      name: 'userAccount',
      label: 'User Account',
      type: 'relationship',
      relationTo: 'users',
      unique: true,
      required: false,
    },
  ],
}

export default Volunteers
