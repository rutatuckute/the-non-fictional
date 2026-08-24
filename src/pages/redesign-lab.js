import * as React from "react"

import * as styles from "./redesign-lab.module.css"

const RedesignLabPage = () => (
  <main className={styles.page}>
    <p className={styles.label}>THE NON FICTIONAL — REDESIGN LAB</p>
  </main>
)

export default RedesignLabPage

export const Head = () => (
  <>
    <title>Redesign Lab | The Non Fictional</title>
    <meta name="robots" content="noindex,nofollow" />
  </>
)
