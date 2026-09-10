/**
 * Everything Kleeto has, in one answer.
 *
 * An agent used to be told which lane and which image to use, which meant the prompt decided
 * the job and the agent only typed. That is the wrong shape twice over: the person asking
 * rarely knows whether their task needs a browser or a full desktop, and an agent that is told
 * cannot notice that the thing it was told is wrong.
 *
 * So this exists to be read first. It is deliberately verbose in the places a model has to
 * make a decision — what each family of machine can actually be asked to do, what an image
 * carries, what a second costs — and silent about anything it cannot act on. Nothing here is
 * hand-maintained prose about capabilities: the actions come from the same table the control
 * endpoint dispatches on, the prices from the same catalogue the 402 is quoted from, so this
 * cannot drift from what the machines will really do.
 */
import { ACTIONS } from "./gateway/control.mjs";
import { imageCatalogue } from "./images.mjs";

/** What a family of machine is for, in the terms a task is described in. */
const FAMILIES = {
  browser: {
    is: "one real Chrome tab, driven over the devtools protocol",
    use: "reading or filling in a website that has no API, when nothing needs to be installed and no file has to be opened",
    cannot: "run programs, hold files, or show anything that is not a web page",
    watch: "a live view of the tab, and a replay afterwards",
  },
  machine: {
    is: "a headless Linux box with a shell and a filesystem",
    use: "running code, building things, moving files, anything that needs no screen",
    cannot: "click, type into a window, or show a desktop; there is no display at all",
    watch: "nothing to look at — the evidence is the files it produces and the receipt",
  },
  desktop: {
    is: "a full Linux desktop with a screen, mouse and keyboard, and applications already installed",
    use: "driving real applications through their own interfaces — the ones with no API",
    cannot: "be rushed; a desktop restores from a prepared image in about 45 seconds",
    watch: "a live view of the screen a person can watch while it works",
  },
};

/** Read a lane's own numbers into the sentence a decision is actually made on. */
const laneLine = (l, usdPerHbar) => ({
  lane: l.id,
  kind: l.family,
  vcpu: l.vcpu ?? null,
  memGiB: l.memGiB ?? null,
  resolution: l.resolution ?? null,
  stealth: Boolean(l.stealth),
  captcha: Boolean(l.captcha),
  ...(l.mbCeiling ? { mbCeiling: l.mbCeiling } : {}),
  usdPerHour: l.usdPerHour,
  tinybarPerSecond: l.creditTinybar,
  /* the same price said in the unit a person thinks in, because "0.0000045 USD per second"
     is not a number anyone can weigh a decision against */
  tenMinutesUsd: +(l.usdPerHour / 6).toFixed(4),
  actions: ACTIONS[l.family] ?? [],
  ...(l.family === "desktop" ? { imagesApply: true } : {}),
  ...(l.family === "browser" && l.stealth
    ? { note: "residential proxy and automatic CAPTCHA. Costs about nineteen times the fast browser per second. Escalate to this after a 403, not by default." }
    : {}),
});

export function discovery({ cat, network, assets = ["USDC", "HBAR"] }) {
  const lanes = Object.values(cat.lanes).map((l) => laneLine(l, cat.usdPerHbar));
  const images = imageCatalogue();
  const ready = images.filter((i) => i.ready);

  return {
    what: "Kleeto rents real computers by the second. You pay for them from your own Hedera wallet by answering a 402; there is no account and no API key.",
    network,
    usdPerHbar: cat.usdPerHbar,
    assets,

    /* the decision, framed as a decision rather than as a list */
    choosing: {
      question: "What does the task actually need to touch?",
      browser: FAMILIES.browser,
      machine: FAMILIES.machine,
      desktop: FAMILIES.desktop,
      rule: "Pick the smallest thing that can do the job. A desktop can do everything a machine can and costs more; a browser cannot run code at all.",
    },

    lanes,
    images: images.map((i) => ({
      image: i.image, label: i.label, owns: i.owns, apps: i.apps, ready: i.ready,
      appliesTo: "desktop lanes only",
    })),
    imagesReady: ready.map((i) => i.image),

    /** How money works here, in the order it happens. */
    paying: {
      order: [
        "kleeto_topup — answer Kleeto's 402 from your wallet. This buys credit on your session; it is the only step that moves money.",
        "kleeto_rent — take a machine. The meter draws that credit down one second at a time.",
        "kleeto_meter — how many seconds have burned and what is left.",
        "kleeto_receipt — the hash-chained proof of every second charged.",
        "kleeto_return — hand it back. Unused credit stays on the session.",
      ],
      metering: "You are charged for the seconds you hold a machine, not for the time you reserved. Returning early is refunded by simply not being charged.",
      ifCreditRuns_out: "The lease pauses rather than dying. Top up and it resumes.",
      settlement: "Every top-up settles on Hedera and returns a transaction id anyone can look up on hashscan.",
    },

    /** What talking to the person watching looks like, since that is now part of the job. */
    conversation: {
      kleeto_say: "Tell the watcher something. Use it when you learn something that changes what you are about to spend.",
      kleeto_ask: "Ask the person a question and wait for their answer. Nothing else happens until they reply.",
      kleeto_plan: "Propose what you are going to do, what it will cost, and which machine you will take. The run does not start until they approve it.",
      order: "Read this document, say what you could do with it, ask what you need to know, then propose a plan. Rent nothing before the plan is approved.",
    },
  };
}
