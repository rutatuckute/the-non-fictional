"use client"

import * as React from "react"

// What the reader has said and chosen in Part III, for this reading only:
// the usernames guessed (scenes.js), the two decisions and two guesses of
// "When things go wrong" (wrong.js), their picks in the recognition game (reveal.js).
// Nothing leaves the page. The hubs (hub.js) read it back to them, in green.

const Reader = React.createContext({ said: {}, tell: () => {} })

export const ReaderProvider = ({ children }) => {
  const [said, setSaid] = React.useState({})
  const tell = React.useCallback((key, value) => setSaid(all => (all[key] === value ? all : { ...all, [key]: value })), [])
  const value = React.useMemo(() => ({ said, tell }), [said, tell])
  return <Reader.Provider value={value}>{children}</Reader.Provider>
}

export const useReader = () => React.useContext(Reader).said

// One reader is expected: the one who sent the message that starts the first question
// (and is revealed in Part IV). Given his Chess.com username, his green dot waits
// beside that message, at both ends. Only a SHA-256 of the lower-cased name is kept
// here, so the public code does not name him.
const HIM = "04b1c1fd95295155febc01ba1660b2bb541305451aa61deecc15310cc8f042d2"
export const useIsHim = () => {
  const name = useReader().chesscom?.username?.toLowerCase() || null
  const [him, setHim] = React.useState(false)
  React.useEffect(() => {
    setHim(false)
    if (!name || !globalThis.crypto?.subtle) return
    let live = true
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(name)).then(buffer => {
      const hex = Array.from(new Uint8Array(buffer), b => b.toString(16).padStart(2, "0")).join("")
      if (live) setHim(hex === HIM)
    })
    return () => { live = false }
  }, [name])
  return him
}

// A section reports what the reader has done, whenever it changes.
export const useTell = (key, value) => {
  const { tell } = React.useContext(Reader)
  React.useEffect(() => tell(key, value), [key, value, tell])
}
