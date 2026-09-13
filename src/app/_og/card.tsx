import { readFile } from 'fs/promises'
import path from 'path'

import { ImageResponse } from 'next/og'

import { site } from '../../lib/site'

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'

// Satori cannot instance a variable font, so a static cut of each weight is
// committed beside this file. They are read off disk rather than fetched —
// fetch() does not take a file: URL — and next.config.mjs traces them into the
// deployed function explicitly, since nothing in the bundle references them by
// path.
const fontFile = (name: string) => path.join(process.cwd(), 'src', 'app', '_og', name)

const loadFonts = async () => {
  const [extrabold, medium] = await Promise.all([
    readFile(fontFile('bricolage-extrabold.ttf')),
    readFile(fontFile('bricolage-medium.ttf')),
  ])

  return [
    { name: 'Bricolage', data: extrabold, weight: 800 as const, style: 'normal' as const },
    { name: 'Bricolage', data: medium, weight: 500 as const, style: 'normal' as const },
  ]
}

const VOID = '#0b0a09'
const INK = '#eee8df'
const MUTED = '#9b958b'
const BRAND = '#ffa500'
const RULE = '#2b2926'

// One card for every share of this site: the section it came from, the title,
// and the site's own name under a rule. The accent bar down the left is the
// same orange the archive field uses for a selected work.
export const ogCard = async ({
  kicker,
  title,
  meta,
}: {
  kicker: string
  title: string
  meta?: string
}) => {
  const fonts = await loadFonts()

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: VOID,
          fontFamily: 'Bricolage',
          position: 'relative',
        }}
      >
        <div style={{ width: 16, height: '100%', background: BRAND, display: 'flex' }} />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '72px 80px',
            flex: 1,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                display: 'flex',
                fontSize: 26,
                fontWeight: 500,
                letterSpacing: 6,
                textTransform: 'uppercase',
                color: BRAND,
              }}
            >
              {kicker}
            </div>

            <div
              style={{
                display: 'flex',
                marginTop: 32,
                fontSize: title.length > 70 ? 62 : 78,
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: -2,
                color: INK,
              }}
            >
              {title}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {meta ? (
              <div
                style={{
                  display: 'flex',
                  fontSize: 26,
                  fontWeight: 500,
                  color: MUTED,
                  marginBottom: 28,
                }}
              >
                {meta}
              </div>
            ) : null}

            <div style={{ display: 'flex', height: 1, background: RULE, width: '100%' }} />

            <div
              style={{
                display: 'flex',
                marginTop: 28,
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', fontSize: 30, fontWeight: 800, color: INK }}>
                {site.title}
              </div>
              <div style={{ display: 'flex', fontSize: 24, fontWeight: 500, color: MUTED }}>
                {site.author.name}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts },
  )
}
