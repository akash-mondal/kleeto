/**
 * The agents a job can be given to.
 *
 * Two things decide whether a model belongs here. It must accept images, because an agent that
 * cannot see a screenshot cannot drive a desktop; and it must have paid a real 402 through the
 * Kleeto MCP, which every one below has, on testnet, verified on the mirror node.
 *
 * Reasoning levels are not a shared scale. Astra offers five, GLM and Kimi offer three with no
 * middle, and MiniMax offers a toggle and nothing else. Presenting one slider across all four
 * would be a lie about three of them, so each carries its own levels and its own default.
 */
export const AGENTS = {
  "gpt-6-astra": {
    label: "GPT-6 Astra",
    /** The vendor's own mark, drawn as dots above the prompt. */
    mark: "openai",
    runner: "codex",
    model: "gpt-6-astra",
    /** Codex's own scale, stopping at xhigh: `max` is not offered on a shared demo machine,
        where one run thinking without limit is one run nobody else can start. */
    efforts: ["low", "medium", "high", "xhigh"],
    defaultEffort: "medium",
    images: true,
    context: 1_050_000,
    note: "Strongest on desktop work. The default.",
    verified: "drove KiCad, Blender and DBeaver end to end",
  },
  "glm-5.3-flash": {
    label: "GLM-5.3-Flash",
    mark: "zai",
    runner: "cline",
    model: "cline-pass/glm-5.3-flash",
    /** No middle setting exists upstream, so none is offered. */
    efforts: ["low", "high", "max"],
    defaultEffort: "high",
    images: true,
    context: 1_310_720,
    price: { in: 0.075, out: 0.25 },
    note: "Cheapest by far. Weaker on GTK dialogs than on coordinate clicks.",
    verified: "0.0.7162784@1789061243.109746984",
  },
  "kimi-k3": {
    label: "Kimi K3",
    mark: "moonshot",
    runner: "cline",
    model: "cline-pass/kimi-k3",
    efforts: ["low", "high", "max"],
    defaultEffort: "high",
    images: true,
    context: 1_048_576,
    price: { in: 3, out: 15 },
    note: "Largest output budget. Priciest here, and its own vendor calls it unstable.",
    verified: "0.0.7162784@1789061554.766339304",
  },
  "minimax-m3": {
    label: "MiniMax-M3",
    mark: "minimax",
    runner: "cline",
    model: "cline-pass/minimax-m3",
    /** Upstream exposes a toggle rather than levels; on and off is the honest rendering. */
    efforts: ["off", "on"],
    defaultEffort: "on",
    images: true,
    context: 1_048_576,
    price: { in: 0.3, out: 1.2 },
    note: "Reasoning is on or off here, not a scale.",
    verified: "0.0.7162784@1789061572.534322855",
  },
};

export const DEFAULT_AGENT = "gpt-6-astra";

/** Reject an effort the model does not actually have, rather than silently substituting. */
export function resolveAgent(id, effort) {
  const agent = AGENTS[id ?? DEFAULT_AGENT];
  if (!agent) throw new Error(`unknown agent ${id}; expected ${Object.keys(AGENTS).join(", ")}`);
  const chosen = effort ?? agent.defaultEffort;
  if (!agent.efforts.includes(chosen)) {
    throw new Error(`${agent.label} has no "${chosen}" setting; it offers ${agent.efforts.join(", ")}`);
  }
  return { id: id ?? DEFAULT_AGENT, ...agent, effort: chosen };
}

/** The menu, without the runner details a caller has no use for. */
export const agentCatalogue = () =>
  Object.entries(AGENTS).map(([id, a]) => ({
    id, label: a.label, efforts: a.efforts, defaultEffort: a.defaultEffort,
    context: a.context, price: a.price ?? null, note: a.note, mark: a.mark,
    default: id === DEFAULT_AGENT,
  }));
