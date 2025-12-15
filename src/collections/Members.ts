// src/collections/Members.ts
import { CollectionConfig } from 'payload'

const Members: CollectionConfig = {
  slug: 'members',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'user',
      label: 'User Account',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      unique: true, // 1-to-1
    },
    {
      name: 'type',
      label: 'Member Type',
      type: 'select',
      required: true,
      options: [
        { label: 'Aspirant', value: 'aspirant' },
        { label: 'Voting', value: 'voting' },
      ],
    },
    {
      name: 'subType',
      label: 'Sub-type',
      type: 'select',
      options: [
        { label: 'Founder', value: 'founder' },
        { label: 'Honorary', value: 'honorary' },
      ],
      admin: {
        condition: (data) => data?.type === 'voting',
      },
    },
    {
      name: 'name',
      label: 'Full Name',
      type: 'text',
      required: true,
    },
    {
      name: 'organization',
      label: 'Organization',
      type: 'text',
    },
    {
      name: 'photo',
      label: 'Photo',
      type: 'relationship',
      relationTo: 'media',
      required: false,
    },
  ],
}

export default Members
