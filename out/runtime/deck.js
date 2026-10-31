/* create-deck runtime: navigation, scaling, print preparation, readiness. */
(() => {
  "use strict";
  const doc = document.documentElement;
  const slides = Array.from(document.querySelectorAll(".dk-slide"));
  const meta = JSON.parse(document.getElementById("dk-meta").textContent);
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const counter = document.querySelector(".dk-counter");
  const notesPanel = document.createElement("aside");
  notesPanel.className = "dk-notes-panel";
  notesPanel.setAttribute("aria-label", "Speaker notes");
  document.body.append(notesPanel);
  let current = -1;

  // Unit-square charts are declared with data-total / data-on and expanded here.
  for (const grid of document.querySelectorAll(".dk-units[data-total]")) {
    if (grid.children.length) continue;
    const total = Number(grid.dataset.total) || 0;
    const on = Number(grid.dataset.on) || 0;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < total; i++) {
      const cell = document.createElement("i");
      if (i < on) cell.className = "is-on";
      frag.append(cell);
    }
    grid.append(frag);
    if (!grid.hasAttribute("role")) grid.setAttribute("role", "img");
  }

  // Steppers: pressing a step shows its panel; every slide activation (and printing)
  // returns to data-default.
  for (const stepper of document.querySelectorAll(".dk-stepper")) {
    const steps = [...stepper.querySelectorAll(".dk-step[data-step]")];
    const panels = [...stepper.querySelectorAll(".dk-swap__panel[data-step]")];
    const fallback = stepper.dataset.default || steps[0]?.dataset.step;
    const show = (key) => {
      for (const step of steps) step.setAttribute("aria-pressed", String(step.dataset.step === key));
      for (const panel of panels) panel.hidden = panel.dataset.step !== key;
    };
    stepper.addEventListener("click", (e) => {
      const step = e.target.closest(".dk-step[data-step]");
      if (step) show(step.dataset.step);
    });
    stepper.closest(".dk-slide")?.addEventListener("dk:activate", () => show(fallback));
    show(fallback);
  }

  function fit() {
    const deckHeight = document.querySelector(".dk-deck").clientHeight || innerHeight;
    const scale = Math.min(innerWidth / 1280, deckHeight / 720);
    doc.style.setProperty("--dk-scale", String(scale));
  }

  function announce(slide, reason) {
    slide.dispatchEvent(
      new CustomEvent("dk:activate", {
        bubbles: true,
        detail: {
          index: Number(slide.dataset.index),
          reason,
          reducedMotion: reducedMotion.matches,
        },
      })
    );
  }

  function go(i, reason = "navigate") {
    i = Math.max(0, Math.min(slides.length - 1, i));
    if (i === current) return;
    current = i;
    slides.forEach((slide, k) => {
      const active = k === i;
      slide.classList.toggle("is-active", active);
      slide.inert = !active;
    });
    if (counter) counter.textContent = `${i + 1} / ${slides.length}`;
    notesPanel.innerHTML = slides[i].querySelector(".dk-notes")?.innerHTML.trim() || "";
    const hash = `#${i + 1}`;
    if (location.hash !== hash) history.replaceState(null, "", hash);
    announce(slides[i], reason);
  }

  function fromHash() {
    const n = parseInt(location.hash.replace(/^#\/?/, ""), 10);
    if (Number.isFinite(n)) return n - 1;
    const byId = slides.findIndex((s) => `#${s.id}` === location.hash);
    return byId >= 0 ? byId : 0;
  }

  const next = () => go(current + 1);
  const prev = () => go(current - 1);

  function onKey(e) {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target;
    const typing = t.closest && t.closest("input, textarea, select, [contenteditable]");
    if (typing) return;
    const onControl = t.closest && t.closest("button, a, summary, [role=button]");
    const forward = ["ArrowRight", "ArrowDown", "PageDown"];
    const back = ["ArrowLeft", "ArrowUp", "PageUp"];
    if (e.key === " " && !onControl) {
      e.preventDefault();
      e.shiftKey ? prev() : next();
    } else if (forward.includes(e.key)) {
      e.preventDefault();
      next();
    } else if (back.includes(e.key)) {
      e.preventDefault();
      prev();
    } else if (e.key === "Home") {
      go(0);
    } else if (e.key === "End") {
      go(slides.length - 1);
    } else if (e.key === "f" && !onControl) {
      toggleFullscreen();
    } else if (e.key === "n" && !onControl) {
      toggleNotes();
    }
  }

  function toggleNotes(on = !document.body.classList.contains("dk-show-notes")) {
    document.body.classList.toggle("dk-show-notes", on);
    fit();
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else doc.requestFullscreen?.().catch(() => {});
  }

  // Every slide returns to its default state before printing or rendering.
  function prepareForPrint() {
    for (const slide of slides) announce(slide, "print");
  }

  function frame() {
    return new Promise((resolve) => {
      let settled = false;
      const done = () => {
        if (!settled) {
          settled = true;
          resolve();
        }
      };
      requestAnimationFrame(() => requestAnimationFrame(done));
      setTimeout(done, 200);
    });
  }

  function waitImage(img) {
    if (img.loading === "lazy") img.loading = "eager";
    const src = img.currentSrc || img.src;
    return new Promise((resolve) => {
      const decode = () =>
        img.decode().then(
          () => resolve({ src, ok: img.naturalWidth > 0 }),
          () => resolve({ src, ok: false })
        );
      if (img.complete) decode();
      else {
        img.addEventListener("load", decode, { once: true });
        img.addEventListener("error", () => resolve({ src, ok: false }), { once: true });
      }
    });
  }

  function backgroundUrls() {
    const urls = new Set();
    for (const el of document.querySelectorAll(".dk-deck *")) {
      for (const pseudo of [null, "::before", "::after"]) {
        const bg = getComputedStyle(el, pseudo).backgroundImage;
        if (!bg || bg === "none") continue;
        for (const m of bg.matchAll(/url\(["']?([^"')]+)["']?\)/g)) urls.add(m[1]);
      }
    }
    return [...urls];
  }

  function waitBackground(url) {
    const img = new Image();
    img.src = url;
    return waitImage(img);
  }

  // Resolves once every image is loaded and decoded and every font is ready.
  // Real time, no virtual-time budget: the caller decides how long to wait.
  async function ready(timeoutMs = 90000) {
    const images = Array.from(document.images);
    const pending = new Set(images.map((img) => img.currentSrc || img.src));
    const fontLoads = (meta.fonts || []).map((f) =>
      document.fonts.load(`${f.weight || 400} 32px "${f.family}"`).catch(() => [])
    );
    const work = (async () => {
      const results = await Promise.all([
        ...images.map((img) =>
          waitImage(img).then((r) => {
            pending.delete(r.src);
            return r;
          })
        ),
        ...backgroundUrls().map(waitBackground),
      ]);
      await Promise.all(fontLoads);
      await document.fonts.ready;
      await frame();
      return results;
    })();
    let timer;
    const timeout = new Promise((resolve) => {
      timer = setTimeout(() => resolve(null), timeoutMs);
    });
    const results = await Promise.race([work, timeout]);
    clearTimeout(timer);
    if (!results) return { done: false, pending: [...pending] };
    return {
      done: true,
      images: results.length,
      failed: results.filter((r) => !r.ok).map((r) => r.src),
      fonts: document.fonts.status,
    };
  }

  let idleTimer;
  function wake() {
    document.body.classList.remove("dk-idle");
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => document.body.classList.add("dk-idle"), 2500);
  }

  let touchX = null;
  document.addEventListener("touchstart", (e) => {
    touchX = e.touches.length === 1 ? e.touches[0].clientX : null;
  }, { passive: true });
  document.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 60) dx < 0 ? next() : prev();
    touchX = null;
  });

  document.querySelector(".dk-controls")?.addEventListener("click", (e) => {
    const action = e.target.closest("[data-dk]")?.dataset.dk;
    if (action === "next") next();
    else if (action === "prev") prev();
    else if (action === "fullscreen") toggleFullscreen();
    else if (action === "print") window.print();
  });

  addEventListener("keydown", onKey);
  addEventListener("resize", fit);
  addEventListener("hashchange", () => go(fromHash(), "hash"));
  addEventListener("beforeprint", prepareForPrint);
  addEventListener("afterprint", () => slides[current] && announce(slides[current], "navigate"));
  addEventListener("mousemove", wake, { passive: true });

  if (new URLSearchParams(location.search).has("notes")) toggleNotes(true);
  fit();
  doc.classList.add("dk-js");
  go(fromHash(), "load");
  wake();

  window.deck = {
    go: (n) => go(n - 1),
    next,
    prev,
    get current() {
      return current + 1;
    },
    get total() {
      return slides.length;
    },
    meta,
    ready,
    prepareForPrint,
  };
})();
