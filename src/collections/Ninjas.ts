// src/collections/Ninjas.ts
import { CollectionConfig } from 'payload'

const Ninjas: CollectionConfig = {
  slug: 'ninjas',
  admin: {
    useAsTitle: 'childName',
  },
  fields: [
    {
      name: 'childName',
      label: 'Child Name',
      type: 'text',
      required: true,
    },
    {
      name: 'age',
      label: 'Age',
      type: 'number',
      required: true,
      min: 5,
      max: 18,
    },
    {
      name: 'usefulInfo',
      label: 'Useful Information',
      type: 'textarea',
    },
    {
      name: 'guardianName',
      label: 'Guardian Name',
      type: 'text',
      required: true,
    },
    {
      name: 'guardianEmail',
      label: 'Guardian Email',
      type: 'email',
      required: true,
    },
    {
      name: 'guardianPhone',
      label: 'Guardian Phone',
      type: 'text',
    },
    {
      name: 'safetyAgreement',
      label: 'Safety Agreement Accepted',
      type: 'checkbox',
      required: true,
    },
    {
      name: 'photoReleaseAgreement',
      label: 'Photo Release Agreement Accepted',
      type: 'checkbox',
      required: true,
    },
  ],
}

export default Ninjas
