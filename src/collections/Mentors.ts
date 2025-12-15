// src/collections/Mentors.ts
import { CollectionConfig } from 'payload'

const Mentors: CollectionConfig = {
  slug: 'mentors',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
    },
    {
      name: 'bio',
      label: 'Bio',
      type: 'richText',
    },
    {
      name: 'photo',
      label: 'Photo',
      type: 'relationship',
      relationTo: 'media',
    },
    {
      name: 'userAccount',
      label: 'User Account',
      type: 'relationship',
      relationTo: 'users',
      unique: true,
      required: false, // optional 1-to-1
    },
  ],
}

export default Mentors
