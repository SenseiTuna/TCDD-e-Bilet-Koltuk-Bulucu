(function () {
  "use strict";

  const KEY = "tcddSeatWatchSettings_v35";
  const DEFAULTS = {
    enabled: true,
    refreshMs: 60000,
    scanEveryMs: 10000,
    minSeat: 1,
    notifyCooldownMs: 15000,
    timeWindowStart: "12:00",
    timeWindowEnd: "18:00",
    onlyEconomy: true
  };

  const STOP_PATHS = [
    /\/koltuk-haritasi/i,       // kesin dur
  ];
  const LIST_PATH = /\/sefer-listesi/i;

  let settings = loadSettings();
  let nextReloadAt = Date.now() + settings.refreshMs;

  function loadSettings() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { ...DEFAULTS };
      return { ...DEFAULTS, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULTS };
    }
  }
  function saveSettings() {
    localStorage.setItem(KEY, JSON.stringify(settings));
  }

  function now() { return Date.now(); }

  function normTR(s) {
    const up = (s || "").toLocaleUpperCase("tr-TR");
    const map = { "Ç": "C", "Ğ": "G", "İ": "I", "Ö": "O", "Ş": "S", "Ü": "U" };
    const cleaned = up.replace(/[ÇĞİÖŞÜ]/g, (x) => map[x] || x);
    return cleaned.replace(/\s+/g, " ").trim();
  }

  function hhmmToMin(hhmm) {
    const m = String(hhmm || "").match(/^(\d{1,2})[:.](\d{2})$/);
    if (!m) return null;
    const h = Number(m[1]), mi = Number(m[2]);
    if (h < 0 || h > 23 || mi < 0 || mi > 59) return null;
    return h * 60 + mi;
  }

  function isInTimeWindow(hhmm, start, end) {
    const t = hhmmToMin(hhmm), s = hhmmToMin(start), e = hhmmToMin(end);
    if (t === null || s === null || e === null) return false;
    if (s <= e) return t >= s && t <= e;
    return t >= s || t <= e; // Gece yarısı geçişi (örn: 22:00 - 04:00)
  }

  function parseSeatCount(text) {
    const m = String(text || "").match(/(\d+)/);
    return m ? Number(m[1]) : 0;
  }

  function canNotify(id) {
    const last = Number(localStorage.getItem("tcdd_last_" + id) || "0");
    return (now() - last) > settings.notifyCooldownMs;
  }
  function markNotified(id) {
    localStorage.setItem("tcdd_last_" + id, String(now()));
  }

  function beep() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine"; o.frequency.value = 880;
      o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      o.start(); o.stop(ctx.currentTime + 0.22);
      setTimeout(() => ctx.close(), 400);
    } catch {}
  }

  function notify(title, body) {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") new Notification(title, { body });
    else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(p => p === "granted" && new Notification(title, { body }));
    }
  }

  function isStopPage() {
    const p = location.pathname || "";
    return STOP_PATHS.some(rx => rx.test(p));
  }
  function isListPage() {
    const p = location.pathname || "";
    return LIST_PATH.test(p);
  }

  function isEconomyButton(btn) {
    const t = normTR(btn ? btn.innerText : "");
    return t.includes("EKONOMI");
  }

  function extractDepartureTime(btn) {
    function collectClockTimes(text) {
      const out = [];
      const re = /\b([01]?\d|2[0-3])[:.][0-5]\d\b/g;
      let m;
      while ((m = re.exec(text)) !== null) out.push(m[0].replace(".", ":"));
      return out;
    }

    let node = btn;
    for (let i = 0; i < 10 && node; i++) {
      const txt = (node.innerText || "").trim();
      if (txt.length > 900) { node = node.parentElement; continue; }

      const times = collectClockTimes(txt);
      if (times.length >= 2) {
        let best = null, bestMin = 1e9;
        for (const t of Array.from(new Set(times))) {
          const mn = hhmmToMin(t);
          if (mn !== null && mn < bestMin) { bestMin = mn; best = t; }
        }
        return best;
      }
      node = node.parentElement;
    }
    return null;
  }

  // CSS
  function injectStylesOnce() {
    if (document.getElementById("tcdd-seat-style-v35")) return;
    const style = document.createElement("style");
    style.id = "tcdd-seat-style-v35";
    style.textContent = `
      .tcdd-hit-economy {
        outline: 3px solid #35ff6b !important;
        box-shadow: 0 0 0 4px rgba(53,255,107,0.25) !important;
        border-radius: 10px !important;
      }
      .tcdd-hit-time {
        outline: 6px solid #35ff6b !important;
        border-radius: 12px !important;
        transition: all 0.3s ease;
      }
    `;
    document.head.appendChild(style);
  }

  function clearHighlights() {
    document.querySelectorAll(".tcdd-hit-economy").forEach(el => el.classList.remove("tcdd-hit-economy"));
    document.querySelectorAll(".tcdd-hit-time").forEach(el => el.classList.remove("tcdd-hit-time"));
  }

  // Panel
  function ensurePanel() {
    if (!document.body) return false;
    if (document.getElementById("tcdd-seat-panel-v35")) return true;

    const panel = document.createElement("div");
    panel.id = "tcdd-seat-panel-v35";
    panel.style.cssText =
      "position:fixed;top:12px;right:12px;z-index:2147483647;" +
      "width:390px;padding:10px 12px;border-radius:12px;" +
      "background:rgba(0,0,0,0.85);color:#fff;font:13px/1.4 sans-serif;" +
      "box-shadow:0 10px 25px rgba(0,0,0,0.35);";

    // lang="tr-TR" eklenerek tarayıcının 24 saat formatını kullanması sağlandı
    panel.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
        <div style="font-weight:700;">TCDD Koltuk Yakalama </div>
        <label style="display:flex;align-items:center;gap:6px;user-select:none;">
          <input id="tcdd-enabled" type="checkbox" ${settings.enabled ? "checked" : ""} />
          <span>Aktif</span>
        </label>
      </div>

      <div style="opacity:.9;margin-top:8px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <span>Saat:</span>
        <input id="tcdd-start" type="time" lang="tr-TR" value="${settings.timeWindowStart}"
          style="padding:4px 6px;border-radius:8px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#fff; cursor:pointer;">
        <span>–</span>
        <input id="tcdd-end" type="time" lang="tr-TR" value="${settings.timeWindowEnd}"
          style="padding:4px 6px;border-radius:8px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#fff; cursor:pointer;">
        <button id="tcdd-save"
          style="margin-left:auto;padding:5px 10px;border-radius:10px;border:0;background:#2bff7a;color:#000;cursor:pointer;font-weight:700;">
          Kaydet
        </button>
      </div>

      <div id="tcdd-status" style="margin-top:8px;">Hazırlanıyor…</div>
      <div id="tcdd-meta" style="opacity:.85;margin-top:6px;"></div>
      <div id="tcdd-list" style="margin-top:8px;"></div>
    `;

    document.body.appendChild(panel);

    const enabledEl = panel.querySelector("#tcdd-enabled");
    const startEl = panel.querySelector("#tcdd-start");
    const endEl = panel.querySelector("#tcdd-end");
    const saveEl = panel.querySelector("#tcdd-save");

    enabledEl.addEventListener("change", () => {
      settings.enabled = !!enabledEl.checked;
      saveSettings();
      nextReloadAt = now() + settings.refreshMs;
      scanOnce();
    });

    saveEl.addEventListener("click", () => {
      // type="time" zaten geçerli bir HH:mm formatı döndürür, boşsa eski ayarı koruruz.
      settings.timeWindowStart = startEl.value || settings.timeWindowStart;
      settings.timeWindowEnd = endEl.value || settings.timeWindowEnd;

      saveSettings();
      nextReloadAt = now() + settings.refreshMs;
      scanOnce();
    });

    return true;
  }

  function panelEls() {
    const p = document.getElementById("tcdd-seat-panel-v35");
    return {
      statusEl: p ? p.querySelector("#tcdd-status") : null,
      metaEl: p ? p.querySelector("#tcdd-meta") : null,
      listEl: p ? p.querySelector("#tcdd-list") : null
    };
  }

  // Scan
  function scanOnce() {
    injectStylesOnce();
    ensurePanel();

    const { statusEl, metaEl, listEl } = panelEls();
    if (!statusEl || !metaEl || !listEl) return;

    if (isStopPage()) {
      clearHighlights();
      statusEl.textContent = "⛔ Koltuk Haritası: Script durdu.";
      metaEl.textContent = `Sayfa: ${location.pathname}`;
      listEl.innerHTML = "";
      return;
    }

    if (!settings.enabled) {
      clearHighlights();
      statusEl.textContent = "⏸️ Kapalı";
      metaEl.textContent = "";
      listEl.innerHTML = "";
      return;
    }

    if (!isListPage()) {
      clearHighlights();
      statusEl.textContent = "ℹ️ Sadece sefer listesinde çalışır.";
      metaEl.textContent = `Sayfa: ${location.pathname}`;
      listEl.innerHTML = "";
      return;
    }

    clearHighlights();

    const allButtons = Array.from(document.querySelectorAll('button[id^="sefer-"]'));
    let timeNotFound = 0;
    let timeOut = 0;
    const hits = [];
    const processedCards = new Set(); // Aynı kartı birden fazla kez yeşile boyamamak için

    for (const b of allButtons) {
      const dep = extractDepartureTime(b);
      if (!dep) { timeNotFound++; continue; }

      const inTime = isInTimeWindow(dep, settings.timeWindowStart, settings.timeWindowEnd);

      // Butonun bulunduğu asıl sefer çerçevesini bul
      const tripCard = b.closest('.mdc-card, .card, .v-card, [class*="sefer-karti"], [class*="list-item"]') ||
                       b.parentElement.parentElement.parentElement.parentElement;

      if (inTime) {
        // Önce Ekonomi mi ve Boş yer var mı diye kontrol et
        const isEco = isEconomyButton(b);
        if (settings.onlyEconomy && !isEco) continue;

        const seatSpan = b.querySelector("span.emptySeat");
        if (!seatSpan) continue;

        const seat = parseSeatCount(seatSpan.textContent);
        if (seat >= settings.minSeat) {

          // 1. İşlem: Butonu yeşille
          b.classList.add("tcdd-hit-economy");

          // 2. İşlem: ŞİMDİ tüm kartı yeşille (çünkü hem saat uydu hem bilet var)
          if (tripCard && !processedCards.has(tripCard)) {
            tripCard.classList.add("tcdd-hit-time");
            processedCards.add(tripCard);
          }

          hits.push({ seferId: b.id || dep, depTime: dep, seatCount: seat, el: b });
        }
      } else {
        timeOut++;
      }
    }

    hits.sort((a, b) => (hhmmToMin(a.depTime) ?? 1e9) - (hhmmToMin(b.depTime) ?? 1e9));

    const secsLeft = Math.max(0, Math.ceil((nextReloadAt - now()) / 1000));
    metaEl.textContent =
      `Son tarama: ${new Date().toLocaleTimeString("tr-TR")} | Yenilemeye: ${secsLeft}s | Hedef Saat İçi: ${processedCards.size} sefer`;

    if (hits.length) {
      statusEl.innerHTML = `✅ <b>${hits.length}</b> uygun bilet bulundu (EKONOMİ).`;

      listEl.innerHTML = hits.slice(0, 10).map(h => `
        <div style="padding:6px 0;border-top:1px solid rgba(255,255,255,0.12);">
          <div style="font-weight:700;">${h.depTime} — ${h.seferId}</div>
          <div style="opacity:.9;">Boş: <b>${h.seatCount}</b></div>
        </div>
      `).join("");

      nextReloadAt = now() + settings.refreshMs;

      const top = hits[0];
      if (canNotify(top.seferId)) {
        beep();
        notify("TCDD: EKONOMİ boş koltuk!", `${top.depTime} • Boş: ${top.seatCount}`);
        markNotified(top.seferId);
      }

      top.el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    statusEl.textContent = "⏳ Uygun sefer yok. Otomatik yenileme aktif.";
    listEl.innerHTML = "";

    if (now() >= nextReloadAt) {
      nextReloadAt = now() + settings.refreshMs;
      location.reload();
    }
  }

  // SPA route change
  function installRouteHooks() {
    const _push = history.pushState;
    const _replace = history.replaceState;
    history.pushState = function () { _push.apply(this, arguments); setTimeout(scanOnce, 250); };
    history.replaceState = function () { _replace.apply(this, arguments); setTimeout(scanOnce, 250); };
    window.addEventListener("popstate", () => setTimeout(scanOnce, 250));
  }

  // Boot
  injectStylesOnce();
  ensurePanel();
  installRouteHooks();
  scanOnce();
  setInterval(scanOnce, settings.scanEveryMs);
})();