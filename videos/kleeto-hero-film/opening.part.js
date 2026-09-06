      /* Geometry is measured, never guessed: the wire is drawn between the real centres
         of the boxes, and packets travel along exactly that line. */
      const LIFT = 104;   // packets ride above the rail, clear of every box and label
      /* Offset geometry, not getBoundingClientRect: the wires are measured a frame or two
         into the nodes' entrance tween, and a rect includes that tween's transform, which
         drew every connector about fourteen pixels below the boxes it was joining. */
      function centre(nodeId) {
        const box = document.querySelector("#" + nodeId + " .box");
        let x = 0, y = 0, el = box;
        while (el && el.id !== "root") { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; }
        const r = { width: box.offsetWidth, height: box.offsetHeight };
        return { x: x + r.width / 2, y: y + r.height / 2, r };
      }
      function wire(pathId, fromId, toId, inset) {
        const a = centre(fromId), b = centre(toId);
        const pad = inset ?? a.r.width / 2 + 16;
        document.getElementById(pathId)
          .setAttribute("d", "M " + (a.x + pad) + " " + a.y + " L " + (b.x - pad) + " " + b.y);
        return { a, b };
      }
      /** Park a packet centred over its source node, ready to fly. */
      function park(packetId, fromId) {
        const a = centre(fromId);
        const p = document.getElementById(packetId);
        const pr = { width: p.offsetWidth, height: p.offsetHeight };
        const at = { x: a.x - pr.width / 2, y: a.y - pr.height / 2 - LIFT };
        gsap.set(p, at);
        return { ...a, at, w: pr.width };
      }
      /** Where a packet sits when it is over a node: same height, centred on the box. */
      const over = (packetId, nodeId) => {
        const c = centre(nodeId);
        const w = document.getElementById(packetId).offsetWidth;
        return { x: c.x - w / 2, y: c.y - 17 - LIFT };
      };
      /** Marching dots along a connector, so the link reads as a live channel. */
      function flow(wireId, from, dur) {
        tl.fromTo(wireId, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, ease: "power2.out" }, from);
        tl.fromTo(wireId, { strokeDashoffset: 0 },
          { strokeDashoffset: -11 * Math.round(dur * 9), duration: dur, ease: "none" }, from);
      }

      /* ---------- 1 · the job ---------- */
      const PROMPT = "Render the scene, chart the results and publish them.";
      const ptext = document.getElementById("ptext");
      tl.set("#gcard", { transformPerspective: 1200, transformOrigin: "50% 60%" }, 0);
      tl.fromTo("#gcard", { autoAlpha: 0, y: 26, scale: 0.965, rotationX: 6 },
        { autoAlpha: 1, y: 0, scale: 1, rotationX: 0, duration: 0.7, ease: "expo.out" }, 0.25);
      tl.fromTo(".agents .agent", { autoAlpha: 0, y: 14 },
        { autoAlpha: 0.34, y: 0, duration: 0.42, stagger: 0.08, ease: "power3.out" }, 0.1);
      tl.to({ i: 0 }, { i: PROMPT.length, duration: 2.0, ease: "power2.out",
        onUpdate() { ptext.textContent = PROMPT.slice(0, Math.round(this.targets()[0].i)); } }, 0.75);
      // the agent that took the job lifts out of the row
      tl.to("#ag1", { autoAlpha: 1, scale: 1.06, duration: 0.5, ease: "power3.out" }, 3.0);
      tl.to("#ag1 .disc", { borderColor: "oklch(0.8 0.165 85 / 0.55)",
        boxShadow: "0 0 30px oklch(0.8 0.165 85 / 0.35)", duration: 0.5 }, 3.0);
      tl.fromTo("#shine1", { x: -360 }, { x: 1000, duration: 1.1, ease: "power2.inOut" }, 3.05);
      tl.to("#pcaret", { autoAlpha: 0, duration: 0.001, repeat: 7, yoyo: true, repeatDelay: 0.28 }, 2.8);
      tl.to("#s1 .col", { scale: 1.05, autoAlpha: 0, duration: 0.5, ease: "power2.in" }, 5.4 - 0.5);
      tl.set("#s1 .col", { autoAlpha: 0 }, 5.4);
      tl.set("#s1", { autoAlpha: 0 }, 5.4);

      /* ---------- 2 · asking ---------- */
      tl.set("#rail2", { autoAlpha: 1 }, 5.4);
      tl.fromTo("#s2 .node", { autoAlpha: 0, y: 18, scale: 0.96 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.55, stagger: 0.14, ease: "expo.out" }, 5.4);
      // draw the wire between the measured centres
      tl.set("#wire2", { attr: { d: () => { wire("wire2", "n2a", "n2b"); return document.getElementById("wire2").getAttribute("d"); } } }, 5.4 + 0.05);
      flow("#wire2", 5.4 + 0.35, 3.6);
      // the request flies, blurring with speed
      tl.set("#pk2", { autoAlpha: 0, x: () => park("pk2", "n2a").at.x, y: () => park("pk2", "n2a").at.y }, 5.4 + 0.55);
      tl.fromTo("#pk2", { autoAlpha: 0, y: () => park("pk2", "n2a").at.y + 14 },
        { autoAlpha: 1, y: () => park("pk2", "n2a").at.y, duration: 0.35, ease: "power3.out" }, 5.4 + 0.8);
      tl.to("#pk2", { x: () => over("pk2", "n2b").x, duration: 1.15, ease: "power2.inOut" }, 5.4 + 1.35);
      tl.fromTo("#mb1b", { attr: { stdDeviation: "0 0" } }, { attr: { stdDeviation: "16 0" }, duration: 0.4, ease: "power2.in" }, 5.4 + 1.2);
      tl.to("#mb1b", { attr: { stdDeviation: "0 0" }, duration: 0.45, ease: "power2.out" }, 5.4 + 1.9);
      tl.to("#pk2", { autoAlpha: 0, duration: 0.25 }, 5.4 + 2.42);
      tl.fromTo("#halo2b", { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: "power3.out" }, 5.4 + 2.35);
      tl.to("#halo2b", { autoAlpha: 0.45, duration: 0.5 }, 5.4 + 2.85);
      tl.to("#rail2", { scale: 1.04, autoAlpha: 0, duration: 0.45, ease: "power2.in" }, 9.8 - 0.45);
      tl.set("#rail2", { autoAlpha: 0 }, 9.8);
      tl.set("#s2", { autoAlpha: 0 }, 9.8);

      /* ---------- 3 · the price ---------- */
      tl.set("#card402", { transformPerspective: 1200, transformOrigin: "50% 70%" }, 9.8);
      tl.fromTo("#card402", { autoAlpha: 0, y: 30, rotationX: 10, scale: 0.97 },
        { autoAlpha: 1, y: 0, rotationX: 0, scale: 1, duration: 0.72, ease: "expo.out" }, 9.8);
      tl.fromTo("#card402 .head", { autoAlpha: 0, x: -12 }, { autoAlpha: 1, x: 0, duration: 0.4, ease: "power3.out" }, 9.8 + 0.3);
      tl.fromTo("#card402 .row", { autoAlpha: 0, x: -14 },
        { autoAlpha: 1, x: 0, duration: 0.42, stagger: 0.13, ease: "power3.out" }, 9.8 + 0.5);
      tl.fromTo("#ul402", { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: "power3.inOut" }, 9.8 + 0.9);
      tl.to("#card402", { scale: 1.03, duration: 0.8, ease: "expo.out" }, 9.8 + 1.5);
      tl.to("#card402", { scale: 1, duration: 0.9, ease: "power2.inOut" }, 9.8 + 2.3);
      tl.to("#s3 .card", { scale: 1.06, autoAlpha: 0, duration: 0.45, ease: "power2.in" }, 14.2 - 0.45);
      tl.set("#s3 .card", { autoAlpha: 0 }, 14.2);
      tl.set("#s3", { autoAlpha: 0 }, 14.2);

      /* ---------- 4 · paying ---------- */
      tl.fromTo("#s4 .node", { autoAlpha: 0, y: 18, scale: 0.96 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.55, stagger: 0.13, ease: "expo.out" }, 14.2);
      tl.set("#wire4", { attr: { d: () => { wire("wire4", "n4a", "n4b"); return document.getElementById("wire4").getAttribute("d"); } } }, 14.2 + 0.05);
      tl.set("#wire4b", { attr: { d: () => { wire("wire4b", "n4b", "n4c"); return document.getElementById("wire4b").getAttribute("d"); } } }, 14.2 + 0.05);
      flow("#wire4", 14.2 + 0.3, 2.6);
      flow("#wire4b", 14.2 + 2.1, 2.4);
      tl.set("#pk4", { autoAlpha: 0, x: () => park("pk4", "n4a").at.x, y: () => park("pk4", "n4a").at.y }, 14.2 + 0.55);
      tl.fromTo("#pk4", { autoAlpha: 0, y: () => park("pk4", "n4a").at.y + 14 },
        { autoAlpha: 1, y: () => park("pk4", "n4a").at.y, duration: 0.35, ease: "power3.out" }, 14.2 + 0.9);
      tl.fromTo("#halo4a", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 14.2 + 1.0);
      // agent -> facilitator
      tl.to("#pk4", { x: () => over("pk4", "n4b").x, duration: 1.05, ease: "power2.inOut" }, 14.2 + 1.3);
      tl.fromTo("#mb2b", { attr: { stdDeviation: "0 0" } }, { attr: { stdDeviation: "18 0" }, duration: 0.35, ease: "power2.in" }, 14.2 + 1.3);
      tl.to("#mb2b", { attr: { stdDeviation: "0 0" }, duration: 0.4, ease: "power2.out" }, 14.2 + 1.95);
      tl.to("#pk4", { y: () => over("pk4", "n4b").y + 34, duration: 0.3, ease: "power2.in" }, 14.2 + 2.25);
      tl.to("#pk4", { y: () => over("pk4", "n4b").y, duration: 0.3, ease: "power2.out" }, 14.2 + 2.55);
      tl.fromTo("#halo4b", { autoAlpha: 0, scale: 0.92 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: "power3.out" }, 14.2 + 2.3);
      // facilitator -> ledger
      tl.to("#pk4", { x: () => over("pk4", "n4c").x, duration: 1.05, ease: "power2.inOut" }, 14.2 + 2.75);
      tl.to("#mb2b", { attr: { stdDeviation: "18 0" }, duration: 0.35, ease: "power2.in" }, 14.2 + 2.75);
      tl.to("#mb2b", { attr: { stdDeviation: "0 0" }, duration: 0.4, ease: "power2.out" }, 14.2 + 3.4);
      tl.fromTo("#halo4c", { autoAlpha: 0, scale: 0.92 }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: "power3.out" }, 14.2 + 3.75);
      tl.to("#pk4", { autoAlpha: 0, duration: 0.3 }, 14.2 + 3.9);
      tl.to("#rail4", { scale: 1.05, autoAlpha: 0, duration: 0.5, ease: "power2.in" }, 19.8 - 0.5);
      tl.set("#rail4", { autoAlpha: 0 }, 19.8);
      tl.set("#s4", { autoAlpha: 0 }, 19.8);

      /* ---------- 5 · the machine ---------- */
      tl.fromTo("#win5", { autoAlpha: 0, scale: 0.72 },
        { autoAlpha: 1, scale: 1, duration: 0.75, ease: "expo.out" }, 19.8);
      tl.to("#win5", { autoAlpha: 0, scale: 1.12, duration: 0.55, ease: "power2.inOut" }, 19.8 + 0.95);
      tl.fromTo("#txt5 .big", { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: "expo.out" }, 19.8 + 1.15);
      // Opacity alone left this line with nothing promoting it to its own layer, and the
      // capture dropped it on every frame where no tween was writing to the element: it
      // showed during the fade, vanished once it settled, and came back when the scene's
      // exit tween started. Moving it as well keeps a transform on the element throughout.
      tl.fromTo("#txt5 .sub", { autoAlpha: 0, y: 10 },
        { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out" }, 19.8 + 1.5);
      tl.to("#s5 .col", { scale: 1.04, autoAlpha: 0, duration: 0.45, ease: "power2.in" }, 23.2 - 0.45);
      tl.set("#s5 .col", { autoAlpha: 0 }, 23.2);

      