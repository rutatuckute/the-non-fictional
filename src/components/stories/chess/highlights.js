// Highlighted words: the legend inside the sentence. A phrase in a step's words
// is marked in the colour of the marks it names on the stage, so the reader
// never looks for a key. The words themselves stay in the body untouched; this
// only lists, by step name, which phrase to mark and as what. A phrase the body
// no longer has is simply not marked.
//
// At most one mark a step, two where the sentence sets two things against each
// other; only where the phrase names something on the screen (a mark, a line,
// a bubble, the thread). One style in every part.
//
// Roles, as the stage draws them now:
//   me      clay: my marks              you     green: your guess, your games
//   crowd   slate: their lit marks      faint   mid slate: the rest of them
//   hollow  a slate outline: hidden     meFaint pale clay: me in London
//   other   slate: the typical player   grey    neutral: the estimate, his bubble
//   band    the shaded middle half (an ivory wash)
const HIGHLIGHTS = {
  // Part I: the thread takes the story's clay here (Chess.com and social media unmarked since 28 Nov, owner)
  mine: [["This is mine", "me"]],
  "not-a-player": [["who I am", "me"]],
  // Part II: the London System's squares turn clay on the club board
  "people-intro": [["randomly matched stranger", "crowd"]],
  club: [["the London System", "me"]],

  "say-claim": [["I said", "me"]],
  "say-isolation": [["my past self", "me"]],
  "say-crowd": [["bullet rating is indeed lower", "crowd"]],
  "say-perspective": [["that’s me", "me"]],
  "say-pace": [["5 seconds per move", "me"]],
  "say-hurry": [["9 in 10", "crowd"]],
  "say-others": [["my claim", "me"]],
  "say-guess": [["higher or lower", "you"]],
  "say-giveup": [["quicker to give up", "crowd"]],

  "wrong-observation": [["38 of them straight away", "crowd"]],
  "wrong-decide": [["Would you resign?", "you"]],
  "wrong-guess": [["you think", "you"]],
  "wrong-play": [["13 did not lose", "crowd"]],
  "wrong-saved": [["won their way back", "crowd"], ["the others were still far behind", "faint"]],
  "wrong-payoff": [["Resigning costs about 8 rating points", "faint"]],
  "wrong-taleb": [["Everything above that line is a chance", "crowd"]],
  "wrong-clock": [["From 16 in 100 to 51 in 100", "crowd"]],
  "wrong-levels": [["the more often they resign", "faint"], ["the most likely to be saved", "crowd"]],
  "wrong-mine": [["I saved 14 games", "me"]],
  "wrong-mine-king": [["62 times I did not lose", "me"]],
  "wrong-guess-king": [["you think", "you"]],
  "wrong-play-king": [["27 did not lose", "crowd"]],
  "wrong-meet": [["staying saved the game", "crowd"]],
  "wrong-you": [["I never resign", "me"]],

  "choose-contact": [["Each grey dot", "crowd"], ["I’m more forcing than 93 in 100", "me"]],
  "choose-pace": [["I play fast", "me"]],
  "choose-persistence": [["I keep going", "me"]],
  "choose-habit": [["I repeat myself", "me"]],
  "choose-all": [["The shaded bands", "band"]],
  "choose-split": [["Thirty are what we know about them", "crowd"], ["The other thirty are hidden", "hollow"]],
  "choose-round-1": [["which card is theirs?", "you"]],
  "choose-curve": [["19 times in 100", "other"]],
  "choose-me": [["89 from thirty", "me"]],
  "choose-findme": [["Find me", "me"]],
  "choose-findyou": [["Now you", "you"]],
  "choose-disguise": [["my London games", "meFaint"]],

  // the recaps: her answer, as she says it
  "hub-what-we-say": [["Soooo bad? No: ordinary.", "me"]],
  "hub-when-things-go-wrong": [["I play on.", "me"]],
  "hub-what-we-choose": [["Recognisable, even in disguise.", "me"]],

  // Part IV: his message (the grey bubble), and the reader's own thread
  encounter: [["Hey, do you play chess?", "grey"]],
  yours: [["yours", "you"]],
}

// The body's typography turns ' into ’; a phrase is looked for either way, and
// only in the text between tags, never inside one.
const variants = phrase => [...new Set([phrase, phrase.replace(/'/g, "’"), phrase.replace(/’/g, "'")])]

export const highlight = (name, html, className) => {
  const marks = HIGHLIGHTS[name]
  if (!marks || !html) return html
  let out = html
  for (const [phrase, role] of marks) {
    for (const text of variants(phrase)) {
      // the first occurrence outside a tag
      const re = new RegExp(`(^|>)([^<]*?)(${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`)
      if (!re.test(out)) continue
      out = out.replace(re, (_, open, before, found) => `${open}${before}<mark class="${className(role)}">${found}</mark>`)
      break
    }
  }
  return out
}
