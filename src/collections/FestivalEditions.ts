// src/collections/FestivalEditions.ts
import { CollectionConfig } from 'payload'

const FestivalEditions: CollectionConfig = {
  slug: 'festival-editions',
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'year',
      label: 'Year',
      type: 'number',
      required: true,
    },
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      required: true,
    },
    {
      name: 'theme',
      label: 'Theme',
      type: 'text',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'richText',
    },
  ],
}

export default FestivalEditions
