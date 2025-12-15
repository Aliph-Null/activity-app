// src/collections/Locations.ts
import { CollectionConfig } from 'payload'

const Locations: CollectionConfig = {
  slug: 'locations',
  admin: {
    useAsTitle: 'name',
    description: 'Festival locations with details, capacity, photos and coordinator',
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
      label: 'Location Name',
      type: 'text',
      required: true,
    },
    {
      name: 'address',
      label: 'Address',
      type: 'text',
    },
    {
      name: 'coordinates',
      label: 'Coordinates',
      type: 'point',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'richText',
    },
    {
      name: 'floorPlan',
      label: 'Floor Plan',
      type: 'relationship',
      relationTo: 'media',
    },
    {
      name: 'capacity',
      label: 'Capacity',
      type: 'number',
      admin: {
        description: 'Maximum number of attendees',
      },
    },
    {
      name: 'facilities',
      label: 'Facilities',
      type: 'array',
      minRows: 0,
      maxRows: 20,
      fields: [
        {
          name: 'facility',
          label: 'Facility',
          type: 'text',
        },
      ],
    },
    {
      name: 'photos',
      label: 'Photos',
      type: 'relationship',
      relationTo: 'media',
      hasMany: true,
    },
    {
      name: 'coordinator',
      label: 'Coordinator',
      type: 'relationship',
      relationTo: 'volunteers' as any,
      unique: true, // 1-to-1 relationship
    },
  ],
}

export default Locations
