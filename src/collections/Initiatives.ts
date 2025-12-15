import { CollectionConfig } from 'payload'

interface Initiative {
  title: string
  description?: unknown
  image?: unknown
  siteLink?: string
}

interface UrlValidator {
  (value: unknown): true | string
}

const Initiatives: CollectionConfig = {
  slug: 'initiatives',
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      label: 'Title',
      type: 'text' as const,
      required: true,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'richText' as const,
      required: false,
    },
    {
      name: 'image',
      label: 'Image',
      type: 'relationship' as const,
      relationTo: 'media' as const,
      required: false,
    },
    {
      name: 'siteLink',
      label: 'Website Link',
      type: 'text' as const,
      admin: {
        placeholder: 'https://example.com',
      },
      validate: (value: unknown): true | string => {
        if (!value) return true
        try {
          new URL(String(value))
          return true
        } catch {
          return 'Invalid URL'
        }
      },
    },
  ],
}

export default Initiatives
