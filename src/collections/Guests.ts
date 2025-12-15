// src/collections/Guests.ts
import { CollectionConfig } from 'payload'

const Guests: CollectionConfig = {
  slug: 'guests',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'edition',
      label: 'Festival Edition',
      type: 'relationship',
      relationTo: 'festival-editions' as any,
      required: true,
    },
    {
      name: 'name',
      label: 'Guest Name',
      type: 'text',
      required: true,
    },
    {
      name: 'organization',
      label: 'Organization',
      type: 'text',
    },
    {
      name: 'guestType',
      label: 'Guest Type',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Speaker', value: 'speaker' },
        { label: 'Workshop Holder', value: 'workshop_holder' },
        { label: 'Exhibitor', value: 'exhibitor' },
      ],
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
      name: 'website',
      label: 'Website',
      type: 'text',
      admin: {
        placeholder: 'https://example.com',
      },
      validate: (value: string | null | undefined) => {
        if (!value) return true
        try {
          new URL(value)
          return true
        } catch {
          return 'Invalid URL'
        }
      },
    },
  ],
}

export default Guests
