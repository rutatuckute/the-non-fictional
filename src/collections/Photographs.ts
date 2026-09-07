import type { CollectionConfig } from 'payload'

// Frames are grouped into these on the photography page's Type chips.
export const PHOTO_TYPES = ['portraits', 'strangers', 'scenes', 'lights'] as const

export const Photographs: CollectionConfig = {
  slug: 'photographs',
  labels: { singular: 'Photograph', plural: 'Photography' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'location', 'year', 'roll', 'series'],
    group: 'Content',
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description:
          'Frames have no page of their own. This is the ?frame= reference the lightbox opens on, and the old per-photo URL that redirects to it.',
      },
    },
    {
      name: 'photo',
      type: 'text',
      required: true,
      admin: {
        description: 'Path to a file in the repository, e.g. /images/uploads/name.jpg',
      },
    },
    {
      name: 'location',
      type: 'text',
      admin: {
        description:
          'City first, country last, comma separated — "Holbox, Quintana Roo, Mexico". The Place and Lived filters are derived from it.',
      },
    },
    {
      name: 'year',
      type: 'text',
      admin: { position: 'sidebar' },
    },
    {
      name: 'roll',
      type: 'number',
      admin: {
        position: 'sidebar',
        description:
          'Frames are ordered by year and then by roll, newest first. A frame left without one still appears, after the numbered frames for its year.',
      },
    },
    {
      name: 'type',
      type: 'select',
      options: PHOTO_TYPES.map((value) => ({
        value,
        label: value[0].toUpperCase() + value.slice(1),
      })),
      admin: { position: 'sidebar' },
    },
    {
      name: 'series',
      type: 'text',
      admin: {
        description:
          'A slug shared by every frame in the series, e.g. ciao-amore. Its display name is derived from this, so adding or renaming a frame cannot shift it.',
      },
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'tags',
      type: 'array',
      fields: [{ name: 'tag', type: 'text', required: true }],
      admin: { initCollapsed: true },
    },
  ],
}

export default Photographs
