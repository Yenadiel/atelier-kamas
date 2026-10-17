/* =====================================================================
   Atelier Kamas — interface « compagnon » de l'appli de bureau.
   S'active quand la page tourne dans l'appli (window.atelier.gm) ou avec ?app.
   S'appuie sur les globales du script principal : GM, D, plan, cIdx,
   renderAll, renderCompact, range, jobName, toast…
   ===================================================================== */
(function () {
  if (typeof GM === "undefined" || !GM) return;
  const A = window.atelier || null;
  const IS_MAC = A && A.platform === "darwin";
  document.body.classList.add("gm");

  /* ---------- préférences d'interface ---------- */
  const UI_KEY = "atelier-ui";
  const DEF_SC = { toggle: "CommandOrControl+Shift+K", prev: "CommandOrControl+Shift+Left", next: "CommandOrControl+Shift+Right", done: "CommandOrControl+Shift+Enter" };
  let ui = { theme: "or", opacity: 1, zoom: 1, onTop: true, shortcuts: { ...DEF_SC } };
  try { const s = JSON.parse(localStorage.getItem(UI_KEY) || "null"); if (s) ui = { ...ui, ...s, shortcuts: { ...DEF_SC, ...(s.shortcuts || {}) } }; } catch (_) {}
  // 2.1.5 : opacité 100 % par défaut (une fenêtre semi-transparente peut rester invisible
  // à l'écran avec certaines cartes graphiques) ; l'ancien défaut 96 % est remis à 100 %.
  if (!ui.opv) { if (ui.opacity === 0.96) ui.opacity = 1; ui.opv = 2; try { localStorage.setItem(UI_KEY, JSON.stringify(ui)); } catch (_) {} }
  const saveUi = () => { try { localStorage.setItem(UI_KEY, JSON.stringify(ui)); } catch (_) {} };

  const THEMES = [
    ["or", "Or", "#e7c272", "#21303c"], ["violet", "Violet", "#9a99c8", "#22222e"], ["bleu", "Bleu", "#7fa2d6", "#1a2433"],
    ["rouge", "Rouge", "#d06b7c", "#281a1f"], ["gris", "Gris", "#b8b8b4", "#222222"], ["bronze", "Bronze", "#c99a6c", "#251f1a"],
    ["mauve", "Mauve", "#b19dc3", "#231f26"], ["cyan", "Cyan", "#7fb6ba", "#1a2223"], ["vert", "Vert", "#a3c17a", "#1e221a"], ["orange", "Orange", "#e08a6c", "#281d1a"],
  ];
  const ZOOMS = [[0.85, "Très petite"], [0.92, "Petite"], [1, "Normale"], [1.1, "Grande"], [1.2, "Très grande"]];

  /* ---------- icônes (traits simples, 24×24) ---------- */
  const P = {
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M2.5 12h3M18.5 12h3M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1"/>',
    min: '<path d="M5 12h14"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    left: '<path d="M15 5l-7 7 7 7"/>',
    right: '<path d="M9 5l7 7-7 7"/>',
    check: '<path d="M4.5 12.5l5 5 10-11"/>',
    play: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5l5.5 3.5-5.5 3.5z"/>',
    hammer: '<path d="M14 4l6 6-2.5 2.5-6-6z"/><path d="M11.5 6.5L4 14l3 3 7.5-7.5"/><path d="M5.5 15.5L3 20.5"/>',
    bag: '<path d="M5 8h14l-1.2 12H6.2z"/><path d="M9 8V6.5a3 3 0 016 0V8"/>',
    book: '<path d="M5 4.5h10a3 3 0 013 3v12H8a3 3 0 01-3-3z"/><path d="M5 16.5a3 3 0 013-3h10"/>',
    paw: '<circle cx="8" cy="7" r="1.8"/><circle cx="16" cy="7" r="1.8"/><circle cx="4.8" cy="12" r="1.7"/><circle cx="19.2" cy="12" r="1.7"/><path d="M12 11c-3 0-5.5 4-5.5 6.2 0 1.6 1.3 2.3 2.7 2.3 1.1 0 1.8-.6 2.8-.6s1.7.6 2.8.6c1.4 0 2.7-.7 2.7-2.3C17.5 15 15 11 12 11z"/>',
    coins: '<ellipse cx="10" cy="7" rx="6" ry="2.6"/><path d="M4 7v4c0 1.4 2.7 2.6 6 2.6s6-1.2 6-2.6V7"/><path d="M8 15.4c.6.1 1.3.2 2 .2 3.3 0 6-1.2 6-2.6"/><ellipse cx="15" cy="16" rx="5" ry="2.2"/><path d="M10 16v2.5c0 1.2 2.2 2.2 5 2.2s5-1 5-2.2V16"/>',
    pin: '<path d="M9 3h6l-1 6 3 3H7l3-3z"/><path d="M12 12v8"/>',
  };
  const svg = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[k]}</svg>`;

  const PAGES = [
    { id: "encours", t: "En cours", ic: "play" },
    { id: "metiers", t: "Plan de métier", ic: "hammer" },
    { id: "courses", t: "Liste de courses", ic: "bag" },
    { id: "recettes", t: "Recettes", ic: "book" },
    { id: "familier", t: "Familier", ic: "paw" },
    { id: "prix", t: "Prix HDV", ic: "coins" },
  ];

  /* ---------- barres ---------- */
  const bar = document.createElement("div");
  bar.id = "gmBar";
  bar.innerHTML = `<button id="gmMenuBtn" aria-haspopup="menu" aria-expanded="false" title="Menu">${svg("menu")}</button>
    <span class="ttl" id="gmTitle">Atelier Kamas</span><span class="sp"></span>
    <button id="gmPin" title="Toujours au premier plan">${svg("pin")}</button>
    <button id="gmSet" title="Paramètres">${svg("gear")}</button>
    ${A ? `<button id="gmMin" title="Réduire">${svg("min")}</button><button id="gmClose" class="close" title="Fermer">${svg("x")}</button>` : ""}`;
  const menu = document.createElement("div");
  menu.id = "gmMenu"; menu.hidden = true; menu.setAttribute("role", "menu");
  menu.innerHTML = PAGES.map((p) => `<button class="it" role="menuitem" data-go="${p.id}">${svg(p.ic)}${p.t}</button>`).join("") +
    `<hr><button class="it" role="menuitem" data-go="reglages">${svg("gear")}Paramètres</button>`;
  const pt = document.createElement("div");
  pt.id = "gmPT"; pt.innerHTML = `<span class="t" id="gmPTt"></span><span class="x" id="gmPTx"></span>`;
  const bottom = document.createElement("div");
  bottom.id = "gmBottom"; bottom.hidden = true;
  bottom.innerHTML = `<button class="nb" id="gmPrev" title="Étape précédente">${svg("left")}</button>
    <div id="gmTrack" role="slider" aria-label="Étape" tabindex="0"><i></i><span id="gmTrackTxt">–</span></div>
    <button class="nb" id="gmNext" title="Étape suivante">${svg("right")}</button>
    <button id="gmDone">${svg("check")}<span>Terminée</span></button>`;
  document.body.prepend(bar, menu, pt);
  document.body.append(bottom);

  /* page Paramètres */
  const wrap = document.querySelector(".wrap");
  const setSec = document.createElement("section");
  setSec.className = "stack"; setSec.id = "tab-reglages"; setSec.hidden = true;
  setSec.innerHTML = `<div class="gset" id="gmSettings"></div>`;
  wrap.appendChild(setSec);

  /* ---------- navigation ---------- */
  let cur = "encours";
  const pageOf = (id) => PAGES.find((p) => p.id === id) || { t: "Paramètres" };
  function go(id) {
    cur = id;
    if (id === "reglages") {
      document.querySelectorAll("section.stack[id^=tab-]").forEach((s) => (s.hidden = s.id !== "tab-reglages"));
      renderSettings();
    } else {
      const b = document.querySelector(`nav.tabs button[data-tab="${id}"]`);
      if (b) b.click();
    }
    try { localStorage.setItem("atelier-tab-ov", id); } catch (_) {}
    chrome();
    wrap.scrollTop = 0;
  }
  // un clic sur un onglet (depuis le code de l'outil, ex. « Aller au plan ») met aussi l'habillage à jour
  document.querySelectorAll("nav.tabs button").forEach((b) => b.addEventListener("click", () => { cur = b.dataset.tab; chrome(); }));

  function chrome() {
    const p = pageOf(cur);
    $("#gmTitle").textContent = p.t;
    $("#gmPTt").textContent = p.t;
    let x = "";
    try {
      if (D && (cur === "metiers" || cur === "encours")) { const r = range(); x = `${jobName(plan.job)} · ${r.from} → ${r.to}`; }
      else if (cur === "courses") x = plan.cart && plan.cart.length ? plan.cart.map((c) => `${jobName(c.job)} ${c.from}→${c.to}`).join(" · ") : "vide";
      else if (cur === "reglages") x = A && A.version ? "v" + A.version : "";
    } catch (_) {}
    $("#gmPTx").textContent = x;
    menu.querySelectorAll("[data-go]").forEach((b) => b.classList.toggle("on", b.dataset.go === cur));
    const showBottom = cur === "encours";
    bottom.hidden = !showBottom;
    document.body.classList.toggle("gm-has-bottom", showBottom);
    $("#gmPin").style.color = ui.onTop ? "var(--g-accent)" : "";
  }

  /* menu ☰ */
  const openMenu = (o) => { menu.hidden = !o; $("#gmMenuBtn").setAttribute("aria-expanded", o); if (o) menu.querySelector(".it.on, .it")?.focus(); };
  $("#gmMenuBtn").onclick = (e) => { e.stopPropagation(); openMenu(menu.hidden); };
  menu.addEventListener("click", (e) => { const b = e.target.closest("[data-go]"); if (!b) return; openMenu(false); go(b.dataset.go); });
  document.addEventListener("click", (e) => { if (!menu.hidden && !e.target.closest("#gmMenu")) openMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !menu.hidden) openMenu(false); });
  $("#gmSet").onclick = () => go(cur === "reglages" ? "encours" : "reglages");
  $("#gmPin").onclick = () => { ui.onTop = !ui.onTop; saveUi(); applyWindow(); chrome(); toast(ui.onTop ? "Toujours au premier plan" : "Premier plan désactivé"); };
  if (A) { $("#gmMin").onclick = () => A.minimize(); $("#gmClose").onclick = () => A.close(); }

  /* ---------- barre d'étape (bas) ---------- */
  const clickIn = (sel) => { const el = document.querySelector("#encours " + sel); if (el && !el.disabled) { el.click(); return true; } return false; };
  $("#gmPrev").onclick = () => clickIn("#cPrev");
  $("#gmNext").onclick = () => clickIn("#cNext");
  $("#gmDone").onclick = () => { if (clickIn("#cDone")) { const d = $("#gmDone"); d.classList.remove("pulse"); void d.offsetWidth; d.classList.add("pulse"); } };
  let segCount = 0, scrub = null;
  const track = $("#gmTrack");
  const idxAt = (x) => { const r = track.getBoundingClientRect(); return Math.max(0, Math.min(segCount - 1, Math.floor(((x - r.left) / r.width) * segCount))); };
  const showIdx = (i) => { $("#gmTrackTxt").textContent = `${i + 1} / ${segCount}`; track.style.setProperty("--p", segCount ? ((i + 1) / segCount) * 100 + "%" : "0%"); };
  track.addEventListener("pointerdown", (e) => { if (!segCount) return; track.setPointerCapture(e.pointerId); scrub = idxAt(e.clientX); showIdx(scrub); });
  track.addEventListener("pointermove", (e) => { if (scrub === null) return; scrub = idxAt(e.clientX); showIdx(scrub); });
  track.addEventListener("pointerup", () => { if (scrub === null) return; cIdx = scrub; scrub = null; renderCompact(); });
  track.addEventListener("wheel", (e) => { e.preventDefault(); (e.deltaY || e.deltaX) > 0 ? clickIn("#cNext") : clickIn("#cPrev"); }, { passive: false });
  track.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft") clickIn("#cPrev"); if (e.key === "ArrowRight") clickIn("#cNext"); });

  // appelé par renderCompact() après chaque rendu de l'étape en cours
  window.gmAfterCompact = ({ segs, idx, isDone }) => {
    segCount = segs.length;
    $("#gmPrev").disabled = idx <= 0;
    $("#gmNext").disabled = idx >= segs.length - 1;
    if (scrub === null) showIdx(segs.length ? idx : 0);
    if (!segs.length) $("#gmTrackTxt").textContent = "Aucun plan";
    const d = $("#gmDone");
    d.disabled = !segs.length;
    d.classList.toggle("is-done", !!isDone);
    d.querySelector("span").textContent = isDone ? "Faite" : "Terminée";
    chrome();
  };

  /* ---------- fenêtre (opacité, zoom, premier plan, raccourcis) ---------- */
  let scErrors = [];
  async function applyWindow() {
    document.body.dataset.gtheme = ui.theme;
    if (!A) { document.body.style.zoom = ui.zoom; return; }
    A.setOpacity(ui.opacity);
    A.setZoom(ui.zoom);
    A.setOnTop(ui.onTop);
    try { scErrors = (await A.setShortcuts(ui.shortcuts)) || []; } catch (_) { scErrors = []; }
    if (cur === "reglages") markShortcutErrors();
  }
  if (A && A.onForceOpaque) A.onForceOpaque(() => { ui.opacity = 1; saveUi(); if (cur === "reglages") renderSettings(); toast("Fenêtre remise à 100 % d'opacité"); });
  if (A && A.onShortcut) A.onShortcut((name) => {
    if (name === "prev") clickIn("#cPrev");
    else if (name === "next") clickIn("#cNext");
    else if (name === "done") $("#gmDone").click();
  });

  /* ---------- page Paramètres ---------- */
  const accelLabel = (a) => (a || "").replace(/CommandOrControl/g, IS_MAC ? "⌘" : "Ctrl").replace(/Shift/g, "Maj").replace(/Left/g, "←").replace(/Right/g, "→").replace(/Up$/g, "↑").replace(/Down$/g, "↓").replace(/Enter/g, "Entrée").replace(/\+/g, " + ");
  function keyToAccel(e) {
    const k = e.key;
    if (["Control", "Shift", "Alt", "Meta"].includes(k)) return null;
    const map = { ArrowLeft: "Left", ArrowRight: "Right", ArrowUp: "Up", ArrowDown: "Down", " ": "Space", Enter: "Enter", Tab: "Tab", PageUp: "PageUp", PageDown: "PageDown", Home: "Home", End: "End", Delete: "Delete", Backspace: "Backspace" };
    let key = map[k] || (/^F\d{1,2}$/.test(k) ? k : k.length === 1 ? k.toUpperCase() : null);
    if (!key) return null;
    const mods = [];
    if (e.ctrlKey || e.metaKey) mods.push("CommandOrControl");
    if (e.altKey) mods.push("Alt");
    if (e.shiftKey) mods.push("Shift");
    if (!mods.length && !/^F\d/.test(key)) return null; // un raccourci global doit avoir un modificateur
    return [...mods, key].join("+");
  }
  function markShortcutErrors() {
    document.querySelectorAll(".gset .sc").forEach((el) => el.classList.toggle("bad", scErrors.includes(el.dataset.sc)));
    const w = $("#gmScWarn");
    if (w) w.hidden = !scErrors.length;
  }
  function renderSettings() {
    const S = $("#gmSettings");
    S.innerHTML = `
      <div class="grp"><h3>Apparence</h3>
        <div><div class="lbl" style="margin-bottom:6px">Thème</div><div class="themes">${THEMES.map(([id, n, a, c]) => `<button class="th" data-th="${id}" aria-pressed="${ui.theme === id}" style="--a:${a};--c:${c}"><i></i>${n}</button>`).join("")}</div></div>
        <div class="row2"><span>Opacité</span><input type="range" id="gsOp" min="40" max="100" step="1" value="${Math.round(ui.opacity * 100)}" aria-label="Opacité"></div>
        <p class="hint" style="margin:-4px 0 0">Sous 100 %, la fenêtre peut devenir invisible sur certains PC (visible en capture d'écran mais pas sur le moniteur). Dans ce cas : clic droit sur l'icône K près de l'horloge → « Fenêtre opaque ».</p>
        <div><div class="lbl" style="margin-bottom:6px">Taille du texte</div><div class="sizes">${ZOOMS.map(([z, n]) => `<button data-z="${z}" aria-pressed="${ui.zoom === z}">${n}</button>`).join("")}</div></div>
      </div>
      <div class="grp"><h3>Fenêtre</h3>
        <div class="row2"><span>Toujours au premier plan (par-dessus Dofus)</span><button class="sw" id="gsTop" role="switch" aria-checked="${ui.onTop}" aria-label="Toujours au premier plan"></button></div>
      </div>
      <div class="grp"><h3>Raccourcis clavier</h3>
        <p class="hint" style="margin:0">Actifs même quand Dofus a le focus. Clique une case puis appuie sur la combinaison voulue.</p>
        ${[["toggle", "Afficher / masquer l'appli"], ["prev", "Étape précédente"], ["next", "Étape suivante"], ["done", "Valider l'étape"]].map(([k, n]) =>
          `<div class="row2"><span>${n}</span><input class="sc" data-sc="${k}" readonly value="${accelLabel(ui.shortcuts[k])}" aria-label="${n}"></div>`).join("")}
        <p class="hint" id="gmScWarn" hidden style="margin:0;color:var(--g-bad)">Un raccourci en rouge est déjà pris par une autre appli : choisis-en un autre.</p>
        <div><button class="btn sm ghost" id="gsScReset">Raccourcis par défaut</button></div>
      </div>
      <div class="grp"><h3>Prix partagés</h3>
        <p class="hint" style="margin:0">Les prix relevés par les contributeurs sont téléchargés à chaque lancement. ${typeof sharedInfo !== "undefined" && sharedInfo && sharedInfo.n ? `<b>${sharedInfo.n}</b> prix partagés en service (mise à jour du ${esc(sharedInfo.maj)}).` : "Aucun prix partagé pour l'instant."} Tes propres prix passent toujours en premier.</p>
        <p class="hint" style="margin:0">Contributeur du dépôt ? Envoie tes prix saisis à tout le monde : une page GitHub s'ouvre déjà remplie, tu cliques « Submit » et tout le monde les reçoit au prochain lancement.</p>
        <div><button class="btn sm gold" id="gsShare">Partager mes prix</button></div>
      </div>
      <div class="grp"><h3>Données</h3>
        <p class="hint" style="margin:0">Prix, stock, progression et familier sont enregistrés sur cet ordinateur. Exporte-les pour les sauvegarder ou les passer sur un autre PC / la page web.</p>
        <div class="row" style="gap:8px"><button class="btn sm" id="gsExport">Exporter</button><button class="btn sm" id="gsImport">Importer</button></div>
      </div>
      <div class="grp"><h3>À propos</h3>
        <div class="about">Atelier Kamas ${A && A.version ? "v" + A.version : ""} · Dofus 3, serveur Dakal<br>
        ${D ? `Jeu ${esc(D.v || "")} · ${D.recipes.length.toLocaleString("fr-FR")} recettes · prix HDV relevés le ${esc((D.refInfo && D.refInfo.date) || "10/10/2026")}` : ""}<br>
        L'appli ne lit pas le client Dofus et n'agit pas dessus.</div>
      </div>`;
    S.querySelectorAll("[data-th]").forEach((b) => (b.onclick = () => { ui.theme = b.dataset.th; saveUi(); applyWindow(); renderSettings(); }));
    $("#gsOp").oninput = (e) => { ui.opacity = +e.target.value / 100; if (A) A.setOpacity(ui.opacity); };
    $("#gsOp").onchange = () => saveUi();
    S.querySelectorAll("[data-z]").forEach((b) => (b.onclick = () => { ui.zoom = +b.dataset.z; saveUi(); applyWindow(); renderSettings(); }));
    $("#gsTop").onclick = () => { ui.onTop = !ui.onTop; saveUi(); applyWindow(); renderSettings(); chrome(); };
    S.querySelectorAll(".sc").forEach((el) => {
      el.onfocus = () => { el.classList.add("rec"); el.value = "Appuie sur une touche…"; };
      el.onblur = () => { el.classList.remove("rec"); el.value = accelLabel(ui.shortcuts[el.dataset.sc]); };
      el.onkeydown = (e) => {
        e.preventDefault();
        if (e.key === "Escape") { el.blur(); return; }
        const acc = keyToAccel(e);
        if (!acc) return;
        ui.shortcuts[el.dataset.sc] = acc; saveUi(); el.blur(); applyWindow();
      };
    });
    $("#gsScReset").onclick = () => { ui.shortcuts = { ...DEF_SC }; saveUi(); applyWindow(); renderSettings(); };
    $("#gsShare").onclick = () => shareMyPrices();
    $("#gsExport").onclick = () => $("#btnSaveFile").click();
    $("#gsImport").onclick = () => $("#fileImport").click();
    markShortcutErrors();
  }

  /* ---------- démarrage ---------- */
  applyWindow();
  let start = "encours";
  try { start = localStorage.getItem("atelier-tab-ov") || "encours"; } catch (_) {}
  // attend que les données soient chargées pour ouvrir la page
  const boot = setInterval(() => { if (typeof D !== "undefined" && D) { clearInterval(boot); go(start); } }, 50);
  window.gmGo = go;
})();
