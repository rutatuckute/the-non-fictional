"use client"

import * as React from "react"

// What the reader has said and chosen in Part III, for this reading only:
// the usernames guessed (scenes.js), the two decisions and two guesses of
// "When things go wrong" (wrong.js), the three scale guesses (reveal.js).
// Nothing leaves the page. The hubs (hub.js) read it back to them, in green.

const Reader = React.createContext({ said: {}, tell: () => {} })

export const ReaderProvider = ({ children }) => {
  const [said, setSaid] = React.useState({})
  const tell = React.useCallback((key, value) => setSaid(all => (all[key] === value ? all : { ...all, [key]: value })), [])
  const value = React.useMemo(() => ({ said, tell }), [said, tell])
  return <Reader.Provider value={value}>{children}</Reader.Provider>
}

export const useReader = () => React.useContext(Reader).said

// A section reports what the reader has done, whenever it changes.
export const useTell = (key, value) => {
  const { tell } = React.useContext(Reader)
  React.useEffect(() => tell(key, value), [key, value, tell])
}
