// Upstream adapter. One lane -> one real machine.
//
// The provider SDK is the engine because PTY, stateful code execution, git and file watching
// ride a control WebSocket that REST does not expose. Lifecycle (create/kill/list) would work
// over REST alone, but running two clients doubles the failure surface for no gain.
//
// Contract notes that cost real time to discover:
//   * connect() is REQUIRED before any control-channel call (files, runCode, pty, git, env).
//     Plain runCommand() is the documented exception - it rides a warm HTTP path.
//   * SandboxClient.connect(id) does NOT resume a paused machine; DesktopClient.connect(id)
//     does. We always call resume() explicitly rather than relying on the difference.
//   * record:true is desktop-kind AND built-in-template only. Combined with fromSnapshot or a
//     custom tpl_ id the provider hands back a playback URL that 404s forever.
//   * The SDK reads no environment variables. apiKey and baseUrl are always passed.
import { SandboxClient, TemplateClient, VolumeClient, Image } from "@solarisdk/sandbox";
import { DesktopClient } from "@solarisdk/desktop";
import { createHash } from "node:crypto";

const BASE = "https://api.getsolari.com";

/** Hash bytes we already hold, so a buyer can recompute an artifact hash locally. */
export const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

/** Merkle root over an artifact list: constant 32 bytes on HCS no matter how many files. */
export function artifactRoot(artifacts) {
  if (!artifacts.length) return null;
  let level = artifacts
    .map((a) => createHash("sha256").update(`${a.sha256}:${a.bytes}:${a.path}`).digest());
  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      next.push(createHash("sha256")
        .update(Buffer.concat([level[i], level[i + 1] ?? level[i]])).digest());
    }
    level = next;
  }
  return level[0].toString("hex");
}

/** Emitted inside the guest: filenames may contain tabs/newlines, so never parse delimited text. */
const ARTIFACT_SCRIPT = `
import json, hashlib, os, sys
out = []
for dp, _, fns in os.walk(sys.argv[1]):
    for fn in fns:
        p = os.path.join(dp, fn)
        try:
            h = hashlib.sha256()
            with open(p, "rb") as f:
                for c in iter(lambda: f.read(1 << 20), b""):
                    h.update(c)
            out.append({"path": p, "sha256": h.hexdigest(), "bytes": os.path.getsize(p)})
        except OSError:
            pass
out.sort(key=lambda a: a["path"])
print(json.dumps(out))
`.trim();

export class SolariAdapter {
  constructor({ apiKey, baseUrl = BASE } = {}) {
    if (!apiKey) throw new Error("SolariAdapter requires an apiKey");
    const opts = { apiKey, baseUrl };
    this.apiKey = apiKey;          // the browser pool is REST-only, no SDK client for it
    this.baseUrl = baseUrl;
    this.sandboxes = new SandboxClient(opts);
    this.desktops = new DesktopClient(opts);
    this.templates = new TemplateClient(opts);
    this.volumes = new VolumeClient(opts);
  }

  /**
   * Bring a lane up. `fromSnapshot` forks a prepared machine instead of booting a template,
   * which is how "pay once to warm it, then fan out" works.
   */
  async provision(lane, {
    timeoutMs, metadata, volumes, fromSnapshot, template, record = false,
  } = {}) {
    const desktop = lane.family === "desktop";
    const common = {
      cpu: lane.vcpu,
      memMb: lane.memGiB * 1024,
      timeoutMs,
      // The gateway owns the meter. A machine that outlives its lease is unbilled delivery.
      lifecycle: { onTimeout: "kill" },
      ...(metadata ? { metadata } : {}),
      ...(volumes?.length ? { volumes } : {}),
      ...(fromSnapshot ? { fromSnapshot } : {}),
    };
    let handle;
    if (desktop) {
      // Recording only survives a golden-template boot; asking for it on a fork yields a dead
      // link, so refuse rather than hand back a URL that will never resolve.
      const canRecord = record && !fromSnapshot && !String(template ?? "").startsWith("tpl_");
      if (record && !canRecord) {
        throw new Error("record:true requires a built-in template and no fromSnapshot");
      }
      // createDesktop() goes through the unified /sandboxes route, which accepts diskGb.
      // The legacy /desktops route does not, and its default overlay leaves only ~560 MB free
      // on the office template - not enough to install anything substantial.
      handle = await this.sandboxes.createDesktop({
        ...common,
        template: template ?? "office",
        resolution: lane.resolution,
        diskGb: lane.diskGb ?? 20,
        ...(canRecord ? { record: true } : {}),
      });
    } else {
      handle = await this.sandboxes.create({
        ...common, template: template ?? "base", diskGb: lane.diskGb ?? 10,
      });
    }
    // Deliberately NOT connecting here. Plain runCommand rides a warm HTTP path that needs no
    // control channel, and a snapshot-restored machine serves that path while its channel is
    // still settling - connecting eagerly turns a working fork into a 1005 close.
    return new Lease(handle, { desktop, startedAt: Date.now() });
  }

