import type { CollectionConfig } from 'payload'

export const Ninjas: CollectionConfig = {
  slug: 'ninjas',
  admin: {
    useAsTitle: 'childName',
  },
  fields: [
    {
      name: 'childName',
      type: 'text',
      required: true,
    },
    {
      name: 'age',
      type: 'number',
      required: true,
    },
    {
      name: 'usefulInfo',
      type: 'textarea',
    },
    {
      name: 'guardianName',
      type: 'text',
      required: true,
    },
    {
      name: 'guardianEmail',
      type: 'email',
      required: true,
    },
    {
      name: 'guardianPhone',
      type: 'text',
    },
    {
      name: 'safetyAgreement',
      type: 'checkbox',
      required: true,
    },
    {
      name: 'photoReleaseAgreement',
      type: 'checkbox',
      required: true,
    },
  ],
}
