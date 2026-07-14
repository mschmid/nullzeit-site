// Animated HTML re-creation of the app's guided demo dive: a scripted 30 m
// decompression dive at x60 (1 s of real time = 1 min of dive time), looping.
// The numbers are a hand-tuned approximation of what the in-app demo shows,
// not a live ZH-L16C computation — the page never pretends otherwise.
(function () {
  "use strict";
  var watch = document.getElementById("demo-dive");
  if (!watch) return;

  function $(id) { return document.getElementById(id); }
  var el = {
    time: $("dd-time"), depth: $("dd-depth"), badge: $("dd-badge"), stats: $("dd-stats"),
    cardNdl: $("dd-card-ndl"), ndl: $("dd-ndl"),
    cardDeco: $("dd-card-deco"), stop: $("dd-stop"), tts: $("dd-tts"),
    cardSafety: $("dd-card-safety"), safety: $("dd-safety"),
    cardSurface: $("dd-card-surface"),
    play: $("dd-play")
  };

  // Piecewise-linear keyframes over dive time in minutes.
  function kf(t, pts) {
    if (t <= pts[0][0]) return pts[0][1];
    for (var i = 1; i < pts.length; i++) {
      if (t <= pts[i][0]) {
        var a = pts[i - 1], b = pts[i];
        return a[1] + (b[1] - a[1]) * (t - a[0]) / (b[0] - a[0]);
      }
    }
    return pts[pts.length - 1][1];
  }

  var LOOP = 30;        // real seconds per loop = dive minutes incl. surface hold
  var SURFACE = 25;     // dive minute the diver surfaces
  var DECO_ON = 11, DECO_OFF = 22.7, SAFETY_OFF = 23.7;

  var DEPTH = [[0, 0], [1.5, 30], [16, 30], [18.4, 6], [19.4, 6], [19.7, 3], [23.7, 3], [25, 0], [99, 0]];
  var NDL   = [[0, 99], [1.5, 12], [4.3, 8], [8, 5], [11, 0]];
  var NDL2  = [[22.7, 8], [25, 14]];
  var GF    = [[0, 4], [1.5, 14], [4.3, 31], [8, 55], [11, 80], [16, 118], [18.4, 106], [19.4, 101],
               [19.7, 99], [22.7, 88], [25, 83], [99, 83]];
  var CEIL  = [[11, 0.9], [14, 3.4], [16, 4.5], [18.4, 3.9], [19.4, 3.1], [19.7, 2.8], [22.7, 0]];
  var TTS   = [[11, 2], [13, 4], [14, 6], [16, 8], [18.4, 6], [19.4, 5], [19.7, 5], [22.7, 1]];

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  function showCard(card) {
    var cards = [el.cardNdl, el.cardDeco, el.cardSafety, el.cardSurface];
    for (var i = 0; i < cards.length; i++) cards[i].hidden = cards[i] !== card;
  }

  function setBadge(text) {
    if (text) { el.badge.textContent = text; el.badge.classList.add("on"); }
    else el.badge.classList.remove("on");
  }

  function render(t) {
    var d = kf(t, DEPTH);
    var deco = t >= DECO_ON && t < DECO_OFF;
    var tc = Math.min(t, SURFACE); // dive clock stops at the surface
    var mm = Math.floor(tc), ss = Math.floor((tc - mm) * 60);

    el.time.textContent = mm + ":" + pad(ss);
    el.depth.textContent = d.toFixed(1);
    el.depth.classList.toggle("warn", deco);
    watch.classList.toggle("deco", deco);

    var maxd = t >= 1.5 ? 30 : d;
    var stats = "MAX " + maxd.toFixed(1) + " GF " + Math.round(kf(t, GF)) + "%";
    if (deco) stats += " CEIL " + kf(t, CEIL).toFixed(1);
    el.stats.textContent = stats;

    if (t >= SURFACE) {
      setBadge("");
      showCard(el.cardSurface);
    } else if (deco) {
      setBadge("DECOMPRESSION");
      var sd, sm;
      if (t < 14) { sd = 3; sm = t < 12.5 ? 1 : 2; }
      else if (t < 19.4) { sd = 6; sm = 1; }
      else { sd = 3; sm = Math.ceil(DECO_OFF - t); }
      el.stop.textContent = sd + " m · " + sm + " min";
      el.tts.textContent = Math.max(1, Math.round(kf(t, TTS)));
      showCard(el.cardDeco);
    } else if (t >= DECO_OFF && t < SAFETY_OFF) {
      setBadge("");
      var rem = Math.max(0, Math.round((SAFETY_OFF - t) * 60));
      el.safety.textContent = "3 m · " + Math.floor(rem / 60) + ":" + pad(rem % 60);
      showCard(el.cardSafety);
    } else {
      setBadge(t >= 8 && t < DECO_ON ? "▲ ASCEND SOON" : "");
      var n = t < DECO_ON ? kf(t, NDL) : kf(t, NDL2);
      el.ndl.textContent = Math.max(0, Math.ceil(n));
      showCard(el.cardNdl);
    }
  }

  var raf = null, startTs = null, elapsed = 0;

  function frame(ts) {
    if (startTs === null) startTs = ts - elapsed;
    elapsed = ts - startTs;
    render((elapsed / 1000) % LOOP);
    raf = requestAnimationFrame(frame);
  }
  function play() { if (raf === null) raf = requestAnimationFrame(frame); }
  function pause() {
    if (raf !== null) { cancelAnimationFrame(raf); raf = null; startTs = null; }
  }

  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var armed = !reduced;

  if (reduced && el.play) {
    el.play.hidden = false;
    el.play.addEventListener("click", function () {
      el.play.hidden = true;
      armed = true;
      play();
    });
  }

  // Run only while the widget is actually on screen.
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      if (!armed) return;
      if (entries[0].isIntersecting) play(); else pause();
    }, { threshold: 0.15 }).observe(watch);
  } else if (armed) {
    play();
  }
})();
