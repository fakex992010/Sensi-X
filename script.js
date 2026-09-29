// ==========================================================
// SensiX — Sensitivity Engine v10 (4-Layer + Smart Auto-Detect)
// ==========================================================

var brandSelect     = document.getElementById("brand");
var modelSelect     = document.getElementById("model");
var fingersSelect   = document.getElementById("fingers");
var playstyleSelect = document.getElementById("playstyle");
var searchBox       = document.getElementById("searchBox");
var suggestions     = document.getElementById("suggestions");
var activeIndex     = -1;

if (typeof devices === "undefined") {
  console.error("devices.js did not load. Check script order in index.html.");
}

// ---------- TOAST ----------
function showToast(message, type) {
  type = type || "warning";
  var container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  var icon = "⚠️";
  if (type === "success") icon = "✅";
  if (type === "error") icon = "❌";
  var toast = document.createElement("div");
  toast.className = "toast " + type;
  toast.innerHTML = '<span class="toast-icon">' + icon + '</span><span>' + message + '</span>';
  container.appendChild(toast);
  setTimeout(function () {
    toast.classList.add("hide");
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 4500);
}

// ---------- POPULATE BRANDS ----------
if (brandSelect && typeof devices !== "undefined") {
  Object.keys(devices).forEach(function (brand) {
    var opt = document.createElement("option");
    opt.value = brand;
    opt.textContent = brand;
    brandSelect.appendChild(opt);
  });
}

// ---------- POPULATE MODELS ----------
function populateModels(filterText) {
  if (!modelSelect) return;
  filterText = filterText || "";
  var brand = brandSelect ? brandSelect.value : "";
  modelSelect.innerHTML = '<option value="">-- Select Model --</option>';

  if (!brand || typeof devices === "undefined" || !devices[brand]) {
    modelSelect.innerHTML = '<option value="">-- Select Brand First --</option>';
    return;
  }

  var search = filterText.toLowerCase().trim();
  var list = devices[brand];

  for (var i = 0; i < list.length; i++) {
    var device = list[i];
    if (search && device.model.toLowerCase().indexOf(search) === -1) continue;
    var opt = document.createElement("option");
    opt.value = device.model;
    opt.textContent = device.model;
    opt.dataset.ram  = device.ram;
    opt.dataset.hz   = device.hz;
    opt.dataset.size = device.size;
    opt.dataset.tier = device.tier;
    opt.dataset.brand = brand;
    modelSelect.appendChild(opt);
  }
}

if (brandSelect) {
  brandSelect.addEventListener("change", function () {
    populateModels("");
    if (searchBox) searchBox.value = "";
  });
}

// ---------- SEARCH AUTOCOMPLETE ----------
function highlightMatch(text, query) {
  if (!query) return text;
  var idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return text.substring(0, idx) +
    "<mark>" + text.substring(idx, idx + query.length) + "</mark>" +
    text.substring(idx + query.length);
}

function buildSuggestions(query) {
  if (!suggestions) return;
  var q = query.toLowerCase().trim();
  if (!q) {
    suggestions.classList.remove("show");
    suggestions.innerHTML = "";
    return;
  }
  if (typeof devices === "undefined") return;

  var results = [];
  for (var brand in devices) {
    if (!devices.hasOwnProperty(brand)) continue;
    var list = devices[brand];
    for (var i = 0; i < list.length; i++) {
      var d = list[i];
      if (d.model.toLowerCase().indexOf(q) !== -1) {
        results.push({ brand: brand, device: d });
        if (results.length >= 15) break;
      }
    }
    if (results.length >= 15) break;
  }

  if (results.length === 0) {
    suggestions.innerHTML = '<div class="suggestion-empty">No phones found for "' + query + '"</div>';
    suggestions.classList.add("show");
    return;
  }

  var html = "";
  for (var j = 0; j < results.length; j++) {
    var r = results[j];
    html += '<div class="suggestion-item" data-brand="' + r.brand + '" data-model="' + r.device.model + '">' +
      '<span class="suggestion-model">' + highlightMatch(r.device.model, query) + '</span>' +
      '<span class="suggestion-brand">' + r.brand + '</span>' +
      '</div>';
  }
  suggestions.innerHTML = html;
  suggestions.classList.add("show");
  activeIndex = -1;

  var items = suggestions.querySelectorAll(".suggestion-item");
  for (var k = 0; k < items.length; k++) {
    items[k].addEventListener("click", function () {
      selectSuggestion(this.dataset.brand, this.dataset.model);
    });
  }
}

function selectSuggestion(brand, model) {
  if (brandSelect) brandSelect.value = brand;
  populateModels("");
  if (modelSelect) modelSelect.value = model;
  if (searchBox) searchBox.value = model;
  if (suggestions) {
    suggestions.classList.remove("show");
    suggestions.innerHTML = "";
  }
  showToast("Selected: " + model, "success");
}

if (searchBox) {
  searchBox.addEventListener("input", function () { buildSuggestions(searchBox.value); });
  searchBox.addEventListener("keydown", function (e) {
    if (!suggestions || !suggestions.classList.contains("show")) return;
    var items = suggestions.querySelectorAll(".suggestion-item");
    if (items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % items.length;
      updateActive(items);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + items.length) % items.length;
      updateActive(items);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && items[activeIndex]) items[activeIndex].click();
      else if (items[0]) items[0].click();
    } else if (e.key === "Escape") {
      suggestions.classList.remove("show");
      activeIndex = -1;
    }
  });
  document.addEventListener("click", function (e) {
    if (suggestions && !suggestions.contains(e.target) && e.target !== searchBox) {
      suggestions.classList.remove("show");
    }
  });
  searchBox.addEventListener("focus", function () {
    if (searchBox.value.trim()) buildSuggestions(searchBox.value);
  });
}

