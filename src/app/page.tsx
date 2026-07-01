import { Dashboard } from "@/components/dashboard/Dashboard";
import { getAllObservations, getCheckpoints } from "@/lib/db/queries";
import { SetupNotice } from "@/components/dashboard/SetupNotice";
import type { Checkpoint, ObservationRow } from "@/lib/db/queries";

export const revalidate = 300;

async function loadDashboardData(): Promise<
  { ok: true; observations: ObservationRow[]; checkpoints: Checkpoint[] } | { ok: false; error: string }
> {
  try {
    const [observations, checkpoints] = await Promise.all([getAllObservations(), getCheckpoints()]);
    return { ok: true, observations, checkpoints };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export default async function Home() {
  const data = await loadDashboardData();

  if (!data.ok) {
    return <SetupNotice error={data.error} />;
  }

  return <Dashboard observations={data.observations} checkpoints={data.checkpoints} />;
}
