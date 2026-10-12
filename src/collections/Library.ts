import type { CollectionConfig } from 'payload'

import { revalidateLibrary } from '../lib/revalidate'

// The (Anti)library: what is being read, watched or listened to, beside the
// writings. Each entry is someone else's piece, described in its own words,
// with the author's notes on it set apart.
//
// Entries are kept rather than replaced, so this becomes a record over time.
// The Writings page shows the newest by `addedAt`.
export const Library: CollectionConfig = {
  slug: 'library',
  labels: { singular: '(Anti)library entry', plural: '(Anti)library' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'source', 'kind', 'addedAt'],
    group: 'Content',
    description: 'The newest entry is shown beside the latest piece on Writings.',
  },
  defaultSort: '-addedAt',
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  // Writings is prerendered, so a save is invisible until it is regenerated.
  hooks: {
    afterChange: [
      () => {
        void revalidateLibrary()
      },
    ],
    afterDelete: [
      () => {
        void revalidateLibrary()
      },
    ],
  },
  fields: [
    {
      name: 'kind',
      type: 'select',
      required: true,
      defaultValue: 'reading',
      options: [
        { label: 'Reading', value: 'reading' },
        { label: 'Watching', value: 'watching' },
        { label: 'Listening', value: 'listening' },
      ],
      admin: { description: 'The label above the entry.' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'source',
          type: 'text',
          required: true,
          admin: { description: 'Where it was published, e.g. Aeon.' },
        },
        {
          name: 'format',
          type: 'text',
          admin: { description: 'What it is, e.g. Essay. Optional.' },
        },
      ],
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'url',
      type: 'text',
      required: true,
      admin: { description: 'The piece itself. The entry links here.' },
    },
    {
      name: 'standfirst',
      type: 'textarea',
      admin: { description: 'The piece’s own description, as its publisher gives it.' },
    },
    {
      name: 'author',
      type: 'text',
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Your thoughts on it. Leave a blank line between paragraphs.',
      },
    },
    {
      name: 'addedAt',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: {
        position: 'sidebar',
        description: 'The newest entry is the one shown.',
      },
    },
  ],
}
