// Photographs are ordinary files in the repository under /images/uploads/.
// Nothing is processed at build time: Next's image optimizer resizes them on
// demand and caches the result at the edge, which is the same arrangement the
// site had on Netlify's Image CDN, with a different optimizer behind it.
const QUALITY = { lightest: 50, lighter: 58, normal: 70 } as const

export type Quality = keyof typeof QUALITY

// The optimizer will only serve a width it has been configured to allow, and
// this ladder is the one declared in next.config.mjs. A request for any other
// width is snapped up to the next rung rather than being rejected — rounding
// down would visibly soften a frame, so the only direction is up, and the
// largest rung is the ceiling.
const WIDTHS = [
  16, 32, 48, 64, 96, 128, 160, 256, 300, 384, 420, 560, 640, 750, 760, 828,
  1080, 1200, 1680, 1920, 2048, 2560,
]

export const snapWidth = (px: number): number =>
  WIDTHS.find((width) => width >= px) ?? WIDTHS[WIDTHS.length - 1]

// `px` is the pixel budget, not the CSS size — pass roughly twice the displayed
// width so a frame stays sharp on a 2x screen. Quality is aggressive for small
// thumbnails and eased off for anything shown large, where compression
// artefacts start to show on film grain.
//
// No format is requested. Next negotiates one from the browser's Accept header
// and next.config.mjs restricts that to WebP, for the reasons recorded there.
export const imageUrl = (
  source: string | null | undefined,
  px: number,
  quality: Quality = 'lightest',
): string => {
  if (!source) return ''

  // Vectors have nothing to resize, and putting one through the optimizer only
  // rasterises it.
  if (source.endsWith('.svg')) return source

  const q = QUALITY[quality] ?? 70

  // The trailing slash on /_next/image/ is deliberate. trailingSlash is on for
  // this site, and it applies to the optimizer endpoint too: asking for
  // /_next/image?... answers 308 to /_next/image/?... and every frame on the
  // page pays an extra round trip. Asking for the redirected form directly
  // costs nothing and skips the hop.
  return `/_next/image/?url=${encodeURIComponent(source)}&w=${snapWidth(px)}&q=${q}`
}
