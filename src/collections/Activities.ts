// src/collections/Activities.ts
import { CollectionConfig, CollectionSlug } from 'payload'

const Activities: CollectionConfig = {
  slug: 'activities',
  admin: {
    useAsTitle: 'title',
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
      name: 'title',
      label: 'Title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'richText',
    },
    {
      name: 'type',
      label: 'Activity Type',
      type: 'select',
      options: [
        { label: 'Expo', value: 'expo' },
        { label: 'Talk', value: 'talk' },
        { label: 'Workshop', value: 'workshop' },
        { label: 'Social', value: 'social' },
        { label: 'Entertainment', value: 'entertainment' },
      ],
    },
    {
      name: 'audience',
      label: 'Audience',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Kids', value: 'kids' },
        { label: 'Teens', value: 'teens' },
        { label: 'Adults', value: 'adults' },
        { label: 'Everyone', value: 'everyone' },
      ],
    },
    {
      name: 'guests',
      label: 'Guests',
      type: 'relationship',
      relationTo: 'guests' as CollectionSlug,
      hasMany: true,
    },
    {
      name: 'section',
      label: 'Section',
      type: 'relationship',
      relationTo: 'festival-sections' as CollectionSlug,
    },
  ],
}

export default Activities
