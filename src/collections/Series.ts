import type { CollectionConfig } from 'payload'

import { slugify } from '../lib/slug'

// A body of work. Kept apart from the photographs themselves because a series
// has properties of its own — where it sits on the index, which frame stands
// for it — that belong to the series rather than to any one frame in it.
//
// Membership and sequence stay on the photograph: which series it belongs to,
// and where it falls inside it.
export const Series: CollectionConfig = {
  slug: 'series',
  labels: { singular: 'Series', plural: 'Series' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'order'],
    group: 'Content',
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (!data.slug && data.title) {
          data.slug = slugify(data.title)
        }

        return data
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: { description: 'Shown on the series index and at the top of the series page.' },
    },
    {
      name: 'cover',
      type: 'relationship',
      relationTo: 'photographs',
      admin: {
        description:
          'The frame that stands for this series on the index. Left empty, the first frame by order is used.',
      },
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description:
          'The URL this series is published at, under /photography/series/. Taken from the title when left empty.',
      },
    },
    {
      // Deliberately not alphabetical and deliberately not automatic: the order
      // the bodies of work are shown in is an editorial decision.
      name: 'order',
      type: 'number',
      admin: {
        position: 'sidebar',
        description: 'Position on the series index. Lower comes first. Unset sorts last.',
      },
    },
  ],
}
