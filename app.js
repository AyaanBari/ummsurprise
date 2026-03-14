/* Three sections, one sweet flow + animations */

const qs = (sel, root = document) => root.querySelector(sel);
const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

function toast(title, body, ms = 2600) {
  const host = qs("#toasts");
  if (!host) return;
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `<p class="toastTitle"></p><p class="toastBody"></p>`;
  qs(".toastTitle", el).textContent = title;
  qs(".toastBody", el).textContent = body;
  host.appendChild(el);
  window.setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateY(10px)";
    el.style.transition = "opacity .25s ease, transform .25s ease";
    window.setTimeout(() => el.remove(), 280);
  }, ms);
}

function showPage(name) {
  const pages = qsa(".page");
  pages.forEach((p) => {
    const is = p.dataset.page === name;
    p.classList.toggle("isActive", is);
  });
  revealScan();
}

// Reveal-on-view
let _io = null;
function initRevealObserver() {
  const els = qsa("[data-reveal]");
  if (!("IntersectionObserver" in window)) {
    for (const el of els) el.classList.add("isShown");
    return;
  }
  _io?.disconnect();
  _io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("isShown");
          _io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.12 }
  );
  for (const el of els) _io.observe(el);
}

function revealScan() {
  // For page transitions: ensure elements on current page reveal.
  const active = qs(".page.isActive");
  if (!active) return;
  const els = qsa("[data-reveal]", active);
  for (const el of els) {
    // If in view already, nudge it visible quickly
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.85) el.classList.add("isShown");
  }
}

// Ambient hearts + sparkles
function spawnAmbient() {
  const hearts = qs("#hearts");
  const sparkles = qs("#sparkles");
  if (!hearts || !sparkles) return;

  // hearts
  const heartCount = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 10 : 22;
  hearts.innerHTML = "";
  for (let i = 0; i < heartCount; i++) {
    const h = document.createElement("div");
    h.className = "heart";
    const x = Math.random() * 100;
    const dx = (Math.random() - 0.5) * 18;
    const s = 0.6 + Math.random() * 0.9;
    const dur = 9 + Math.random() * 9;
    const delay = Math.random() * dur;
    h.style.setProperty("--x", `${x}vw`);
    h.style.setProperty("--dx", `${dx}vw`);
    h.style.setProperty("--s", `${s}`);
    h.style.setProperty("--dur", `${dur}s`);
    h.style.animationDelay = `-${delay}s`;
    hearts.appendChild(h);
  }

  // sparkles
  const spCount = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 14 : 34;
  sparkles.innerHTML = "";
  for (let i = 0; i < spCount; i++) {
    const s = document.createElement("div");
    s.className = "spark";
    s.style.left = `${Math.random() * 100}%`;
    s.style.top = `${Math.random() * 100}%`;
    s.style.animationDelay = `${Math.random() * 2.6}s`;
    s.style.opacity = "0";
    sparkles.appendChild(s);
  }
}

// Burst hearts / confetti-like particles
function burst(originEl, { count = 46, spread = 240, life = 1500 } = {}) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;

  const rect = originEl?.getBoundingClientRect?.();
  const ox = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
  const oy = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;

  const layer = document.createElement("div");
  layer.style.position = "fixed";
  layer.style.inset = "0";
  layer.style.pointerEvents = "none";
  layer.style.zIndex = "50";
  document.body.appendChild(layer);

  const colors = ["#ff4fd8", "#8a5bff", "#5bf7ff", "#ffd37a", "#ff4b7a"];
  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    const size = 6 + Math.random() * 10;
    p.style.position = "absolute";
    p.style.left = `${ox}px`;
    p.style.top = `${oy}px`;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.borderRadius = Math.random() > 0.45 ? "999px" : "6px";
    p.style.background = colors[(Math.random() * colors.length) | 0];
    p.style.boxShadow = "0 10px 30px rgba(0,0,0,.25)";
    layer.appendChild(p);

    const ang = Math.random() * Math.PI * 2;
    const vel = 0.55 + Math.random() * 1.05;
    const vx = Math.cos(ang) * spread * vel;
    const vy = Math.sin(ang) * spread * vel - 120;
    const rot = (Math.random() - 0.5) * 720;
    const drift = (Math.random() - 0.5) * 50;
    const g = 780 + Math.random() * 420;
    const start = performance.now();

    function step(t) {
      const dt = (t - start) / 1000;
      const x = ox + vx * dt + drift * dt;
      const y = oy + vy * dt + 0.5 * g * dt * dt;
      const a = 1 - clamp((t - start) / life, 0, 1);
      p.style.transform = `translate(${x - ox}px, ${y - oy}px) rotate(${rot * dt}deg)`;
      p.style.opacity = `${a}`;
      if (t - start < life) requestAnimationFrame(step);
      else p.remove();
    }
    requestAnimationFrame(step);
  }

  window.setTimeout(() => layer.remove(), life + 80);
}

