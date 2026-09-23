import type { CollectionConfig } from 'payload'

import { revalidatePhotograph } from '../lib/revalidate'
import { slugify } from '../lib/slug'

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
  hooks: {
    beforeChange: [
      ({ data }) => {
        // A frame has no page of its own, but its slug is still a URL: it is
        // the ?frame= reference the lightbox opens on, and the old per-photo
        // address that redirects there. Left empty by the panel, a frame
        // cannot be linked to at all, so it is derived the way every existing
        // one was — the date it was added, then the title.
        if (!data.slug && data.title) {
          const day = new Date(data.date || Date.now()).toISOString().slice(0, 10)
          data.slug = `${day}-${slugify(data.title)}`
        }

        return data
      },
    ],

    // Every page this content appears on is prerendered, so a save is invisible
    // until those pages are regenerated.
    afterChange: [
      ({ doc, previousDoc }) => {
        void revalidatePhotograph(doc?.slug, previousDoc?.slug)
      },
    ],

    afterDelete: [
      ({ doc }) => {
        void revalidatePhotograph(doc?.slug)
      },
    ],
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
      // Was a path typed by hand, pointing at a file committed to the
      // repository. Adding a frame therefore meant a commit and a deploy before
      // anything could be published, which is the last thing on this site that
      // still needed git.
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        description: 'Drag the frame in, or pick one already uploaded.',
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
      // Superseded by seriesRef below, which points at a series document rather
      // than naming one by slug. Kept, and kept filled, because it is what the
      // frames were migrated in with; nothing reads it any more.
      name: 'series',
      type: 'text',
      admin: {
        hidden: true,
        description:
          'A slug shared by every frame in the series, e.g. ciao-amore. Superseded by the Series relationship.',
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
      // Curation is explicit. Nothing infers a portfolio from recency, rolls,
      // titles or anything else — a frame is in the edit because it was put
      // there.
      name: 'selected',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Show this frame in Selected.',
      },
    },
    {
      // The sequence is the edit. Selected is never sorted by date.
      name: 'selectedOrder',
      type: 'number',
      admin: {
        position: 'sidebar',
        description: 'Position in Selected. Lower comes first. Unset sorts last.',
        condition: (data) => Boolean(data?.selected),
      },
    },
    {
      name: 'seriesRef',
      label: 'Series',
      type: 'relationship',
      relationTo: 'series',
      admin: {
        description: 'The body of work this frame belongs to, if any.',
      },
    },
    {
      name: 'seriesOrder',
      type: 'number',
      admin: {
        position: 'sidebar',
        description: 'Position within the series. Lower comes first. Unset sorts last.',
        condition: (data) => Boolean(data?.seriesRef),
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
