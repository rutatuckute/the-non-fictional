import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Photographs } from './collections/Photographs'
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
    },
  },

  collections: [Posts, Photographs, Users],

  // Bodies are stored as markdown, so the rich text editor is only here because
  // Payload requires a default one. Nothing on this site renders Lexical.
  editor: lexicalEditor(),

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
