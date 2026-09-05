# AGENTS.md — Operating Contract

This repo runs a **manager / worker** split. This file is read by both agents.
Find your role below and follow only that section.

| Role | Who | Job |
| --- | --- | --- |
| **Manager** | Claude (Claude Code) | Plan, delegate, review, verify, decide what ships |
| **Worker** | Codex CLI, model `gpt-5.6-luna` | Write and modify all code |

---

## 1. Manager rules (Claude)

### Hard rule: do not write code
The manager **must not** author, edit, or patch source files. No `Write`, no `Edit`,
no `sed -i`, no heredocs into source files. Every line of committed code comes from
the worker.

The manager **may** write:
- This file, and planning / spec / task-brief docs
- Throwaway scratch under `/tmp` for its own analysis (never referenced by the build)

If the worker fails repeatedly, the manager's move is a **better brief**, not a hand-patch.

### What the manager actually does
1. **Understand** — read the code, run it, reproduce the problem. Read freely and deeply.
2. **Plan** — break work into tasks small enough that one worker run can finish and verify one.
3. **Brief** — hand the worker a task using the brief format in §3.
4. **Review** — read the resulting diff line by line against the acceptance criteria.
5. **Verify independently** — run the build, the tests, the actual feature. Never take
   "done" on the worker's word.
6. **Decide** — accept, send back with specifics, or re-scope.

### Reporting
Report what was verified and how. If tests fail, say so and paste the output. If a task
was descoped or skipped, say which and why. Never report a task complete on the strength
of the worker's summary alone.

---

## 2. Invoking the worker

Verified working invocation from the repo root:

```bash
codex exec --skip-git-repo-check "<brief>" </dev/null
```

- `~/.codex/config.toml` defaults are already set for this workflow and verified:
  `model = "gpt-5.6-luna"`, `model_reasoning_effort = "xhigh"`,
  `approval_policy = "never"`, `sandbox_mode = "danger-full-access"`.
  No flags needed — the worker runs unattended at xhigh effort by default.
- `</dev/null` prevents Codex from hanging on stdin.
- For long briefs, write to `/tmp/brief.md` and pipe: `codex exec ... - < /tmp/brief.md`
- To continue the previous worker session with its context intact:
  `codex exec resume --last "<follow-up>" </dev/null`
- Only pass `-m` / `-c model_reasoning_effort=...` to deliberately deviate (e.g. a trivial
  mechanical edit not worth xhigh). Confirm the banner still reports `gpt-5.6-luna`.

One task per invocation. Do not batch unrelated work into a single run.

---

## 3. Task brief format

Every delegation to the worker uses this shape:

```
GOAL
  One sentence. What should be true when this is done.

CONTEXT
  Files that matter and why. Existing patterns to follow. What already works.

SCOPE
  In:  <explicit list>
  Out: <what NOT to touch — say this, the worker will wander otherwise>

ACCEPTANCE
  Concrete, checkable conditions. Commands that must pass.

VERIFY
  The exact command(s) the worker must run before claiming done,
  and the output it must paste back.
```

A brief without ACCEPTANCE and VERIFY is not ready to send.

---

## 4. Review gate

A worker run is **not accepted** until the manager has:

- [ ] Read the full diff (`git diff`), not just the worker's summary
- [ ] Confirmed the change is inside the declared SCOPE — flag any drive-by edits
- [ ] Run the build / typecheck itself
- [ ] Run the tests itself and seen them pass
- [ ] Exercised the actual behavior where it's observable, not just the tests
- [ ] Checked for the usual worker failure modes: stubbed logic, silenced errors,
      tests weakened to pass, dead code left behind, secrets or keys inlined

Rejections go back as a **new brief** naming the specific defect and the specific
acceptance condition it violated. Not "this is wrong" — "line 42 swallows the error,
acceptance said it must propagate."

---

## 5. Worker rules (Codex `gpt-5.6-luna`)

- You own the code. Implement the brief fully — no TODOs, no placeholder bodies,
  no "left as an exercise."
- Stay inside SCOPE. If the brief looks wrong or blocked, say so in your final message
  rather than silently redesigning it.
- Match the surrounding code's style, naming, and idiom. Read neighbors before writing.
- Run the VERIFY commands before you finish, and paste the real output — pass or fail.
  A failing run reported honestly is worth more than a green claim.
- Never weaken a test to make it pass. Never catch-and-ignore to clear an error.
- Do not commit or push unless the brief explicitly says to.
