// Slugs are URLs on this site, so they stay ASCII and lower case. Diacritics
// are folded rather than dropped: "Laumės" becomes "laumes", not "laum-s".
//
// Only new entries authored in the admin panel are slugified. The slugs that
// already exist keep whatever form they were published under — four frames
// carry diacritics in the URL itself, and those URLs are indexed.
export const slugify = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
