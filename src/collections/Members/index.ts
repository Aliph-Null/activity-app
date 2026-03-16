import type { CollectionConfig } from 'payload'

export const Members: CollectionConfig = {
  slug: 'members',
  admin: {
    useAsTitle: 'user',
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      unique: true,
    },
    {
      name: 'membershipType',
      type: 'select',
      required: true,
      options: [
        { label: 'Aspirant', value: 'aspirant' },
        { label: 'Membru cu drept de vot', value: 'voting' },
      ],
    },
    {
      name: 'votingStatus',
      type: 'select',
      admin: {
        condition: (_, siblingData) => siblingData?.membershipType === 'voting',
      },
      options: [
        { label: 'Standard', value: 'standard' },
        { label: 'Fondator', value: 'founder' },
        { label: 'De onoare', value: 'honorary' },
      ],
    },
    {
      name: 'paysFee',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        condition: (_, siblingData) => siblingData?.votingStatus !== 'honorary',
      },
    },
  ],
}
