import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { s3Storage } from '@payloadcms/storage-s3'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Media, MEDIA_BASE } from './collections/Media'
import { Photographs } from './collections/Photographs'
import { Series } from './collections/Series'
import { Posts } from './collections/Posts'
import { Users } from './collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname, '..'),
    },
    meta: {
      titleSuffix: ' · The Non Fictional',
      icons: [{ rel: 'icon', url: '/favicon.ico' }],
    },

    // The site has no light mode. Payload still offers the user a toggle; this
    // only decides where the panel starts.
    theme: 'dark',

    // Paths resolve against importMap.baseDir above, which is the repo root.
    components: {
      graphics: {
        Logo: '/src/components/admin/logo#Logo',
        Icon: '/src/components/admin/icon#Icon',
      },
    },
  },

  collections: [Posts, Photographs, Series, Media, Users],

  // Bodies are stored as markdown, so the rich text editor is only here because
  // Payload requires a default one. Nothing on this site renders Lexical.
  editor: lexicalEditor(),

  plugins: [
    // Uploads go to Cloudflare R2, which speaks the S3 API. Reads do not come
    // back this way: the bucket is fronted by images.thenonfictional.com, and
    // generateFileURL is what puts that host on a stored file rather than the
    // signed endpoint the adapter would otherwise hand out.
    s3Storage({
      collections: {
        media: true,
      },
      bucket: process.env.R2_BUCKET || '',
      config: {
        region: 'auto',
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
        },
      },
    }),
  ],

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
    // Resolved from this file rather than the working directory, so `payload
    // migrate` finds the same migrations whether it is run by npm, by the
    // Vercel build, or from anywhere else.
    migrationDir: path.resolve(dirname, 'migrations'),

    // The schema is only ever changed by a migration, in development as well as
    // in production. The default is to push changes straight to the database in
    // dev, which leaves a marker that makes the next `payload migrate` stop and
    // ask whether to risk data loss — a prompt nothing answers inside a build.
    // Turning it off costs one `payload migrate:create` per schema change and
    // makes every environment behave the same way.
    push: false,
  }),

  secret: process.env.PAYLOAD_SECRET || '',

  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  sharp,

  // The site is generated at build time and the panel is the only writer, so
  // there is no browser on another origin to allow.
  cors: [],
  csrf: [],
})
