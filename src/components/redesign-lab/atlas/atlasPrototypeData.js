const point = ([x, y]) => `${x} ${y}`

const outerAnchors = {
  west: [114, 300],
  north: [507, 119],
  northEast: [902, 229],
  southEast: [906, 582],
  southWest: [251, 583],
}

const junctions = {
  centralWest: [345, 405],
  centralNorth: [565, 315],
  centralEast: [815, 415],
  centralSouthEast: [720, 565],
  centralSouthWest: [480, 585],
}

export const atlasTopology = {
  viewBox: "0 0 1200 760",
  outerAnchors,
  outerPath: [
    `M ${point(outerAnchors.west)}`,
    "C 92 264 105 220 142 199",
    "C 150 155 192 130 233 137",
    "C 266 96 321 87 367 105",
    `C 410 80 470 88 ${point(outerAnchors.north)}`,
    "C 553 92 617 88 659 117",
    "C 705 105 757 125 784 164",
    `C 832 166 882 188 ${point(outerAnchors.northEast)}`,
    "C 950 226 1000 254 1017 300",
    "C 1062 327 1077 376 1053 416",
    "C 1073 458 1048 507 1009 527",
    `C 994 568 948 591 ${point(outerAnchors.southEast)}`,
    "C 876 621 824 647 778 633",
    "C 744 674 685 691 638 671",
    "C 596 703 533 701 492 672",
    "C 451 693 392 678 366 643",
    `C 315 654 267 624 ${point(outerAnchors.southWest)}`,
    "C 201 580 156 547 149 501",
    "C 105 481 81 438 96 399",
    `C 71 363 80 321 ${point(outerAnchors.west)}`,
    "Z",
  ].join(" "),
  junctions,
  boundaries: [
    {
      id: "systems-power",
      endpoints: ["outerTop", "centralNorth"],
      path: `M ${point(outerAnchors.north)} C 528 174 520 242 ${point(
        junctions.centralNorth
      )}`,
    },
    {
      id: "systems-connection",
      endpoints: ["outerWest", "centralWest"],
      path: `M ${point(outerAnchors.west)} C 195 320 278 355 ${point(
        junctions.centralWest
      )}`,
    },
    {
      id: "power-reality",
      endpoints: ["outerNorthEast", "centralEast"],
      path: `M ${point(outerAnchors.northEast)} C 885 286 850 360 ${point(
        junctions.centralEast
      )}`,
    },
    {
      id: "reality-memory",
      endpoints: ["outerSouthEast", "centralSouthEast"],
      path: `M ${point(outerAnchors.southEast)} C 846 598 775 595 ${point(
        junctions.centralSouthEast
      )}`,
    },
    {
      id: "memory-connection",
      endpoints: ["outerSouthWest", "centralSouthWest"],
      path: `M ${point(outerAnchors.southWest)} C 325 600 410 610 ${point(
        junctions.centralSouthWest
      )}`,
    },
    {
      id: "agency-north-west",
      endpoints: ["centralWest", "centralNorth"],
      path: `M ${point(
        junctions.centralWest
      )} C 390 380 420 355 470 344 C 510 333 536 319 ${point(
        junctions.centralNorth
      )}`,
    },
    {
      id: "agency-north-east",
      endpoints: ["centralNorth", "centralEast"],
      path: `M ${point(
        junctions.centralNorth
      )} C 650 302 720 328 770 372 C 790 389 804 402 ${point(
        junctions.centralEast
      )}`,
    },
    {
      id: "agency-east",
      endpoints: ["centralEast", "centralSouthEast"],
      path: `M ${point(
        junctions.centralEast
      )} C 842 455 830 495 790 530 C 765 550 742 560 ${point(
        junctions.centralSouthEast
      )}`,
    },
    {
      id: "agency-south",
      endpoints: ["centralSouthEast", "centralSouthWest"],
      path: `M ${point(
        junctions.centralSouthEast
      )} C 655 590 610 600 560 600 C 525 600 500 593 ${point(
        junctions.centralSouthWest
      )}`,
    },
    {
      id: "agency-west",
      endpoints: ["centralSouthWest", "centralWest"],
      path: `M ${point(
        junctions.centralSouthWest
      )} C 430 568 395 540 370 500 C 345 465 337 432 ${point(
        junctions.centralWest
      )}`,
    },
  ],
  labels: [
    {
      id: "systems",
      title: ["SYSTEMS &", "UNCERTAINTY"],
      x: 272,
      y: 215,
    },
    {
      id: "power",
      title: ["POWER &", "NARRATIVES"],
      x: 690,
      y: 198,
    },
    {
      id: "agency",
      title: ["AGENCY &", "MECHANISM"],
      x: 575,
      y: 430,
      emphasis: "dominant",
    },
    {
      id: "connection",
      title: ["CONNECTION &", "BELONGING"],
      x: 230,
      y: 458,
    },
    {
      id: "reality",
      title: ["REALITY &", "MODELS"],
      x: 925,
      y: 418,
    },
    {
      id: "memory",
      title: ["MEMORY &", "BECOMING"],
      x: 612,
      y: 640,
    },
  ],
}
