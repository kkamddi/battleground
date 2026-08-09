import type { Metadata } from "next";
import PlayersPage, { metadata as playersMetadata } from "./players/page";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  ...playersMetadata,
  alternates: { canonical: "/" },
  openGraph: {
    ...playersMetadata.openGraph,
    url: "/",
  },
};

export default PlayersPage;
