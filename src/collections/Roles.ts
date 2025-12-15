// src/collections/Roles.ts
import { CollectionConfig } from 'payload'

const Roles: CollectionConfig = {
  slug: 'roles',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    // accesele pot fi ajustate după nevoie; pentru moment permit citirea publică (schimbă în funcție de cerințe)
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      label: 'Role Name',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      required: false,
    },
    {
      name: 'priority',
      label: 'Priority',
      type: 'number',
      required: false,
      defaultValue: 0,
      admin: {
        description: 'Lower number = higher priority (optional)',
      },
    },
  ],
}

export default Roles