// Dodging "No" button
function initNoButton() {
  const noBtn = qs("#noBtn");
  const row = qs("#btnRow");
  if (!noBtn || !row) return;

  const moveAway = () => {
    const rowRect = row.getBoundingClientRect();
    const btnRect = noBtn.getBoundingClientRect();
    const padding = 10;

    const maxX = Math.max(0, rowRect.width - btnRect.width - padding * 2);
    const maxY = Math.max(0, 90);
    const nx = (Math.random() * maxX - maxX / 2) * 0.9;
    const ny = (Math.random() * maxY - maxY / 2) * 0.9;

    noBtn.style.transition = "transform .18s ease";
    noBtn.style.transform = `translate(${nx}px, ${ny}px) rotate(${(Math.random() - 0.5) * 10}deg)`;
  };

  const reset = () => {
    noBtn.style.transition = "transform .25s ease";
    noBtn.style.transform = "translate(0,0)";
  };

  // Make it basically unclickable (works for mouse + touch)
  noBtn.addEventListener("pointerenter", () => {
    moveAway();
    toast("Hehe", "That “No” is too shy to be clicked.");
  });
  noBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    moveAway();
    toast("Nope", "You can’t press that one.");
  });
  noBtn.addEventListener("focus", () => moveAway());
  row.addEventListener("pointerleave", () => reset());
  noBtn.addEventListener("click", (e) => {
    e.preventDefault();
    moveAway();
  });
}

