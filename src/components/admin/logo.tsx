import React from 'react'

// Shown on the login screen. Payload renders this large and centred, so it
// carries the wordmark as well as the mark — the same pairing, and the same
// tracking, the site's masthead uses.
export const Logo: React.FC = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      color: '#ffa500',
      fontFamily: 'Montserrat, system-ui, sans-serif',
      fontSize: '1.5rem',
      fontWeight: 900,
      letterSpacing: '-0.025em',
      lineHeight: 1,
    }}
  >
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src="/images/logo.png" alt="" width={56} height={56} style={{ objectFit: 'contain' }} />
    <span>The Non Fictional</span>
  </div>
)

export default Logo