function updateActive(items) {
  for (var i = 0; i < items.length; i++) items[i].classList.remove("active");
  if (activeIndex >= 0 && items[activeIndex]) {
    items[activeIndex].classList.add("active");
    items[activeIndex].scrollIntoView({ block: "nearest" });
  }
}

// ---------- HELPERS ----------
function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }
function safeInt(v, fallback) { var n = parseInt(v, 10); return isNaN(n) ? fallback : n; }
function safeFloat(v, fallback) { var n = parseFloat(v); return isNaN(n) ? fallback : n; }
function setText(id, value) { var el = document.getElementById(id); if (el) el.textContent = value; }

// ==========================================================
// LAYER 1 — TOUCH RESPONSE FOUNDATION
// Base values from refresh rate + screen size + RAM
// ==========================================================
function getTouchBase(hz, ram, size, isIOS) {
  var general, reddot, sc2x, sc4x, awm, freelook;

  if (hz >= 165) {
    general = 55; reddot = 50; sc2x = 45; sc4x = 40; awm = 30; freelook = 45;
  } else if (hz >= 144) {
    general = 65; reddot = 60; sc2x = 55; sc4x = 50; awm = 35; freelook = 55;
  } else if (hz >= 120) {
    general = 75; reddot = 72; sc2x = 65; sc4x = 58; awm = 40; freelook = 62;
  } else if (hz >= 90) {
    general = 88; reddot = 85; sc2x = 78; sc4x = 70; awm = 48; freelook = 72;
  } else {
    general = 105; reddot = 100; sc2x = 92; sc4x = 82; awm = 58; freelook = 85;
  }

  if (ram <= 2)      { general += 10; reddot += 8; sc2x += 8; }
  else if (ram <= 3) { general += 6;  reddot += 5; sc2x += 5; }
  else if (ram <= 4) { general += 3;  reddot += 2; sc2x += 2; }
  else if (ram >= 12){ general -= 5;  reddot -= 5; sc2x -= 4; }

  if (size <= 5.0)      { general += 12; reddot += 10; sc2x += 8; }
  else if (size <= 5.5) { general += 8;  reddot += 7;  sc2x += 6; }
  else if (size <= 6.0) { general += 4;  reddot += 3;  sc2x += 3; }
  else if (size >= 6.8) { general -= 5;  reddot -= 4;  sc2x -= 3; }
  else if (size >= 7.0) { general -= 8;  reddot -= 6;  sc2x -= 5; }

  if (isIOS) {
    general -= 6; reddot -= 5; sc2x -= 4; sc4x -= 3; awm -= 2; freelook -= 4;
  }

  return {
    general: general, reddot: reddot, sc2x: sc2x,
    sc4x: sc4x, awm: awm, freelook: freelook
  };
}