function initYesFlow() {
  const yes = qs("#yesBtn");
  const after = qs("#after");
  const replay = qs("#replay");
  const qCard = qs("#questionCard");
  const openMarch15 = qs("#openMarch15");
  if (!yes || !after || !qCard) return;

  const celebrate = () => {
    burst(yes, { count: 64, spread: 260, life: 1600 });
    burst(qCard, { count: 44, spread: 220, life: 1400 });
    toast("Ayaan", "I love you, Tarana. Like forever.");
  };

  yes.addEventListener("click", () => {
    celebrate();
    after.hidden = false;
    yes.disabled = true;
    const no = qs("#noBtn");
    if (no) no.disabled = true;
    setTimeout(() => {
      qCard.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
  });

  replay?.addEventListener("click", () => celebrate());

  openMarch15?.addEventListener("click", (e) => {
    e.preventDefault();
    // If dev forgot to set link, keep her on this page
    const href = openMarch15.getAttribute("href") || "";
    if (!href || href === "PASTE_HTTP_LINK_HERE") {
      toast("Add your link", "Paste your http link into the 15th March button.");
      return;
    }
    // Stop background music when she goes to the next surprise
    const audio = qs("#bgm");
    const chip = qs("#musicToggle");
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    if (chip) {
      chip.classList.remove("isOn");
      chip.setAttribute("aria-pressed", "false");
      chip.textContent = "♪ Pause";
    }
    try {
      localStorage.setItem("ayaan_tarana_music_on", "0");
    } catch {
      // ignore
    }
    // Open the surprise page after pausing music
    window.open(href, "_blank", "noopener");
  });
}

// Handmade envelope steps + card reveal lines
function initHandmadeCard() {
  const envelope = qs("#envelope");
  const seal = qs("#seal");
  const flap = qs("#envFlap");
  const handCard = qs("#handCard");
  const stepBtns = qsa(".stepBtn");
  const revealNext = qs("#revealNext");
  const sprinkle = qs("#sprinkle");
  const paperFoldTop = qs("#paperFoldTop");
  const paperCore = qs("#paperCore");
  if (!envelope || !seal || !flap || !handCard || stepBtns.length < 4) return;

  const [s1, s2, s3, s4] = stepBtns;
  const lines = qsa(".cardLine", handCard);
  let lineIdx = 0;
  let cardFinished = false;

  const enable = (btn) => {
    btn.disabled = false;
    btn.style.borderColor = "rgba(255,255,255,.20)";
    btn.style.background = "rgba(255,255,255,.06)";
  };
  const markDone = (btn) => {
    btn.disabled = true;
    btn.style.opacity = "0.65";
    btn.style.background = "rgba(255,79,216,.08)";
    btn.style.borderColor = "rgba(255,255,255,.14)";
  };

  function step1() {
    if (envelope.classList.contains("isSealedBroken")) return;
    envelope.classList.add("isSealedBroken");
    burst(seal, { count: 38, spread: 180, life: 1200 });
    toast("Okay baby", "You opened it… now keep going.");
    markDone(s1);
    enable(s2);
  }

  function step2() {
    if (!envelope.classList.contains("isSealedBroken")) return;
    if (envelope.classList.contains("isFlapOpen")) return;
    envelope.classList.add("isFlapOpen");
    toast("Slowly", "Now pull my card out.");
    markDone(s2);
    enable(s3);
  }

  function step3() {
    if (!envelope.classList.contains("isFlapOpen")) return;
    if (!handCard.hidden) return;
    handCard.hidden = false;
    burst(envelope, { count: 40, spread: 210, life: 1300 });
    toast("For you", "I made this only for you, Tarana.");
    markDone(s3);
    enable(s4);
    // Show folded card first
    paperFoldTop?.classList.remove("isOpen");
    paperCore?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function step4() {
    if (handCard.hidden) return;
    if (!paperFoldTop?.classList.contains("isOpen")) {
      paperFoldTop?.classList.add("isOpen");
      toast("Now read", "Lift the flap and then press “Write the next line”.");
    }
    markDone(s4);
    setTimeout(() => {
      lines[0]?.classList.add("isRevealed");
      lineIdx = 1;
    }, 420);
    burst(handCard, { count: 50, spread: 240, life: 1500 });
  }

  s1.addEventListener("click", step1);
  s2.addEventListener("click", step2);
  s3.addEventListener("click", step3);
  s4.addEventListener("click", step4);

  // Also allow clicking the seal itself
  seal.addEventListener("click", step1);
  flap.addEventListener("click", () => (s2.disabled ? toast("First…", "Break the seal.") : step2()));

  revealNext?.addEventListener("click", () => {
    if (handCard.hidden) {
      toast("Wait baby", "Open the envelope first.");
      return;
    }
    const next = lines[lineIdx];
    if (!next) {
      if (!cardFinished) {
        cardFinished = true;
        toast("That’s all", "Now I’ll take you to my question.");
        setTimeout(() => {
          showPage("proposal");
        }, 900);
      } else {
        toast("That’s all", "You can read it again if you want.");
      }
      burst(revealNext, { count: 28, spread: 180, life: 1100 });
      return;
    }
    next.classList.add("isRevealed");
    burst(next, { count: 22, spread: 150, life: 1000 });
    lineIdx += 1;
  });

  sprinkle?.addEventListener("click", () => {
    burst(handCard, { count: 70, spread: 300, life: 1700 });
  });
}

function initNav() {
  // linear flow only: home -> card -> proposal
  const goCard = qs('[data-flow="card"]');
  if (goCard) {
    goCard.addEventListener("click", () => {
      showPage("card");
    });
  }
  showPage("home");
}

function initKeyboard() {
  // keep simple; no keyboard jumps so progression stays gradual
}

function initMusic() {
  const audio = qs("#bgm");
  const btn = qs("#musicToggle");
  if (!audio || !btn) return;

  const KEY = "ayaan_tarana_music_on";
  let on = true; // default on
  let started = false;

  const setBtn = () => {
    btn.classList.toggle("isOn", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.textContent = on ? "♪ Pause" : "♪ Pause";
  };

  const waitForMetadata = () =>
    new Promise((resolve) => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) return resolve();
      const done = () => {
        audio.removeEventListener("loadedmetadata", done);
        audio.removeEventListener("canplay", done);
        resolve();
      };
      audio.addEventListener("loadedmetadata", done, { once: true });
      audio.addEventListener("canplay", done, { once: true });
      // In case the browser never fires (rare), resolve anyway
      window.setTimeout(done, 1200);
    });

  async function tryPlay() {
    try {
      await waitForMetadata();
      const seekTo = 45;
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        audio.currentTime = Math.min(seekTo, Math.max(0, audio.duration - 1));
      } else {
        audio.currentTime = seekTo;
      }
      audio.volume = 0.0;
      await audio.play();
      started = true;
      // fade in
      const target = 0.85;
      const steps = 20;
      const step = target / steps;
      let i = 0;
      const fade = () => {
        if (audio.paused) return;
        i += 1;
        audio.volume = Math.min(target, audio.volume + step);
        if (i < steps) window.setTimeout(fade, 80);
      };
      window.setTimeout(fade, 80);
      return true;
    } catch {
      return false;
    }
  }

  async function turnOn() {
    on = true;
    localStorage.setItem(KEY, "1");
    setBtn();
    const ok = await tryPlay();
    if (!ok) {
      toast("Tap once", "Press the ♪ button once to start the song.");
    } else {
      toast("Our song", "Okay… it’s playing.");
    }
  }

  function turnOff() {
    on = false;
    localStorage.setItem(KEY, "0");
    setBtn();
    audio.pause();
    toast("Okay", "Song paused.");
  }

  btn.addEventListener("click", async () => {
    if (on) turnOff();
    else await turnOn();
  });

  // GitHub Pages / iOS Safari: audio must start from user gesture.
  setBtn();
  const startOnGesture = async () => {
    if (!on || started) return;
    const ok = await tryPlay();
    if (!ok) toast("Song", "Tap the ♪ button to start.");
  };
  document.addEventListener("pointerdown", startOnGesture, { passive: true });
  document.addEventListener("keydown", startOnGesture);
}

function boot() {
  spawnAmbient();
  initRevealObserver();
  initNav();
  initHandmadeCard();
  initNoButton();
  initYesFlow();
  initMusic();
  initKeyboard();

  // little welcome
  window.setTimeout(() => {
    toast("Hi Tarana", "It’s your Ayaan. Come with me.");
  }, 550);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}