  /** Re-attach to a machine we already paid for; resumes it if it was paused. */
  async attach(sandboxId, { desktop = false } = {}) {
    const handle = desktop
      ? await this.desktops.connect(sandboxId)
      : await this.sandboxes.connect(sandboxId);
    if (!desktop) { try { await handle.resume(); } catch { /* already running */ } }
    // Deliberately NOT connecting here. Plain runCommand rides a warm HTTP path that needs no
    // control channel, and a snapshot-restored machine serves that path while its channel is
    // still settling - connecting eagerly turns a working fork into a 1005 close.
    return new Lease(handle, { desktop, startedAt: Date.now() });
  }

  /** Machines this key currently holds. The sweep that catches leases we failed to tear down. */
  async running() {
    const out = [];
    for await (const s of this.sandboxes.listAll({ state: "running" })) out.push(s);
    return out;
  }

  /* ---------------------------------------------------------------- browsers ---- */
  /**
   * A real Chrome on the fast pool, driven over CDP. The SDK has no browser client, so this
   * is the REST route the pool actually exposes. The stealth pool is not offered here: it has
   * never had capacity on this key, and `browser-max` goes to the other supplier instead.
   */
  async browser({ pool = "fast", timeoutMs = 600_000 } = {}) {
    const r = await fetch(`${this.baseUrl}/sessions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ...(pool === "fast" ? {} : { stealth: true }), timeoutMs }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.sessionId) {
      throw new Error(`browser session ${r.status}: ${JSON.stringify(j).slice(0, 160)}`);
    }
    return j;
  }

  async killBrowser(sessionId) {
    await fetch(`${this.baseUrl}/sessions/${sessionId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${this.apiKey}` },
    }).catch(() => {});
  }

  /* ----------------------------------------------------------------- volumes ---- */
  createVolume(name, opts = {}) { return this.volumes.create({ name, ...opts }); }
  listVolumes() { return this.volumes.list(); }
  deleteVolume(id) { return this.volumes.delete(id); }

  /* --------------------------------------------------------------- templates ---- */
  /**
   * Build a reusable lane image. Local files cannot be uploaded, so anything the image needs
   * must be fetched from inside the build.
   */
  async buildTemplate(name, { kind = "sandbox", from = "ubuntu:22.04", apt = [], pip = [], run = [], env, workdir } = {}) {
    let img = Image.base(from).kind(kind);
    if (apt.length) img = img.aptInstall(apt);
    if (pip.length) img = img.pipInstall(pip);
    for (const cmd of run) img = img.runCommands(cmd);
    if (env) img = img.env(env);
    if (workdir) img = img.workdir(workdir);
    return this.templates.build(img, { name });
  }
  templateStatus(id) { return this.templates.get(id); }
  listTemplates() { return this.templates.list(); }
}

/** A live machine. Everything the gateway does to a lane goes through here. */
export class Lease {
  constructor(handle, { desktop, startedAt }) {
    this.h = handle;
    this.desktop = desktop;
    this.startedAt = startedAt;
    this.id = handle.sandboxId ?? handle.sessionId;
    this.streamUrl = handle.streamUrl ?? null;
  }

  /**
   * Open the control channel on demand, with backoff.
   * Only some calls need it - runCommand does not - and a machine restored from a snapshot
   * takes tens of seconds before its channel is stable, so connecting eagerly at provision
   * time turns a healthy fork into a connection error.
   */
  async channel({ tries = 5 } = {}) {
    if (this.h.connected) return;
    let last;
    for (let i = 0; i < tries; i++) {
      try { await this.h.connect(); return; }
      catch (e) { last = e; await new Promise((r) => setTimeout(r, 1000 * (i + 1))); }
    }
    throw last;
  }

  /* -------------------------------------------------------------- commands ---- */
  run(cmd, args = [], opts = {}) { return this.h.runCommand(cmd, { args, ...opts }); }

  async sh(line) {
    // bash, not sh: the guest's /bin/sh is dash, which has no `set -o pipefail`. pipefail
    // matters because without it `apt-get install … | tail -2` reports tail's exit code, so a
    // failed install reads as success and only surfaces later as "command not found".
    // Observed exactly that with a Blender install.
    const r = await this.h.runCommand("bash", { args: ["-o", "pipefail", "-c", line] });
    // 141 = 128 + SIGPIPE. With pipefail on, a benign `… | head -1` makes the upstream process
    // die of SIGPIPE and the pipeline reports 141. A genuine apt/build failure reports its own
    // code (100, 1, 2 …), so 141 alone is not an error worth failing the step over.
    if (r.exitCode !== 0 && r.exitCode !== 141) {
      throw new Error(`command failed (${r.exitCode}): ${(r.stderr || r.stdout || "").slice(0, 300)}`);
    }
    return r.stdout;
  }

  /** Long-running process with streamed output. */
  start(cmd, opts = {}) { return this.h.startCommand(cmd, opts); }

  /* ------------------------------------------------------------------- pty ---- */
  /** A real terminal, for the web UI. Returns a handle with write/resize/onData. */
  async pty(opts = { cols: 100, rows: 30 }) { await this.channel(); return this.h.createPty(opts); }

  /* -------------------------------------------------------------- code REPL ---- */
  /**
   * Stateful execution: variables and imports persist between calls. matplotlib figures come
   * back as base64 PNG, and on templates that support it as structured chart data too.
   */
  async runCode(code, opts = { language: "python" }) { await this.channel(); return this.h.runCode(code, opts); }
  async codeContext(opts) { await this.channel(); return this.h.createCodeContext(opts); }

  /* ----------------------------------------------------------------- files ---- */
  async writeFile(path, contents) {
    const b64 = Buffer.from(contents).toString("base64");
    await this.sh(`mkdir -p "$(dirname '${path}')" && printf %s '${b64}' | base64 -d > '${path}'`);
    return { path, bytes: Buffer.byteLength(contents) };
  }
  async readFile(path) {
    return Buffer.from((await this.sh(`base64 -w0 '${path}'`)).trim(), "base64");
  }

  /** The receipt primitive: every file produced, hashed inside the machine. */
  async artifacts(dir) {
    const b64 = Buffer.from(ARTIFACT_SCRIPT).toString("base64");
    const out = await this.sh(
      `printf %s '${b64}' | base64 -d > /tmp/.kleeto-art.py && python3 /tmp/.kleeto-art.py '${dir}'`
    );
    const list = JSON.parse(out);
    return { artifacts: list, root: artifactRoot(list) };
  }

  /* --------------------------------------------------------------- desktop ---- */
  async screenshot(opts) { await this.channel(); return this.h.screenshot(opts); }
  async openApp(name, args = []) { await this.channel(); return this.h.open(name, args); }
  async health() { await this.channel(); return this.h.health(); }

  /* ----------------------------------------------------------------- ports ---- */
  previewUrl(port) { return this.h.previewUrl(port); }

  /**
   * Run something that takes minutes. The one-shot exec path has a server-side timeout well
   * under an apt install of a large package, and it fails opaquely with "exec failed" - so
   * long work runs detached behind a marker file that we poll.
   */
  async runLong(line, { pollMs = 10_000, timeoutMs = 1_800_000, onTick } = {}) {
    const tag = `k${Date.now().toString(36)}`;
    const sh = `/tmp/${tag}.sh`, log = `/tmp/${tag}.log`, done = `/tmp/${tag}.done`;
    // The script is shipped base64-encoded so no quoting of the caller's command is needed.
    const b64 = Buffer.from(line).toString("base64");
    // Grouping matters: `nohup cmd > log; echo $? > done &` backgrounds only the echo, so the
    // real work runs in the foreground and the exec times out. The whole compound must be one
    // backgrounded subshell, with stdin closed and stdout redirected, or the exec never returns
    // because the pipe stays open.
    await this.sh(
      `printf %s '${b64}' | base64 -d > ${sh}; ` +
      `( bash -o pipefail ${sh} > ${log} 2>&1 < /dev/null; echo $? > ${done} ) & ` +
      `disown; echo launched`
    );
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      await new Promise((r) => setTimeout(r, pollMs));
      const st = await this.run("bash", ["-c", `cat ${done} 2>/dev/null || echo RUNNING; tail -1 ${log} 2>/dev/null`]);
      const [first, ...rest] = st.stdout.split("\n");
      if (first.trim() !== "RUNNING") {
        const out = await this.run("bash", ["-c", `cat ${log}`]);
        const code = Number(first.trim());
        if (code !== 0) throw new Error(`long command failed (${code}): ${out.stdout.slice(-400)}`);
        return out.stdout;
      }
      onTick?.(rest.join(" ").trim());
      if (Date.now() > deadline) throw new Error("long command timed out");
    }
  }

  /* ------------------------------------------------------------ checkpoints ---- */
  /** Save state without stopping. The machine keeps running. */
  snapshot(name) { return this.h.snapshot(name); }
  /** Rewind this same machine; its id does not change. */
  revert(snapshotId) { return this.h.revert(snapshotId); }

  /* ------------------------------------------------------------- lifecycle ---- */
  /**
   * Park it: RAM+disk saved, upstream billing stops, the slot frees.
   * pause() closes the control channel and rejects everything in flight, and resume() mints a
   * FRESH controlUrl - so a resumed lease must reconnect before any control-channel call, or
   * the next one fails with "Control channel closed" from a stack that points at pause().
   */
  async pause() {
    const r = await this.h.pause();
    this.paused = true;
    return r;
  }

  async resume() {
    const r = await this.h.resume();
    await this.channel();
    this.paused = false;
    return r;
  }
  setTimeout(ms) { return this.h.setTimeout(ms); }
  metrics() { return this.h.metrics().catch(() => null); }

  /** Seconds we will bill for. Ceil: a partial second was still held. */
  heldSeconds() { return Math.ceil((Date.now() - this.startedAt) / 1000); }

  async terminate() {
    const seconds = this.heldSeconds();
    try { await this.h.kill(); } finally { try { this.h.close(); } catch {} }
    return { seconds };
  }
}
