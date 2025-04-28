import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    // tokenExpiration: 2592000, // 30 days
    // maxLoginAttempts: 10,
    // verify: false, // Require email verification before being allowed to authenticate
    // lockTime: 600000, // 10 minutes,
    // cookies: {
    //   sameSite: 'Lax',
    //   secure: true,
    //   domain: process.env.COOKIE_DOMAIN,
    // },
  },
  fields: [
    {
      name: 'otp',
      type: 'group',
      access: {
        read: () => true, // will be handelend only using custom endpoint and localApi
        update: () => false, // will be handelend only using custom endpoint and localApi
        create: () => false, // will be handelend only using custom endpoint and localApi
      },
      fields: [
        {
          name: 'code',
          type: 'text',
        },
        {
          name: 'expiry',
          type: 'date',
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
      ],
    },
  ],
}
