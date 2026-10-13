'use client'

import React from 'react'
import { useRowLabel } from '@payloadcms/ui'

// A collapsed source in the panel reads as the source, not as "Source 03".
type Row = { kind?: string; title?: string; author?: string; year?: string }

const KIND: Record<string, string> = {
  books: 'Book',
  press: 'Article',
  film: 'Film',
  music: 'Music',
  data: 'Research',
}

export const SourceRowLabel: React.FC = () => {
  const { data, rowNumber } = useRowLabel<Row>()
  const title = data?.title?.trim()
  if (!title) return <span>Source {String((rowNumber ?? 0) + 1).padStart(2, '0')}</span>

  const by = [data?.author, data?.year].filter(Boolean).join(', ')
  return (
    <span>
      {KIND[data?.kind || ''] ? `${KIND[data?.kind || '']} · ` : ''}
      {title}
      {by ? ` — ${by}` : ''}
    </span>
  )
}

export default SourceRowLabel
