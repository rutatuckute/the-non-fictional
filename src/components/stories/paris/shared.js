import styles from "./paris.module.css"

// The popup the article's script makes, in the site's type.
export const Popup = ({ name, mechanical, ebike, docks }) => (
  <>
    <p className={styles.popName}>{name}</p>
    <dl className={styles.popRows}>
      <div><dt>Mechanical bikes</dt><dd>{mechanical}</dd></div>
      <div><dt>E-bikes</dt><dd>{ebike}</dd></div>
      <div><dt>Free docks</dt><dd>{docks}</dd></div>
    </dl>
  </>
)
