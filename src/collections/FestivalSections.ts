// src/collections/FestivalSections.ts
import { CollectionConfig } from 'payload'

const FestivalSections: CollectionConfig = {
  slug: 'festival-sections',
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
      label: 'Section Name',
      type: 'text',
      required: true,
    },
  ],
}

export default FestivalSections
