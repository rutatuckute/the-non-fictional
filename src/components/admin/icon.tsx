import React from 'react'

// Shown in the panel's top-left, at nav scale. The mark alone — the wordmark
// does not survive being drawn this small.
export const Icon: React.FC = () => (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    src="/images/logo.png"
    alt="The Non Fictional"
    width={28}
    height={28}
    style={{ objectFit: 'contain' }}
  />
)

export default Icon
