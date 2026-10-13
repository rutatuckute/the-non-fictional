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

// What a piece draws on, by kind. The labels are what the article's Library
// heads each group with; the values are what the pieces' old source icons
// stood for.
export const SOURCE_KINDS = [
  { value: 'books', label: 'Books' },
  { value: 'press', label: 'Articles' },
  { value: 'film', label: 'Film' },
  { value: 'music', label: 'Music' },
  { value: 'data', label: 'Research' },
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
      // Was a path typed by hand, pointing at a file committed to the
      // repository — so a new cover meant a commit and a deploy, the same thing
      // the photographs moved away from. It is an upload now, stored in R2.
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        description: 'Drag the cover in, or pick one already uploaded. Shown at 3:2.',
      },
    },
    {
      // Superseded by cover above. Kept, and still read as a fallback, until
      // scripts/migrate-covers.ts has linked every post to an upload and the
      // covers are confirmed to be serving from the bucket; a later migration
      // drops it, as 20260919_170858_drop_photo_path did for the frames.
      name: 'coverImage',
      type: 'text',
      admin: {
        hidden: true,
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
      // The Library: shown at the top of the article's left column, grouped
      // by kind in the order SOURCE_KINDS gives.
      name: 'sources',
      type: 'array',
      label: 'Library',
      labels: { singular: 'Source', plural: 'Sources' },
      admin: {
        initCollapsed: true,
        description: 'What the piece draws on. Shown beside it, grouped by kind.',
        components: { RowLabel: '/src/components/admin/source-row-label#SourceRowLabel' },
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'kind',
              type: 'select',
              required: true,
              defaultValue: 'books',
              options: SOURCE_KINDS.map((kind) => ({ ...kind })),
              admin: { width: '30%' },
            },
            { name: 'title', type: 'text', required: true, admin: { width: '70%' } },
          ],
        },
        { name: 'url', type: 'text', label: 'Link' },
        {
          type: 'row',
          fields: [
            { name: 'author', type: 'text', admin: { width: '40%' } },
            { name: 'year', type: 'text', admin: { width: '20%' } },
            {
              name: 'publisher',
              type: 'text',
              admin: { width: '40%', description: 'Journal, publisher or series. Optional.' },
            },
          ],
        },
      ],
    },
    {
      // A note beside the piece: on the right, under its contents, while it is
      // read; at the end of it on a phone.
      name: 'sideNote',
      type: 'group',
      label: 'Side note',
      admin: { description: 'Optional. Shown on the right, under the contents.' },
      fields: [
        {
          name: 'label',
          type: 'text',
          admin: { placeholder: 'Note', description: 'The small heading. "Note" when left empty.' },
        },
        { name: 'text', type: 'textarea', admin: { description: 'Leave a blank line between paragraphs.' } },
      ],
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
