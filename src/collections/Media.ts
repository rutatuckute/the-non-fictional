import type { CollectionConfig } from 'payload'

// Where the files are served from. R2 is written to over the S3 API, but read
// over a custom domain in front of the bucket — the bucket's own r2.dev address
// is rate limited and documented as unsuitable for production.
export const MEDIA_BASE = (
  process.env.NEXT_PUBLIC_MEDIA_URL || 'https://images.thenonfictional.com'
).replace(/\/$/, '')

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'File', plural: 'Media' },
  admin: {
    group: 'Content',
    useAsTitle: 'filename',
    description:
      'Files uploaded from the panel, stored in R2. A photograph points at one of these rather than carrying a path.',
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  upload: {
    mimeTypes: ['image/*'],

    // What scripts/optimize-images.cjs did to a file on its way into the
    // repository, done here instead, on its way into the bucket: longest edge
    // 2560, re-encoded at 82, EXIF rotation applied and metadata dropped. It is
    // a ceiling rather than a target — the optimizer generates every size the
    // site actually serves from this master, so anything larger is weight that
    // is never read.
    resizeOptions: {
      width: 2560,
      height: 2560,
      fit: 'inside',
      withoutEnlargement: true,
    },
    formatOptions: {
      format: 'jpeg',
      options: { quality: 82, mozjpeg: true },
    },

    // Payload's own thumbnail for the list and the edit view. Generated from
    // the master and stored alongside it.
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 400,
        fit: 'inside',
        withoutEnlargement: true,
        formatOptions: { format: 'jpeg', options: { quality: 70, mozjpeg: true } },
      },
    ],
    adminThumbnail: 'thumbnail',
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      admin: {
        description:
          'Only for images that carry meaning on their own. A frame in the lightbox is described by its title, so this can be left empty.',
      },
    },
  ],
}
