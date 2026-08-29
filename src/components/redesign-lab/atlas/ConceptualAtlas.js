import * as React from "react"

import { atlasTopology } from "./atlasPrototypeData"
import * as styles from "./conceptual-atlas.module.css"

const TITLE_LINE_HEIGHT = 24

const ConceptualAtlas = () => (
  <section className={styles.atlasStage} aria-label="Conceptual atlas region">
    <svg
      className={styles.atlas}
      viewBox={atlasTopology.viewBox}
      preserveAspectRatio="xMidYMid meet"
      aria-label="Conceptual atlas"
      role="img"
      focusable="false"
    >
      <g data-layer="geography">
        <path
          className={styles.outerLandmass}
          data-element="outer-landmass"
          d={atlasTopology.outerPath}
        />

        <g data-layer="boundaries">
          {atlasTopology.boundaries.map(boundary => (
            <path
              key={boundary.id}
              className={styles.internalBoundary}
              data-boundary={boundary.id}
              d={boundary.path}
            />
          ))}
        </g>
      </g>

      <g className={styles.labels} data-layer="territory-titles">
        {atlasTopology.labels.map(label => (
          <text
            key={label.id}
            className={`${styles.territoryTitle} ${
              label.emphasis === "dominant" ? styles.dominantTitle : ""
            }`}
            x={label.x}
            y={label.y}
            textAnchor="middle"
          >
            {label.title.map((line, index) => (
              <tspan
                key={line}
                x={label.x}
                dy={index === 0 ? 0 : TITLE_LINE_HEIGHT}
              >
                {line}
              </tspan>
            ))}
          </text>
        ))}
      </g>
    </svg>
  </section>
)

export default ConceptualAtlas
