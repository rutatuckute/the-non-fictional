import type { CollectionConfig } from 'payload'

import { readingMinutes } from '../lib/reading-time'
import { revalidatePost } from '../lib/revalidate'
import { slugify } from '../lib/slug'

// The three forms the writings index knows about. A free-text category is kept
// alongside as a display label, but this is the value that drives filtering —
// the same constraint the old CMS config imposed, for the same reason: four
// posts once ended up classed against a taxonomy nothing rendered.
export const CATEGORY_IDS = ['essays', 'reflections', 'data'] as const

// The order the archive field declares its inquiries in, so every surface names
// them the same way round.
export const INQUIRIES = [
  'systems',
  'reality',
  'agency',
  'power',
  'connection',
  'memory',
] as const

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Writing', plural: 'Writings' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'categoryId', 'inquiry', 'publishedAt'],
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
        // A piece is published at its slug on the site root, so the slug is a
        // real URL and cannot be left to chance.
        if (!data.slug && data.title) {
          data.slug = slugify(data.title)
        }

        // Length is shown on the card and in the article rail. Deriving it here
        // means it can never disagree with the body that is actually stored.
        if (typeof data.body === 'string') {
          data.readingMinutes = readingMinutes(data.body)
        }

        return data
      },
    ],

    // Every page this content appears on is prerendered, so a save is invisible
    // until those pages are regenerated.
    afterChange: [
      ({ doc, previousDoc }) => {
        void revalidatePost(doc?.slug, previousDoc?.slug)
      },
    ],

    afterDelete: [
      ({ doc }) => {
        void revalidatePost(doc?.slug)
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
        description: 'The URL this piece is published at, off the site root.',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      required: true,
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'categoryId',
      type: 'select',
      required: true,
      defaultValue: 'essays',
      options: CATEGORY_IDS.map((value) => ({
        value,
        label: value[0].toUpperCase() + value.slice(1),
      })),
      label: 'Form',
      admin: { position: 'sidebar' },
    },
    {
      name: 'inquiry',
      type: 'select',
      options: INQUIRIES.map((value) => ({
        value,
        label: value[0].toUpperCase() + value.slice(1),
      })),
      admin: { position: 'sidebar' },
    },
    {
      name: 'selected',
      type: 'checkbox',
      admin: {
        position: 'sidebar',
        description: 'Give this piece more weight in the homepage field.',
      },
    },
    {
      name: 'category',
      type: 'text',
      label: 'Category (display label)',
    },
    {
      name: 'topic',
      type: 'text',
    },
    {
      name: 'excerpt',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Shown on the writings index, in search results and in OG cards.',
      },
    },
    {
      name: 'coverImage',
      type: 'text',
      required: true,
      admin: {
        description: 'Path to a file in the repository, e.g. /images/uploads/name.jpg',
      },
    },
    {
      name: 'link',
      type: 'text',
      admin: {
        description: 'Only the data pieces link out to a repository.',
      },
    },
    {
      name: 'tags',
      type: 'array',
      fields: [{ name: 'tag', type: 'text', required: true }],
      admin: { initCollapsed: true },
    },
    {
      // Markdown, and in the older pieces largely raw HTML. It is stored and
      // rendered exactly as written — see src/lib/markdown.ts, which keeps the
      // raw HTML rather than escaping it.
      name: 'body',
      type: 'code',
      required: true,
      admin: {
        language: 'markdown',
        description: 'Markdown. Raw HTML is passed through untouched.',
      },
    },
    {
      name: 'readingMinutes',
      type: 'number',
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Derived from the body on save.',
      },
    },
  ],
}

export default Posts
