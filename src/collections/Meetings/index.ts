import type { CollectionConfig } from 'payload'

export const Meetings: CollectionConfig = {
  slug: 'meetings',
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'date',
      type: 'date',
      required: true,
    },
    {
      name: 'venue',
      type: 'text',
      required: true,
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Workshop', value: 'workshop' },
        { label: 'Anti-workshop', value: 'anti-workshop' },
      ],
    },
    // Conditional: only for workshops
    {
      name: 'workshopTopic',
      type: 'select',
      options: [
        { label: 'Demo your stack', value: 'demo-your-stack' },
        { label: 'F*ck-up nights', value: 'fuck-up-nights' },
        { label: 'Meet the business', value: 'meet-the-business' },
      ],
      admin: {
        condition: (_, siblingData) => siblingData?.type === 'workshop',
      },
    },
    {
      name: 'presenter',
      type: 'relationship',
      relationTo: 'members',
      hasMany: false,
      admin: {
        condition: (_, siblingData) => siblingData?.type === 'workshop',
      },
    },
    {
      name: 'discussionAgenda',
      type: 'richText',
      admin: {
        condition: (_, siblingData) => siblingData?.type === 'workshop',
      },
    },
  ],
}
