// src/collections/Schedule.ts
import { CollectionConfig, CollectionSlug } from 'payload'

interface ScheduleDocument {
  edition: string
  startTime: string
  endTime: string
  activity: string
  location: string
  // Payload augments documents with other metadata (id, createdAt, etc.)
  [key: string]: any
}

interface RelationshipField {
  name: string
  label: string
  type: 'relationship'
  relationTo: CollectionSlug
  required?: boolean
}

interface DateField {
  name: string
  label: string
  type: 'date'
  required?: boolean
}

type ScheduleField = RelationshipField | DateField

const Schedule: CollectionConfig = {
  slug: 'schedule',
  admin: {
    useAsTitle: 'activity',
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
      name: 'startTime',
      label: 'Start Time',
      type: 'date',
      required: true,
    },
    {
      name: 'endTime',
      label: 'End Time',
      type: 'date',
      required: true,
    },
    {
      name: 'activity',
      label: 'Activity',
      type: 'relationship',
      relationTo: 'activities' as CollectionSlug,
      required: true,
    },
    {
      name: 'location',
      label: 'Location',
      type: 'relationship',
      relationTo: 'locations' as CollectionSlug,
      required: true,
    },
  ] as ScheduleField[],
}

export default Schedule