// ==========================================================
// LAYER 2 — PLAYSTYLE MODIFIERS
// ==========================================================
function getPlaystyleMod(style) {
  if (style === "headshot") {
    return { general: +25, reddot: +35, sc2x: +25, sc4x: +10, awm: -10, freelook: +15 };
  }
  if (style === "aggressive") {
    return { general: +10, reddot: +15, sc2x: +12, sc4x: +5, awm: -15, freelook: +20 };
  }
  if (style === "freestyle") {
    return { general: +20, reddot: +25, sc2x: +18, sc4x: +8, awm: -20, freelook: +25 };
  }
  if (style === "sniper") {
    return { general: -20, reddot: -15, sc2x: -20, sc4x: -25, awm: +30, freelook: -25 };
  }
  return { general: 0, reddot: 0, sc2x: 0, sc4x: 0, awm: 0, freelook: 0 };
}

// ==========================================================
// LAYER 3 — FINGER COUNT MODIFIER
// ==========================================================
function getFingerMod(fingers) {
  if (fingers === "2") return { general: +8, reddot: +8, sc2x: +6, sc4x: +6, awm: 0, freelook: +12 };
  if (fingers === "3") return { general: +4, reddot: +4, sc2x: +3, sc4x: +3, awm: 0, freelook: +6 };
  if (fingers === "5") return { general: -6, reddot: -6, sc2x: -4, sc4x: -4, awm: 0, freelook: -6 };
  return { general: 0, reddot: 0, sc2x: 0, sc4x: 0, awm: 0, freelook: 0 };
}

// ==========================================================
// LAYER 4 — DPI CALCULATOR (Android only)
// ==========================================================
function calculateDPI(hz, size, tier) {
  var dpi;
  if (hz >= 165)      dpi = 380;
  else if (hz >= 144) dpi = 410;
  else if (hz >= 120) dpi = 460;
  else if (hz >= 90)  dpi = 520;
  else                dpi = 600;

  if (size <= 5.5)      dpi += 40;
  else if (size >= 6.8) dpi -= 30;

  if (tier === "flagship") dpi -= 25;
  if (tier === "low")      dpi += 30;

  return clamp(dpi, 350, 850);
}

// ==========================================================
// BUTTON SIZES
// ==========================================================
function getButtonSizes(style, fingers, size) {
  var base = { fire: 45, drag: 40, scope: 35, jump: 30, crouch: 30, trans: 30 };

  if (style === "aggressive") {
    base.fire = 50; base.drag = 45; base.scope = 35; base.jump = 30; base.crouch = 30; base.trans = 35;
  } else if (style === "freestyle") {
    base.fire = 45; base.drag = 50; base.scope = 30; base.jump = 35; base.crouch = 35; base.trans = 25;
  } else if (style === "headshot") {
    base.fire = 42; base.drag = 45; base.scope = 32; base.jump = 28; base.crouch = 30; base.trans = 30;
  } else if (style === "sniper") {
    base.fire = 40; base.drag = 35; base.scope = 40; base.jump = 30; base.crouch = 35; base.trans = 30;
  }

  if (fingers === "2")      { base.fire += 5; base.drag += 5; base.scope += 3; base.jump += 5; base.crouch += 5; }
  else if (fingers === "3") { base.fire += 2; base.drag += 2; base.scope += 2; }
  else if (fingers === "5") { base.fire -= 5; base.drag -= 5; base.scope -= 3; base.jump -= 3; base.crouch -= 3; }

  if (size <= 5.5)      { base.fire += 5; base.drag += 5; base.scope += 5; }
  else if (size >= 6.8) { base.fire -= 3; base.drag -= 3; }

  base.fire   = clamp(base.fire,   25, 70);
  base.drag   = clamp(base.drag,   25, 70);
  base.scope  = clamp(base.scope,  20, 60);
  base.jump   = clamp(base.jump,   20, 55);
  base.crouch = clamp(base.crouch, 20, 55);
  base.trans  = clamp(base.trans,  10, 60);

  return base;
}

