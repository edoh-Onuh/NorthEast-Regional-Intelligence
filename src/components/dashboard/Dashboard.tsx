"use client";

import { useState } from "react";
import { DOMAINS, metricsForDomain } from "@/lib/catalog";
import type { Checkpoint, ObservationRow } from "@/lib/db/queries";
import { Header } from "./Header";
import { TabNav } from "./TabNav";
import { DomainView } from "./DomainView";
import { ProvenancePanel } from "./ProvenancePanel";
import { Footer } from "./Footer";

interface Props {
  observations: ObservationRow[];
  checkpoints: Checkpoint[];
}

export function Dashboard({ observations, checkpoints }: Props) {
  const [active, setActive] = useState(DOMAINS[0].key);
  const activeDomain = DOMAINS.find((d) => d.key === active) ?? DOMAINS[0];

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <Header />
      <TabNav domains={DOMAINS} active={active} onChange={setActive} />
      <main
        id="main-content"
        role="tabpanel"
        aria-labelledby={`tab-${activeDomain.key}`}
        tabIndex={0}
        className="mx-auto w-full max-w-6xl flex-1 px-3 py-4 focus:outline-none sm:px-6 sm:py-6"
      >
        <DomainView
          domain={activeDomain}
          metrics={metricsForDomain(activeDomain.key)}
          observations={observations}
        />
      </main>
      <ProvenancePanel checkpoints={checkpoints} />
      <Footer />
    </div>
  );
}
