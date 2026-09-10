"use client";

import { useEffect, useState } from "react";
import type { AgentMark } from "./agent-orb";
import { Composer } from "./composer";
import { RunView } from "./run-view";

/**
 * What the page is, before and after a run exists.
 *
 * Before: one bar in the middle of the screen, because there is exactly one thing to do.
 * After: three panels, because there are now three things to watch and none of them is the
 * bar — the agent has the task, and until it asks something there is nothing more to type.
 * The bar does not shrink into a corner and sit there; it goes, and the run takes the room.
 *
 * The run id lives in the URL. A run outlives the tab that started it — it is a machine
 * somewhere spending money — so a reload, or a link sent to someone else, should arrive at
 * the run rather than at an empty prompt.
 */
type Started = { id: string; agentLabel: string; mark: AgentMark };

export function Workspace() {
  const [run, setRun] = useState<Started | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("job");
    if (id) setRun({ id, agentLabel: "the agent", mark: "openai" });
  }, []);

  function start(next: Started) {
    setRun(next);
    const url = new URL(window.location.href);
    url.searchParams.set("job", next.id);
    window.history.replaceState(null, "", url);
  }

  if (run) return <RunView jobId={run.id} agentLabel={run.agentLabel} mark={run.mark} />;
  return <Composer onStarted={start} />;
}