// ==========================================================
// HUD RECOMMENDATION
// ==========================================================
function getHUDRecommendation(fingers, style) {
  var layouts = {
    "2": "2-Finger Thumb Setup — Left thumb moves, right thumb aims & fires. Best for beginners.",
    "3": "3-Finger Claw — Left thumb moves, left index fires, right thumb aims. Good for rushers.",
    "4": "4-Finger Full Claw — Left thumb moves, left index fires, right thumb aims, right index scopes/jumps. Competitive standard.",
    "5": "5-Finger Pro Claw — All fingers active. Maximum control for freestyle and pro play."
  };
  var tips = {
    "aggressive": [
      "Fire Button size: 45–50% (bigger = faster tap).",
      "Drag Fire Button size: 40%.",
      "Keep scope button close to right thumb.",
      "Enable 'Quick Weapon Switch' on screen edge."
    ],
    "freestyle": [
      "Enable separate Drag Fire Button (top-left).",
      "Fire Button transparency: 30%.",
      "Turn 'Precise on Scope' OFF for drag headshots.",
      "Keep gyroscope OFF — pure thumb control."
    ],
    "headshot": [
      "Red Dot sensitivity must be HIGH for one-taps.",
      "Scope button at ~35% size, near right thumb.",
      "Practice drag shot: aim → tap → drag up instantly.",
      "Enable 'Auto-Headshot' assistance if available."
    ],
    "sniper": [
      "AWM Scope sensitivity LOW (40–55) for micro-aim.",
      "Enable gyroscope for fine sniper aim (optional).",
      "Use 'Scope Pro' setting ON.",
      "Keep crouch button reachable for quickscope."
    ],
    "balanced": [
      "Balanced setup — tweak ±10 based on feel.",
      "Fire Button size: 40%.",
      "Test both 3-finger and 4-finger layouts.",
      "Enable 'Precise on Scope' for stable aim."
    ]
  };
  return {
    layout: layouts[fingers] || layouts["4"],
    tips: tips[style] || tips["balanced"]
  };
}

// ==========================================================
// COACH TIPS
// ==========================================================
function getCoachTips(tier, style, hz, isIPhone) {
  var tips = [];
  if (hz <= 60) {
    tips.push("📉 Your screen is 60 Hz — expected for older/budget phones. Keep graphics on 'Smooth'.");
    tips.push("🎯 Higher sensitivity compensates for your screen's slower response.");
  } else if (hz >= 120) {
    tips.push("🚀 High refresh screen — you can run 90/120 FPS in Free Fire settings.");
    tips.push("🎯 Lower sensitivity works better for consistent headshots.");
  } else {
    tips.push("📊 90 Hz screen — solid middle ground. Lock 60 FPS for stability.");
  }
  if (isIPhone) {
    tips.push("📱 iPhone detected — iOS does not support DPI adjustment. Your values are tuned for iOS touch response.");
  }
  if (style === "headshot") tips.push("💥 One-tap drill: Red Dot + drag upward = instant headshot.");
  if (style === "sniper") tips.push("🔭 Crouch before firing for zero recoil.");
  if (style === "freestyle") tips.push("🌀 Master 180° spin: quick swipe + fire = close-range killer.");
  if (style === "aggressive") tips.push("⚔️ Rush with SMG — high general sens tracks moving enemies.");
  return tips;
}

// ==========================================================
// GENERATE
// ==========================================================
var generateBtn = document.getElementById("generateBtn");

