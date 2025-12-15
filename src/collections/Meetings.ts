// src/collections/Meetings.ts
import { CollectionConfig } from 'payload'

const Meetings: CollectionConfig = {
  slug: 'meetings',
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      required: true,
    },
    {
      name: 'date',
      label: 'Date',
      type: 'date',
      required: true,
    },
    {
      name: 'venue',
      label: 'Venue',
      type: 'text',
      required: true,
    },
    {
      name: 'type',
      label: 'Meeting Type',
      type: 'select',
      required: true,
      options: [
        { label: 'Workshop', value: 'workshop' },
        { label: 'Anti-workshop', value: 'anti-workshop' },
      ],
    },

    // Conditional fields:

    {
      name: 'workshopTopic',
      label: 'Workshop Topic',
      type: 'select',
      options: [
        { label: 'Demo your stack', value: 'demo_your_stack' },
        { label: 'F*ck-up nights', value: 'fuckup_nights' },
        { label: 'Meet the business', value: 'meet_the_business' },
      ],
      admin: {
        condition: (data) => data?.type === 'workshop',
      },
    },
    {
      name: 'presenter',
      label: 'Presenter',
      type: 'relationship',
      relationTo: 'members' as any,
      admin: {
        condition: (data) => data?.type === 'workshop',
      },
    },
    {
      name: 'discussionAgenda',
      label: 'Discussion Agenda',
      type: 'richText',
      admin: {
        condition: (data) => data?.type === 'anti-workshop',
      },
    },
  ],
}

export default Meetings
