import type { AgentMark } from "./agent-orb";

/**
 * Who each model is, for the page.
 *
 * The gateway sends the label and the mark next to the model definition, which is where they
 * belong — but a run opened from a link knows only the model's id until the first frame of the
 * thread arrives, and an older gateway sends no mark at all. This is the local copy that keeps
 * the header from saying "the agent" while the answer is in flight.
 */
export const AGENT_META: Record<string, { label: string; mark: AgentMark }> = {
  "gpt-6-astra": { label: "GPT-6 Astra", mark: "openai" },
  "glm-5.3-flash": { label: "GLM-5.3-Flash", mark: "zai" },
  "kimi-k3": { label: "Kimi K3", mark: "moonshot" },
  "minimax-m3": { label: "MiniMax-M3", mark: "minimax" },
};