if (generateBtn) {
  generateBtn.addEventListener("click", function () {
    if (typeof devices === "undefined") {
      showToast("Device database failed to load. Refresh the page.", "error");
      return;
    }
    if (!modelSelect || !modelSelect.value) {
      showToast("Please select a phone model!", "warning");
      return;
    }

    var modelOpt = modelSelect.options[modelSelect.selectedIndex];
    var style = playstyleSelect ? playstyleSelect.value : "balanced";
    var fingers = fingersSelect ? fingersSelect.value : "4";

    var hz   = safeInt(modelOpt.dataset.hz, 60);
    var ram  = safeInt(modelOpt.dataset.ram, 4);
    var size = safeFloat(modelOpt.dataset.size, 6.5);
    var tier = modelOpt.dataset.tier || "mid";

    var isIPhone = modelOpt.value.toLowerCase().indexOf("iphone") !== -1;

    var base = getTouchBase(hz, ram, size, isIPhone);
    var styleMod = getPlaystyleMod(style);
    var fingerMod = getFingerMod(fingers);

    var result = {
      general:  clamp(base.general  + styleMod.general  + fingerMod.general,  1, 200),
      reddot:   clamp(base.reddot   + styleMod.reddot   + fingerMod.reddot,   1, 200),
      sc2x:     clamp(base.sc2x     + styleMod.sc2x     + fingerMod.sc2x,     1, 200),
      sc4x:     clamp(base.sc4x     + styleMod.sc4x     + fingerMod.sc4x,     1, 200),
      awm:      clamp(base.awm      + styleMod.awm      + fingerMod.awm,      1, 200),
      freelook: clamp(base.freelook + styleMod.freelook + fingerMod.freelook, 1, 200),
      dpi:      calculateDPI(hz, size, tier)
    };

    setText("r-general", result.general);
    setText("r-reddot", result.reddot);
    setText("r-2x", result.sc2x);
    setText("r-4x", result.sc4x);
    setText("r-awm", result.awm);
    setText("r-freelook", result.freelook);

    var dpiRow = document.getElementById("r-dpi").closest(".result-item");
    if (dpiRow) {
      if (isIPhone) {
        dpiRow.style.display = "none";
      } else {
        dpiRow.style.display = "flex";
        setText("r-dpi", result.dpi);
      }
    }

    setText("i-ram", ram + " GB");
    setText("i-hz", hz + " Hz");
    setText("i-size", size + '"');
    setText("i-dpi", isIPhone ? "iOS (No DPI)" : tier.toUpperCase());

    var buttons = getButtonSizes(style, fingers, size);
    setText("b-fire",   buttons.fire + "%");
    setText("b-drag",   buttons.drag + "%");
    setText("b-scope",  buttons.scope + "%");
    setText("b-jump",   buttons.jump + "%");
    setText("b-crouch", buttons.crouch + "%");
    setText("b-trans",  buttons.trans + "%");

    var hud = getHUDRecommendation(fingers, style);
    setText("hud-layout", hud.layout);

    var hudList = document.getElementById("hud-tips");
    if (hudList) {
      hudList.innerHTML = "";
      for (var i = 0; i < hud.tips.length; i++) {
        var li = document.createElement("li");
        li.textContent = hud.tips[i];
        hudList.appendChild(li);
      }
    }

    var coachList = document.getElementById("coach-tips");
    if (coachList) {
      coachList.innerHTML = "";
      var coach = getCoachTips(tier, style, hz, isIPhone);
      for (var j = 0; j < coach.length; j++) {
        var li2 = document.createElement("li");
        li2.textContent = coach[j];
        coachList.appendChild(li2);
      }
    }

    var card = document.getElementById("resultCard");
    if (card) {
      card.style.display = "block";
      card.scrollIntoView({ behavior: "smooth" });

      var copyText = "=== SENSIX SETUP ===\n" +
        "Device: " + modelOpt.value + "\n" +
        "Playstyle: " + style.toUpperCase() + "\n" +
        "Fingers: " + fingers + "\n\n" +
        "SENSITIVITY:\n" +
        "General: " + result.general + "\n" +
        "Red Dot: " + result.reddot + "\n" +
        "2x Scope: " + result.sc2x + "\n" +
        "4x Scope: " + result.sc4x + "\n" +
        "AWM Scope: " + result.awm + "\n" +
        "Free Look: " + result.freelook + "\n";

      if (!isIPhone) {
        copyText += "DPI: " + result.dpi + "\n";
      } else {
        copyText += "(iOS — no DPI adjustment)\n";
      }

      copyText += "\nBUTTON SIZES:\n" +
        "Fire Button: " + buttons.fire + "%\n" +
        "Drag Fire: " + buttons.drag + "%\n" +
        "Scope: " + buttons.scope + "%\n" +
        "Jump: " + buttons.jump + "%\n" +
        "Crouch: " + buttons.crouch + "%\n" +
        "Transparency: " + buttons.trans + "%\n\n" +
        "HUD: " + hud.layout + "\n\n" +
        "Made with SensiX";

      card.dataset.values = copyText;
    }
  });
}

// ---------- COPY ----------
var copyBtn = document.getElementById("copyBtn");
if (copyBtn) {
  copyBtn.addEventListener("click", function () {
    var card = document.getElementById("resultCard");
    if (!card) return;
    var text = card.dataset.values || "";
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function () {
        copyBtn.textContent = "✅ Done";
        showToast("Setup copied to clipboard!", "success");
        setTimeout(function () { copyBtn.textContent = "📋 Copy"; }, 1500);
      });
    }
  });
}

