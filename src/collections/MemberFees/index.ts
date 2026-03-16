import type { CollectionConfig } from 'payload'

export const MemberFees: CollectionConfig = {
  slug: 'member-fees',
  admin: {
    useAsTitle: 'member',
  },
  access: {
    read: () => true, // Everyone can read member fee records may need adjusting
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'member',
      type: 'relationship',
      relationTo: 'members',
      hasMany: false,
      required: true,
    },
    {
      name: 'paidByEmail',
      type: 'email',
      required: true,
    },
    {
      name: 'payDate',
      type: 'date',
      required: true,
    },
    {
      name: 'semester',
      type: 'text',
      required: true,
      admin: {
        description: 'Example: Spring 2026, Fall 2026',
      },
    },
    {
      name: 'amount',
      type: 'number',
      required: false,
    },
    {
      name: 'notes',
      type: 'textarea',
      required: false,
    },
  ],
  hooks: {
    beforeValidate: [
      async ({ data, req }) => {
        if (!data || !data.member) {
          return data
        }

        const member = await req.payload.findByID({
          collection: 'members',
          id: data.member,
        })

        if (member && !['founder', 'voting'].includes(member.membershipType)) {
          throw new Error('Cannot create a fee record for a member who does not pay fees')
        }

        return data
      },
    ],
  },
}
