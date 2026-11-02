import type { Metadata } from "next"

import DataLab from "../../../../components/data-lab/data-lab"
import Masthead from "../../../../components/masthead"
import SiteFooter from "../../../../components/site-footer"

const description =
  "France, observed through data: what is happening, what the data shows, what is changing and what we still don't know."

export const metadata: Metadata = {
  title: "Data Lab",
  description,
  alternates: { canonical: "/projects/data-lab-france/" },
  openGraph: {
    title: "Data Lab",
    description,
    url: "/projects/data-lab-france/",
    type: "website",
  },
}

export default function DataLabPage() {
  return (
    <div className="tw min-h-screen bg-background">
      <Masthead />
      <DataLab />
      <SiteFooter />
    </div>
  )
}