// ---------- WHATSAPP ----------
var waBtn = document.getElementById("waBtn");
if (waBtn) {
  waBtn.addEventListener("click", function () {
    var card = document.getElementById("resultCard");
    if (!card) return;
    var text = card.dataset.values || "";
    window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank");
  });
}

// ---------- SHARE LINK ----------
var linkBtn = document.getElementById("linkBtn");
if (linkBtn) {
  linkBtn.addEventListener("click", function () {
    var model = modelSelect ? modelSelect.value : "";
    var style = playstyleSelect ? playstyleSelect.value : "balanced";
    var fingers = fingersSelect ? fingersSelect.value : "4";
    if (!model) { showToast("Generate a setup first!", "warning"); return; }

    var url = window.location.origin + window.location.pathname +
      "?m=" + encodeURIComponent(model) +
      "&s=" + encodeURIComponent(style) +
      "&f=" + encodeURIComponent(fingers);

    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(function () {
        linkBtn.textContent = "✅ Copied";
        showToast("Link copied to clipboard!", "success");
        setTimeout(function () { linkBtn.textContent = "🔗 Share Link"; }, 1500);
      });
    }
  });
}

// ---------- COMPARE ----------
var compareBtn = document.getElementById("compareBtn");
if (compareBtn) {
  compareBtn.addEventListener("click", function () {
    var card = document.getElementById("resultCard");
    if (!card || card.style.display === "none") {
      showToast("Please generate your SensiX setup first!", "warning");
      return;
    }

    var target = {
      general:  safeInt(document.getElementById("r-general").textContent, 0),
      reddot:   safeInt(document.getElementById("r-reddot").textContent, 0),
      sc2x:     safeInt(document.getElementById("r-2x").textContent, 0),
      sc4x:     safeInt(document.getElementById("r-4x").textContent, 0),
      awm:      safeInt(document.getElementById("r-awm").textContent, 0),
      freelook: safeInt(document.getElementById("r-freelook").textContent, 0),
      dpi:      safeInt(document.getElementById("r-dpi").textContent, 0)
    };

    function getVal(id) {
      var el = document.getElementById(id);
      if (!el || !el.value) return null;
      var n = parseInt(el.value, 10);
      return isNaN(n) ? null : n;
    }

    var current = {
      general:  getVal("c-general"),
      reddot:   getVal("c-reddot"),
      sc2x:     getVal("c-2x"),
      sc4x:     getVal("c-4x"),
      awm:      getVal("c-awm"),
      freelook: getVal("c-freelook"),
      dpi:      getVal("c-dpi")
    };

    var labels = {
      general: "General", reddot: "Red Dot", sc2x: "2x Scope",
      sc4x: "4x Scope", awm: "AWM Scope", freelook: "Free Look", dpi: "DPI"
    };

    var html = "<strong>📊 Comparison (Target vs Your Setup)</strong><br><br>";
    var anyFilled = false;

    for (var key in target) {
      if (!target.hasOwnProperty(key)) continue;
      var c = current[key];
      if (c === null) continue;
      anyFilled = true;
      var diff = c - target[key];
      var abs = Math.abs(diff);
      var cls, msg;
      if (abs <= 5) { cls = "good"; msg = "✅ Perfect"; }
      else if (abs <= 15) { cls = "ok"; msg = "⚠️ Slightly " + (diff > 0 ? "high" : "low") + " by " + abs; }
      else { cls = "bad"; msg = "❌ " + (diff > 0 ? "Too high" : "Too low") + " by " + abs; }
      html += '<div class="' + cls + '"><b>' + labels[key] + ':</b> yours ' + c +
              ' → target ' + target[key] + ' — ' + msg + '</div>';
    }

    if (!anyFilled) html += "<em>Fill in at least one value to compare.</em>";

    var box = document.getElementById("compareResult");
    if (box) {
      box.innerHTML = html;
      box.style.display = "block";
      box.scrollIntoView({ behavior: "smooth" });
    }
  });
}

// ---------- LOAD FROM SHARED URL ----------
window.addEventListener("load", function () {
  if (typeof devices === "undefined") return;
  var p = new URLSearchParams(window.location.search);
  if (!p.has("m")) return;
  var modelName = p.get("m");
  var found = null;
  for (var brand in devices) {
    if (!devices.hasOwnProperty(brand)) continue;
    var list = devices[brand];
    for (var i = 0; i < list.length; i++) {
      if (list[i].model === modelName) {
        found = { brand: brand, device: list[i] };
        break;
      }
    }
    if (found) break;
  }
  if (!found) return;
  if (brandSelect) brandSelect.value = found.brand;
  populateModels();
  if (modelSelect) modelSelect.value = found.device.model;
  if (playstyleSelect) playstyleSelect.value = p.get("s") || "balanced";
  if (fingersSelect)   fingersSelect.value = p.get("f") || "4";
  if (searchBox) searchBox.value = found.device.model;
  if (generateBtn) generateBtn.click();
});

// ==========================================================
// AUTO DETECT v2 — 3-Strategy Detection
// ==========================================================
var autoDetectBtn = document.getElementById("autoDetectBtn");
if (autoDetectBtn) {
  autoDetectBtn.addEventListener("click", function () {
    if (typeof devices === "undefined") { showToast("Device database not loaded.", "error"); return; }

    var ua = navigator.userAgent;
    var uaLower = ua.toLowerCase();
    var matched = null;
    var matchedBy = "";

    // ---------- STRATEGY 1: Keyword match in UA ----------
    var knownKeywords = [
      "redmi", "poco", "xiaomi", "mi ",
      "sm-", "galaxy",
      "rmx", "realme",
      "cph", "oppo", "reno",
      "vivo", "oneplus", "nord",
      "infinix", "tecno", "itel", "honor",
      "huawei", "nova", "mate",
      "moto ", "motorola",
      "nokia", "pixel",
      "iphone", "ipad"
    ];

    for (var k = 0; k < knownKeywords.length; k++) {
      if (uaLower.indexOf(knownKeywords[k]) !== -1) {
        for (var brand in devices) {
          if (!devices.hasOwnProperty(brand)) continue;
          var list = devices[brand];
          for (var i = 0; i < list.length; i++) {
            var modelLower = list[i].model.toLowerCase();
            if (modelLower.indexOf(knownKeywords[k]) !== -1) {
              matched = { brand: brand, device: list[i] };
              matchedBy = "user agent";
              break;
            }
          }
          if (matched) break;
        }
        if (matched) break;
      }
    }

    // ---------- STRATEGY 2: Screen size match ----------
    if (!matched) {
      var screenW = window.screen.width;
      var screenH = window.screen.height;
      var screenSizeInches = Math.sqrt(screenW * screenW + screenH * screenH) / (window.devicePixelRatio * 160);
      screenSizeInches = Math.round(screenSizeInches * 2) / 2;

      if (screenSizeInches > 3.5 && screenSizeInches < 8.5) {
        for (var brand2 in devices) {
          if (!devices.hasOwnProperty(brand2)) continue;
          var list2 = devices[brand2];
          for (var j = 0; j < list2.length; j++) {
            if (Math.abs(list2[j].size - screenSizeInches) < 0.2) {
              matched = { brand: brand2, device: list2[j] };
              matchedBy = "screen size (~" + screenSizeInches + '")';
              break;
            }
          }
          if (matched) break;
        }
      }
    }

    // ---------- STRATEGY 3: iOS fallback ----------
    if (!matched) {
      var isIOS = /iphone|ipad|ipod/.test(uaLower);
      if (isIOS) {
        var iphoneDefault = null;
        if (devices["Apple iPhone"]) {
          for (var m = 0; m < devices["Apple iPhone"].length; m++) {
            if (devices["Apple iPhone"][m].model === "iPhone 13") {
              iphoneDefault = devices["Apple iPhone"][m];
              break;
            }
          }
        }
        if (iphoneDefault) {
          matched = { brand: "Apple iPhone", device: iphoneDefault };
          matchedBy = "iOS default (iPhone 13)";
        }
      }
    }

    // ---------- Handle result ----------
    if (matched) {
      if (brandSelect) brandSelect.value = matched.brand;
      populateModels();
      if (modelSelect) modelSelect.value = matched.device.model;
      if (searchBox) searchBox.value = matched.device.model;
      showToast("Detected: " + matched.device.model + " (via " + matchedBy + ")", "success");
    } else {
      showToast("Couldn't auto-detect. Type your phone model in the search box above.", "warning");
      if (searchBox) {
        searchBox.focus();
        searchBox.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  });
}
