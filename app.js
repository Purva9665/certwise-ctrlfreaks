// CertWise - page code (reads input, calls logic.js, shows results)

const TEAM = "Team Ctrl Freaks · She Solves 3.0";

// verified facts from the monthly refresh (data/live.js, written by refresh/refresh.mjs)
const LIVE_DATA = (typeof LIVE !== "undefined") ? LIVE : { refreshedOn: null, roles: {}, certs: {} };

// never put user text into the page without escaping it
function esc(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function $(id) {
  return document.getElementById(id);
}

function siteOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch (e) {
    return "source";
  }
}

// small line icons, drawn as inline SVG
const ICONS = {
  check: "<path d='M22 11.08V12a10 10 0 1 1-5.93-9.14'/><polyline points='22 4 12 14.01 9 11.01'/>",
  cross: "<circle cx='12' cy='12' r='10'/><line x1='15' y1='9' x2='9' y2='15'/><line x1='9' y1='9' x2='15' y2='15'/>",
  alert: "<path d='M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'/><line x1='12' y1='9' x2='12' y2='13'/><line x1='12' y1='17' x2='12.01' y2='17'/>",
  help: "<circle cx='12' cy='12' r='10'/><path d='M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3'/><line x1='12' y1='17' x2='12.01' y2='17'/>",
  open: "<path d='M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6'/><polyline points='15 3 21 3 21 9'/><line x1='10' y1='14' x2='21' y2='3'/>",
  award: "<circle cx='12' cy='8' r='7'/><polyline points='8.21 13.89 7 23 12 20 17 23 15.79 13.88'/>",
  tag: "<path d='M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z'/><line x1='7' y1='7' x2='7.01' y2='7'/>",
  briefcase: "<rect x='2' y='7' width='20' height='14' rx='2' ry='2'/><path d='M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16'/>",
  bulb: "<path d='M9 18h6'/><path d='M10 22h4'/><path d='M12 2a7 7 0 0 0-4 12.74V17h8v-2.26A7 7 0 0 0 12 2z'/>",
  download: "<path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/><polyline points='7 10 12 15 17 10'/><line x1='12' y1='15' x2='12' y2='3'/>",
  edit: "<path d='M12 20h9'/><path d='M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z'/>",
  moon: "<path d='M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z'/>",
  sun: "<circle cx='12' cy='12' r='5'/><line x1='12' y1='1' x2='12' y2='3'/><line x1='12' y1='21' x2='12' y2='23'/><line x1='4.22' y1='4.22' x2='5.64' y2='5.64'/><line x1='18.36' y1='18.36' x2='19.78' y2='19.78'/><line x1='1' y1='12' x2='3' y2='12'/><line x1='21' y1='12' x2='23' y2='12'/><line x1='4.22' y1='19.78' x2='5.64' y2='18.36'/><line x1='18.36' y1='5.64' x2='19.78' y2='4.22'/>",
  columns: "<path d='M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7m0-18H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7m0-18v18'/>",
  search: "<circle cx='11' cy='11' r='8'/><line x1='21' y1='21' x2='16.65' y2='16.65'/>",
  clock: "<circle cx='12' cy='12' r='10'/><polyline points='12 6 12 12 16 14'/>",
  file: "<path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'/><polyline points='14 2 14 8 20 8'/>",
  share: "<circle cx='18' cy='5' r='3'/><circle cx='6' cy='12' r='3'/><circle cx='18' cy='19' r='3'/><line x1='8.59' y1='13.51' x2='15.42' y2='17.49'/><line x1='15.41' y1='6.51' x2='8.59' y2='10.49'/>",
  copy: "<rect x='9' y='9' width='13' height='13' rx='2' ry='2'/><path d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'/>",
  image: "<rect x='3' y='3' width='18' height='18' rx='2' ry='2'/><circle cx='8.5' cy='8.5' r='1.5'/><polyline points='21 15 16 10 5 21'/>",
  message: "<path d='M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z'/>"
};

function icon(name) {
  return "<svg class='ic' viewBox='0 0 24 24' aria-hidden='true'>" + ICONS[name] + "</svg>";
}

// which icon and short line goes with each result colour
const LEVEL_ICON = { green: "check", amber: "alert", red: "cross", grey: "help" };
const LEVEL_NOTE = {
  green: "Checkable on the issuer's own site",
  amber: "We couldn't confirm it",
  red: "Treat it as fake until proven otherwise",
  grey: "One more step needed"
};
// the same, when the answer came from the issuer itself (live check)
const LIVE_NOTE = {
  green: "The issuer has this certificate on record",
  amber: "The issuer's record doesn't fully match",
  red: "The issuer has no record of it"
};

// list of {name, url} -> links (only http/https links are ever made clickable)
function proofLinks(list) {
  return list.filter(s => /^https?:\/\//.test(s.url))
    .map(s => "<a href='" + esc(s.url) + "' target='_blank' rel='noopener'>" + esc(s.name) + "</a>").join(" · ");
}

// keys of SOURCES in data/roles.js -> links
function sourceLinks(keys) {
  return proofLinks((keys || []).filter(k => SOURCES[k]).map(k => SOURCES[k]));
}

// one verified fact: value, the exact quote, a link to the page and the date it was checked
function factHtml(f, showValue) {
  let html = showValue === false ? "" : "<b>" + esc(f.value) + "</b>";
  html += "<div class='quote'>“" + esc(f.quote) + "”<br>";
  if (/^https?:\/\//.test(f.url)) {
    html += "<a href='" + esc(f.url) + "' target='_blank' rel='noopener'>" + esc(siteOf(f.url)) + "</a>";
  }
  html += " · verified " + esc(f.checkedOn) + "</div>";
  return html;
}

// ---------- setup ----------

function setup() {
  $("checkBtn").addEventListener("click", () => runCheck(true));
  for (const id of ["linkInput", "issuerInput"]) {
    $(id).addEventListener("keydown", e => { if (e.key === "Enter") runCheck(true); });
  }
  setupSmartBox();

  // example chips
  for (const a of document.querySelectorAll(".try")) {
    a.addEventListener("click", e => {
      e.preventDefault();
      $("certInput").value = a.dataset.cert;
      $("linkInput").value = a.dataset.link || "";
      $("issuerInput").value = a.dataset.issuer || "";
      $("moreBox").open = $("linkInput").value !== "" || $("issuerInput").value !== "";
      fileNote("");
      showDetect();
      runCheck(true);
    });
  }

  // the certificate file (photo, screenshot or PDF): choose it, or drag and drop it
  $("maxMb").textContent = MAX_FILE_MB;
  $("qrFile").addEventListener("change", () => {
    if ($("qrFile").files.length > 0) readFile($("qrFile").files[0]);
  });
  const drop = $("drop");
  drop.addEventListener("dragover", e => { e.preventDefault(); drop.classList.add("over"); });
  drop.addEventListener("dragleave", () => drop.classList.remove("over"));
  drop.addEventListener("drop", e => {
    e.preventDefault();
    drop.classList.remove("over");
    if (e.dataTransfer.files.length > 0) readFile(e.dataTransfer.files[0]);
  });

  // scan the QR code with the camera
  $("camBtn").addEventListener("click", startCamera);
  $("camClose").addEventListener("click", stopCamera);

  // is the CertWise API running? then the live check with the issuer is switched on
  findApi();

  // light / dark switch in the navigation
  $("themeBtn").addEventListener("click", () => setTheme(document.documentElement.dataset.theme !== "dark"));
  showThemeButton();

  // browse and compare
  setupBrowse();

  // the navigation opens a view, like the screens of an app
  showCovers();
  setupViews();
  showRecent();

  // numbers in the header and footer come straight from our data files
  const ways = Object.keys(VERIFY_METHODS).filter(k => VERIFY_METHODS[k].domains.length > 0).length;
  countTo($("statCerts"), CERTS.length);
  countTo($("statWays"), ways);
  countTo($("statFake"), FAKE_UNIS.length);
  $("teamLine").textContent = TEAM;
  $("dataInfo").textContent = "Hand-checked facts: " + CERTS.length + " certificates. Recognised issuers for any other certificate: " +
    KNOWN_ISSUERS.length + ". Official ways of verifying: " + ways + ". Live facts last refreshed: " +
    (LIVE_DATA.refreshedOn || "not yet") + ".";
}

// ---------- views: the page works like an app with four screens ----------

const VIEWS = ["check", "browse", "how", "faq", "about"];
// places inside a screen that have their own address: "#privacy" opens the About screen at "Privacy"
const PLACES = { covers: "how", privacy: "about", terms: "about", contact: "about" };

// name = a screen, or a place inside one; remember = also show it in the address bar
function setView(name, remember) {
  const place = PLACES[name] ? name : "";
  if (place) name = PLACES[place];
  if (!VIEWS.includes(name)) name = "check";
  if (document.body.dataset.view !== name) {
    document.body.dataset.view = name;
    window.scrollTo(0, 0);
  }
  for (const a of document.querySelectorAll(".nav-links a[data-go]")) a.classList.toggle("on", a.dataset.go === name);
  if (place) $(place).scrollIntoView({ behavior: calm() ? "auto" : "smooth", block: "start" });
  const hash = "#" + (place || name);
  if (remember && location.hash !== hash) history.replaceState(null, "", hash);
}

function setupViews() {
  for (const a of document.querySelectorAll("[data-go]")) {
    a.addEventListener("click", e => {
      e.preventDefault();
      setView(a.dataset.at || a.dataset.go, true);
    });
  }
  window.addEventListener("hashchange", openHash);
  openHash();
}

// the address can name a screen ("#browse"), a place ("#privacy") or a shared check ("#check?link=...")
function openHash() {
  const shared = readShareHash(location.hash);
  if (!shared) {
    setView(location.hash.slice(1), false);
    return;
  }
  // a shared result is never shown as it was: the same check is run again, here and now
  $("certInput").value = shared.name || shared.link;
  $("linkInput").value = shared.name ? shared.link : "";
  $("issuerInput").value = shared.issuer;
  $("moreBox").open = $("linkInput").value !== "" || shared.issuer !== "";
  showDetect();
  runCheck(true);
}

// ---------- what we can verify (drawn from the same data the checker uses) ----------

function showCovers() {
  const rows = coverRows(VERIFY_METHODS, ["credly", "coursera", "edx"], ONE_KIND_SITES);
  let html = "<table class='covers'><tr><th>Certificates from</th><th>Official site</th><th>What the check does</th></tr>";
  for (const r of rows) {
    html += "<tr><td>" + esc(r.name) + "</td><td>" + esc(r.sites.join(", ")) + "</td><td>" +
      r.does.map(d => "<span class='tag" + (d.startsWith("Asked live") ? " live" : "") + "'>" + esc(d) + "</span>").join(" ") + "</td></tr>";
  }
  html += "<tr><td>Any other certificate with a link</td><td>-</td><td>Copy-cat sites are flagged; scored from three quick answers</td></tr>" +
    "<tr><td>Workshop, participation or paid \"internship\" certificates</td><td>-</td>" +
    "<td>No official record exists, so the result says \"Can't be verified\"</td></tr></table>";
  $("coverTable").innerHTML = html;

  const kinds = [["vendor", "Companies and bodies that own their field"], ["academic", "IIT / IISc"],
                 ["platform", "Learning platforms and programmes"]];
  $("issuerCount").textContent = KNOWN_ISSUERS.length;
  $("issuerList").innerHTML = kinds.map(k => "<p class='small'><b>" + k[1] + "</b></p><div class='works'>" +
    KNOWN_ISSUERS.filter(i => i.type === k[0]).map(i => "<span class='skill'>" + esc(i.name) + "</span>").join("") + "</div>").join("");

  // "works with" under the checker: the name of each verification site, without the kind of link
  const kind = / (digital badge|digital credential|share link|verify link|QR code|certification ID|verification code|member verification|ASPEN verify|verify|CertView \/ Credly|certificate link|certification link|certificate verification)$/i;
  $("worksWith").innerHTML = rows.map(r => "<span class='skill'>" + esc(r.name.replace(kind, "")) + "</span>").join("") +
    "<span class='skill'>+ " + KNOWN_ISSUERS.length + " recognised issuers</span>";
}

// ---------- small things that make the page feel alive ----------

const calm = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// a number that counts up to its value
function countTo(el, target) {
  if (calm()) {
    el.textContent = target;
    return;
  }
  const start = performance.now();
  const step = now => {
    const t = Math.min(1, (now - start) / 900);
    el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
    if (t < 1) requestAnimationFrame(step);
  };
  el.textContent = "0";
  requestAnimationFrame(step);
}

// a short message that slides in at the bottom and goes away by itself
function toast(text) {
  const note = document.createElement("div");
  note.className = "toast";
  note.textContent = text;
  $("toasts").appendChild(note);
  setTimeout(() => note.classList.add("gone"), 2600);
  setTimeout(() => note.remove(), 3100);
}

function scrollToResult() {
  $("result").scrollIntoView({ behavior: calm() ? "auto" : "smooth", block: "start" });
}

// ---------- the smart box: it takes a link, an ID or a name ----------

// what is in the form right now
function readForm() {
  const typed = $("certInput").value.trim();
  const kind = kindOfText(typed, VERIFY_METHODS);
  const inBox = kind === "link" || kind === "id";
  return { name: inBox ? "" : typed, link: inBox ? typed : $("linkInput").value.trim(), issuer: $("issuerInput").value.trim() };
}

const HINTS = [
  "Paste a link or ID, or type the certificate's name",
  "https://www.credly.com/badges/...",
  "AWS Cloud Practitioner",
  "coursera.org/verify/...",
  "140-123-456  (a Red Hat ID)",
  "NPTEL"
];

let suggestAt = -1;      // which suggestion the arrow keys are on (-1 = none)

function setupSmartBox() {
  const box = $("certInput");
  box.addEventListener("input", () => { showDetect(); showSuggest(); });
  box.addEventListener("focus", showSuggest);
  box.addEventListener("blur", () => setTimeout(hideSuggest, 150));     // let a click on a suggestion land first
  box.addEventListener("keydown", e => {
    const rows = $("suggest").querySelectorAll(".sg");
    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && rows.length > 0) {
      e.preventDefault();
      if (e.key === "ArrowDown") suggestAt = (suggestAt + 1) % rows.length;
      else suggestAt = suggestAt <= 0 ? rows.length - 1 : suggestAt - 1;
      rows.forEach((row, i) => row.classList.toggle("on", i === suggestAt));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (suggestAt >= 0 && rows[suggestAt]) rows[suggestAt].click();
      else runCheck(true);
    } else if (e.key === "Escape") {
      hideSuggest();
    }
  });
  $("linkInput").addEventListener("input", showDetect);

  // the hint inside the empty box changes, to show the three things it accepts
  let hint = 0;
  setInterval(() => {
    if (box.value !== "" || document.activeElement === box) return;
    hint = (hint + 1) % HINTS.length;
    box.placeholder = HINTS[hint];
  }, 3500);
}

// certificates from our list that match what is being typed
function showSuggest() {
  const text = $("certInput").value.trim();
  const box = $("suggest");
  suggestAt = -1;
  if (text.length < 2 || kindOfText(text, VERIFY_METHODS) !== "name") {
    hideSuggest();
    return;
  }
  const hits = rankCerts(text, CERTS).filter(r => r.score >= 0.34).slice(0, 6);
  let html = "";
  for (const r of hits) {
    const v = marketValue(r.cert, ROLES, ROLE_INFO, LIVE_DATA);
    html += "<div class='sg' role='option' data-name='" + esc(r.cert.name) + "'><span class='grow'><b>" + esc(r.cert.name) +
      "</b><span class='small'> · " + esc(r.cert.issuer) + "</span></span>" +
      "<span class='pill " + v.level + "'>" + LEVEL_WORD[v.level] + " · " + v.percent + "%</span></div>";
  }
  const exact = hits.length > 0 && normalize(hits[0].cert.name) === normalize(text);
  if (!exact) {
    html += "<div class='sg other' role='option' data-name=''>" + icon("search") + "<span class='grow'>Check <b>“" + esc(text) + "”</b>" +
      (hits.length === 0 ? " - it is not in our list, and that is fine" : " as typed") + "</span></div>";
  }
  box.innerHTML = html;
  box.classList.remove("hidden");
  $("certInput").setAttribute("aria-expanded", "true");
  for (const row of box.querySelectorAll(".sg")) {
    row.addEventListener("mousedown", e => e.preventDefault());         // keep the typing box in focus
    row.addEventListener("click", () => {
      if (row.dataset.name) $("certInput").value = row.dataset.name;
      showDetect();
      runCheck(true);
    });
  }
}

function hideSuggest() {
  $("suggest").classList.add("hidden");
  $("suggest").innerHTML = "";
  $("certInput").setAttribute("aria-expanded", "false");
  suggestAt = -1;
}

// say what a typed link or ID looks like, while it is being typed:
// under the big box when the link is there, under the "More details" field when it is there
function showDetect() {
  const typed = $("certInput").value.trim();
  const kind = kindOfText(typed, VERIFY_METHODS);
  const inBox = kind === "link" || kind === "id";
  describeLink(inBox ? typed : "", $("detect"));
  describeLink(inBox ? "" : $("linkInput").value.trim(), $("detectLink"));
}

function describeLink(link, box) {
  if (link === "") {
    box.innerHTML = "";
    return;
  }
  const g = checkGenuineAny({ link: link, issuer: "" }, "yes", VERIFY_METHODS, FAKE_UNIS);
  const host = hostOf(link);
  let text;
  if (g.level === "green") {
    text = host + " is an official verification site" +
      (LIVE_LINK.test(link) && apiReady ? " - we will ask the issuer for its record" : "");
  } else if (g.level === "red") {
    text = "Careful: " + host + " looks like a copy of a real verification site";
  } else if (host) {
    text = "We don't know " + host + " as a verification site";
  } else {
    text = "This looks like a certificate ID";
  }
  box.innerHTML = "<span class='detect-chip " + g.level + "'>" + icon(LEVEL_ICON[g.level]) + esc(text) + "</span>";
}

// ---------- recent checks (kept only in this browser) ----------

const RECENT_KEY = "certwise-recent";

function loadRecent() {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(list) ? list.filter(r => r && typeof r.label === "string") : [];
  } catch (e) {
    return [];
  }
}

// remember the newest result (not the ones scored from three answers - those can't be re-run by themselves)
function saveRecent() {
  if (!last || last.cert.custom) return;
  const entry = {
    label: last.cert.name, name: last.typed || "", link: last.input.link, issuer: last.input.issuer,
    level: last.g.level, percent: last.g.level === "red" || !last.v ? 0 : last.v.percent
  };
  const same = r => r.label === entry.label && r.link === entry.link && r.issuer === entry.issuer;
  const list = [entry].concat(loadRecent().filter(r => !same(r))).slice(0, 6);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch (e) {
    return;                       // storage is blocked: just don't keep a list
  }
  showRecent();
}

function showRecent() {
  const list = loadRecent();
  const box = $("recentBox");
  box.classList.toggle("hidden", list.length === 0);
  if (list.length === 0) {
    box.innerHTML = "";
    return;
  }
  let html = "<div class='recent-head'>" + icon("clock") + "<b>Recent checks</b><span class='small grow'>kept only in this browser</span>" +
    "<button type='button' id='recentClear' class='linkbtn'>Clear</button></div><div class='recent-list'>";
  list.forEach((r, i) => {
    html += "<a href='#' class='rc' data-i='" + i + "'><span class='dot-level " + esc(r.level) + "'></span>" +
      "<span class='rc-name'>" + esc(r.label) + "</span><span class='rc-val'>" + Number(r.percent) + "%</span></a>";
  });
  box.innerHTML = html + "</div>";
  $("recentClear").addEventListener("click", () => {
    try { localStorage.removeItem(RECENT_KEY); } catch (e) { /* nothing was kept */ }
    showRecent();
    toast("Recent checks cleared");
  });
  for (const a of box.querySelectorAll(".rc")) {
    a.addEventListener("click", e => {
      e.preventDefault();
      const r = list[Number(a.dataset.i)];
      // a result that came from a link alone goes back into the big box as that link
      $("certInput").value = r.name || r.link || r.label;
      $("linkInput").value = r.name ? (r.link || "") : "";
      $("issuerInput").value = r.issuer || "";
      $("moreBox").open = $("linkInput").value !== "" || $("issuerInput").value !== "";
      fileNote("");
      showDetect();
      runCheck(true);
    });
  }
}

// ---------- light / dark ----------

function setTheme(dark) {
  if (dark) document.documentElement.dataset.theme = "dark";
  else delete document.documentElement.dataset.theme;
  try {
    localStorage.setItem("certwise-theme", dark ? "dark" : "light");
  } catch (e) {
    // storage is blocked: the choice just won't be remembered
  }
  showThemeButton();
}

function showThemeButton() {
  const dark = document.documentElement.dataset.theme === "dark";
  const btn = $("themeBtn");
  btn.innerHTML = icon(dark ? "sun" : "moon");
  btn.title = dark ? "Light mode" : "Dark mode";
  btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
}

// ---------- browse and compare ----------

let browseField = "all";   // "all", a role id, or "general"
let compareIds = [];       // up to two certificate ids, oldest first

const LEVEL_WORD = { green: "High", amber: "Medium", red: "Low" };
const EARNED = {
  proctored: "Supervised exam",
  graded: "Online tests or projects",
  completion: "For finishing the course",
  attendance: "For attending"
};

function setupBrowse() {
  const fields = [{ id: "all", name: "All" }].concat(ROLES, [{ id: "general", name: "General" }]);
  $("fieldChips").innerHTML = fields.map(f => "<button type='button' class='chip" + (f.id === browseField ? " on" : "") +
    "' data-field='" + f.id + "'>" + esc(f.name) + "</button>").join("");
  for (const chip of $("fieldChips").querySelectorAll(".chip")) {
    chip.addEventListener("click", () => {
      browseField = chip.dataset.field;
      for (const other of $("fieldChips").querySelectorAll(".chip")) other.classList.toggle("on", other === chip);
      showCards();
    });
  }
  $("sortBy").addEventListener("change", showCards);
  showCards();
}

// one card per certificate, scored by the same marketValue() the check uses
function showCards() {
  const list = browseList(CERTS, ROLES, ROLE_INFO, LIVE_DATA, browseField, $("sortBy").value);
  $("browseCount").textContent = list.length + " certificate" + (list.length === 1 ? "" : "s");
  let html = "";
  for (const v of list) {
    const c = v.cert;
    html += "<article class='card' data-level='" + v.level + "'>" +
      "<div class='card-top'><span class='pill " + v.level + "'>" + LEVEL_WORD[v.level] + " · " + v.percent + "%</span>" +
      "<label class='cmp'><input type='checkbox' data-id='" + esc(c.id) + "'" +
      (compareIds.includes(c.id) ? " checked" : "") + "> Compare</label></div>" +
      "<h4>" + esc(c.name) + "</h4><div class='small'>" + esc(c.issuer) + "</div>" +
      "<div class='card-facts'>" + esc(EARNED[c.assessment]) + (c.costNote ? " · " + esc(c.costNote) : "") + "</div>" +
      "<a href='#' class='pick' data-name='" + esc(c.name) + "'>Check this certificate</a></article>";
  }
  $("cards").innerHTML = html;
  for (const box of $("cards").querySelectorAll("input[type='checkbox']")) {
    box.addEventListener("change", () => toggleCompare(box.dataset.id, box.checked));
  }
  wirePicks();
}

function toggleCompare(id, on) {
  compareIds = compareIds.filter(x => x !== id);
  if (on) compareIds.push(id);
  if (compareIds.length > 2) compareIds.shift();     // a third pick replaces the oldest one
  for (const box of $("cards").querySelectorAll("input[type='checkbox']")) {
    box.checked = compareIds.includes(box.dataset.id);
  }
  showCompare();
  if (compareIds.length === 1 && on) toast("Picked 1 of 2 - tick one more to compare");
  if (compareIds.length === 2) $("compareBox").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// the two picked certificates side by side
function showCompare() {
  const box = $("compareBox");
  if (compareIds.length === 0) {
    box.innerHTML = "";
    return;
  }
  const picks = compareIds.map(id => marketValue(CERTS.find(c => c.id === id), ROLES, ROLE_INFO, LIVE_DATA));
  const clear = "<button type='button' class='ghost' id='compareClear'>Clear</button>";
  if (picks.length === 1) {
    box.innerHTML = "<div class='compare-hint'>" + icon("columns") + "<span class='grow'><b>" + esc(picks[0].cert.name) +
      "</b> is picked. Tick one more certificate to compare.</span>" + clear + "</div>";
  } else {
    const a = picks[0], b = picks[1];
    const rows = compareRows(a, b);
    // row 0 is the score, the next rows are the three checks, the rest is plain text
    const cell = (v, row, i, side) => {
      let inner;
      if (i === 0) {
        inner = "<span class='pill " + v.level + "'>" + LEVEL_WORD[v.level] + " · " + v.percent + "%</span>";
      } else if (i <= v.checks.length) {
        const ch = v.checks[i - 1];
        inner = dotsHtml(ch.points, ch.max) + "<div class='check-why'>" + esc(ch.reason) + "</div>";
      } else {
        inner = esc(row[side]);
      }
      return "<td" + (row.better === side ? " class='win'" : "") + ">" + inner + "</td>";
    };
    const head = v => "<th><a href='#' class='pick' data-name='" + esc(v.cert.name) + "'>" + esc(v.cert.name) + "</a>" +
      "<div class='small'>" + esc(v.cert.issuer) + "</div></th>";
    let html = "<div class='compare'><div class='compare-head'><b>" + icon("columns") + " Side by side</b>" + clear + "</div>" +
      "<table class='cmp-table'><tr><th></th>" + head(a) + head(b) + "</tr>";
    rows.forEach((row, i) => {
      html += "<tr><td class='cmp-label'>" + esc(row.label) + "</td>" + cell(a, row, i, "a") + cell(b, row, i, "b") + "</tr>";
    });
    const how = v => VERIFY_METHODS[CERT_VERIFY[v.cert.id]].name;
    html += "<tr><td class='cmp-label'>How it is verified</td><td>" + esc(how(a)) + "</td><td>" + esc(how(b)) + "</td></tr>";
    box.innerHTML = html + "</table><p class='small'>A green cell is the stronger of the two. Click a name to run the full check.</p></div>";
  }
  $("compareClear").addEventListener("click", () => {
    compareIds = [];
    for (const tick of $("cards").querySelectorAll("input[type='checkbox']")) tick.checked = false;
    showCompare();
  });
  wirePicks();
}

// ---------- read the certificate file (image or PDF) ----------

const MAX_FILE_MB = 5;
const PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/";   // only loaded when a PDF is chosen

function fileNote(text, bad) {
  $("qrStatus").textContent = text;
  $("qrStatus").classList.toggle("bad", bad === true);
}

function readFile(file) {
  const ok = checkFile(file.name, file.type, file.size, MAX_FILE_MB);   // type and size limit (logic.js)
  if (!ok.ok) {
    fileNote(ok.why, true);
    $("qrFile").value = "";
    return;
  }
  if (typeof jsQR === "undefined") {
    fileNote("The QR reader didn't load (it needs an internet connection).", true);
    return;
  }
  fileNote("Reading " + file.name + "...");
  if (ok.kind === "pdf") readPdf(file);
  else readImage(file);
}

// put the link we found into the form and run the check.
// A name already typed stays; otherwise the link goes into the big box and the issuer's record names the certificate
function placeLink(link) {
  const typed = $("certInput").value.trim();
  if (typed !== "" && kindOfText(typed, VERIFY_METHODS) === "name") {
    $("linkInput").value = link;
    $("moreBox").open = true;
  } else {
    $("certInput").value = link;
  }
}

function useLink(link, note) {
  placeLink(link);
  fileNote(note);
  toast(note);
  showDetect();
  runCheck(true);
}

// fill the form from what we could read on the certificate.
// found = result of findInText() (logic.js); qrLink = the link from a QR code, if there was one
// returns false when nothing useful was found
function fillFrom(found, qrLink, where) {
  const got = [];
  const typed = $("certInput").value.trim();
  const named = typed !== "" && kindOfText(typed, VERIFY_METHODS) === "name";
  if (found.certId && !named) {
    $("certInput").value = CERTS.find(c => c.id === found.certId).name;
    got.push("the certificate's name");
  }
  const link = qrLink || found.link || found.id;
  if (link) {
    placeLink(link);
    got.push(qrLink ? "its QR code" : (found.link ? "its link" : "its ID"));
  }
  if (found.fakeUni && $("issuerInput").value.trim() === "") {
    $("issuerInput").value = found.fakeUni.split(",")[0];
    $("moreBox").open = true;
    got.push("the institute");
  }
  if (got.length === 0) return false;
  fileNote("Read from the " + where + ": " + got.join(", ") + ".");
  toast("Read from the " + where + ": " + got.join(", "));
  showDetect();
  runCheck(true);
  return true;
}

// load the text reader (Tesseract OCR) the first time a certificate has no QR code
const TESSERACT = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
let ocrReady = null;
function loadOcr() {
  if (!ocrReady) {
    ocrReady = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = TESSERACT;
      s.onload = resolve;
      s.onerror = () => { ocrReady = null; reject(new Error("the text reader did not load")); };
      document.head.appendChild(s);
    });
  }
  return ocrReady;
}

// the printed text on a picture of the certificate
async function textIn(canvas) {
  await loadOcr();
  const out = await Tesseract.recognize(canvas, "eng");
  return out.data.text || "";
}

// no QR code: read the text instead and look for the name, a link or an ID
async function readWords(canvas, where) {
  fileNote("No QR code - reading the text on the " + where + " (this takes a few seconds)...");
  try {
    const found = findInText(await textIn(canvas), CERTS, FAKE_UNIS, VERIFY_METHODS);
    if (!fillFrom(found, null, where)) {
      fileNote("We read the " + where + " but found no link, ID or certificate name we know. Type them in instead.", true);
    }
  } catch (e) {
    fileNote("No QR code found, and the text reader didn't load (it needs internet). Type the link instead.", true);
  }
}

// the QR code in a block of pixels, or null
function qrIn(canvas) {
  const ctx = canvas.getContext("2d");
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(pixels.data, canvas.width, canvas.height);
  return code && code.data ? code.data : null;
}

function readImage(file) {
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    // big photos are shrunk first so the QR reader stays fast
    const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    const link = qrIn(canvas);
    URL.revokeObjectURL(url);
    if (link) useLink(link, "QR code read - the link is filled in above.");
    else readWords(canvas, "image");
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    fileNote("Couldn't open this image - try a PNG or JPG screenshot.", true);
  };
  img.src = url;
}

// load the PDF reader (pdf.js) the first time it is needed
let pdfReady = null;
function loadPdfJs() {
  if (!pdfReady) {
    pdfReady = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = PDFJS + "pdf.min.js";
      s.onload = () => {
        pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + "pdf.worker.min.js";
        resolve();
      };
      s.onerror = () => { pdfReady = null; reject(new Error("pdf.js did not load")); };
      document.head.appendChild(s);
    });
  }
  return pdfReady;
}

// a PDF certificate: collect its text and links, and look for a QR code on the first pages.
// a scanned PDF has no text of its own, so its first page is read with the text reader instead
async function readPdf(file) {
  try {
    await loadPdfJs();
  } catch (e) {
    fileNote("The PDF reader didn't load (it needs an internet connection). Try a screenshot instead.", true);
    return;
  }
  try {
    const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    let words = "";            // all the text and links in the PDF
    let qr = null;
    let firstPage = null;      // a picture of page 1, kept in case we need the text reader
    for (let n = 1; n <= Math.min(pdf.numPages, 3) && !qr; n++) {
      const page = await pdf.getPage(n);

      // clickable links, then the printed text
      for (const a of await page.getAnnotations()) {
        if (a.url) words += " " + a.url;
      }
      words += " " + (await page.getTextContent()).items.map(i => i.str).join(" ");

      // then draw the page and look for a QR code. "print" mode draws in one go
      // (the normal mode waits for the screen to repaint); give up on a page after 6 seconds
      const view = page.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(view.width);
      canvas.height = Math.round(view.height);
      const drawing = page.render({ canvasContext: canvas.getContext("2d"), viewport: view, intent: "print" });
      const drawn = await Promise.race([
        drawing.promise.then(() => true, () => false),
        new Promise(done => setTimeout(() => done(false), 6000))
      ]);
      if (!drawn) {
        drawing.cancel();
        continue;
      }
      if (n === 1) firstPage = canvas;
      qr = qrIn(canvas);
    }

    const found = findInText(words, CERTS, FAKE_UNIS, VERIFY_METHODS);
    if (fillFrom(found, qr, "PDF")) return;
    if (words.trim().length < 20 && firstPage) {
      await readWords(firstPage, "PDF");          // a scanned PDF: no text inside, so read the picture
    } else {
      fileNote("No QR code, link or ID found in this PDF. Type the link or ID printed on the certificate instead.", true);
    }
  } catch (e) {
    fileNote("Couldn't read this PDF - it may be damaged or password-protected. Try a screenshot of the certificate instead.", true);
  }
}

// ---------- scan the QR code with the camera ----------

let camStream = null;   // the camera, while it is on
let camTimer = null;

async function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof jsQR === "undefined") {
    fileNote("The camera isn't available here (it needs https and an internet connection). Upload a photo instead.", true);
    return;
  }
  try {
    // "environment" = the back camera on a phone
    camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
  } catch (e) {
    fileNote("Couldn't open the camera (permission was not given, or there is no camera). Upload a photo instead.", true);
    return;
  }
  const video = $("camVideo");
  video.srcObject = camStream;
  await video.play();
  $("camBox").classList.remove("hidden");
  camTimer = setInterval(scanFrame, 250);   // look at a frame four times a second
}

function scanFrame() {
  const video = $("camVideo");
  if (!camStream || video.videoWidth === 0) return;
  const scale = Math.min(1, 800 / Math.max(video.videoWidth, video.videoHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
  const link = qrIn(canvas);
  if (link) {
    stopCamera();
    useLink(link, "QR code scanned with the camera - the link is filled in above.");
  }
}

function stopCamera() {
  clearInterval(camTimer);
  if (camStream) {
    for (const track of camStream.getTracks()) track.stop();   // switches the camera light off
  }
  camStream = null;
  $("camVideo").srcObject = null;
  $("camBox").classList.add("hidden");
}

// ---------- the check ----------

let last = null;   // the newest result, kept for "Download report"

function runCheck(scroll) {
  const form = readForm();
  const input = { link: form.link, issuer: form.issuer };
  const out = $("result");
  last = null;
  checkNo++;                                  // an older check that is still waiting for an issuer is dropped
  setView("check", true);
  hideSuggest();

  if (form.name === "" && form.link === "" && form.issuer === "") {
    out.innerHTML = "<section class='box result'><p>Paste the certificate's link or ID, or type its name.</p></section>";
    return;
  }

  if (form.name === "") {
    runFromLink(input, scroll, "");           // no name typed: let the link tell us which certificate it is
    return;
  }

  const cert = findCert(form.name, CERTS);
  if (!cert && LIVE_LINK.test(input.link)) {
    runFromLink(input, scroll, form.name);    // not in our list, but the issuer's own record can describe it
    return;
  }
  if (!cert) {
    askAbout(form.name, input, null, "");
  } else {
    const g = checkGenuine(cert, input, VERIFY_METHODS, CERT_VERIFY, FAKE_UNIS);
    const v = marketValue(cert, ROLES, ROLE_INFO, LIVE_DATA);
    last = { cert: cert, g: g, v: v, input: input, typed: cert.name };
    showResult();
    askIssuer();
  }
  wirePicks();
  if (scroll) scrollToResult();
}

// we can't tell which certificate this is (or it is not in our list and has no readable record):
// show what the link tells us, then ask for its name or three quick answers.
// g = the genuineness result to show first, or null; why = one line saying why we are asking
function askAbout(label, input, g, why) {
  $("result").innerHTML = notFoundHtml(label, g, why, input.link !== "");
  $("customBtn").addEventListener("click", () => runCustom(label));
  if ($("whichBtn")) {
    const useName = () => {
      const name = $("whichInput").value.trim();
      if (name === "") return;
      // the link moves under "More details" and the name takes the big box
      if (input.link !== "") {
        $("linkInput").value = input.link;
        $("moreBox").open = true;
      }
      $("certInput").value = name;
      showDetect();
      runCheck(true);
    };
    $("whichBtn").addEventListener("click", useName);
    $("whichInput").addEventListener("keydown", e => { if (e.key === "Enter") useName(); });
  }
  if (input.issuer && matchFakeUni(input.issuer, FAKE_UNIS)) runCustom(label);   // a fake university needs no answers
  wirePicks();
}

// no certificate from our list to go by: ask the issuer what this link is a record of, then score that
async function runFromLink(input, scroll, typedName) {
  const mine = checkNo;
  const host = hostOf(input.link);
  const label = typedName || (host ? "Certificate at " + host : "This certificate");
  const g0 = checkGenuineAny(input, input.link !== "" ? "yes" : "", VERIFY_METHODS, FAKE_UNIS);

  // some sites only ever host one kind of certificate we list (nptel.ac.in, ude.my...): the link names it
  const kind = typedName ? null : certForLink(input.link, VERIFY_METHODS, CERT_VERIFY, CERTS);
  const useKind = () => {
    last = { cert: kind, g: checkGenuine(kind, input, VERIFY_METHODS, CERT_VERIFY, FAKE_UNIS),
             v: marketValue(kind, ROLES, ROLE_INFO, LIVE_DATA), input: input, typed: "" };
    showResult();
    askIssuer();
  };

  if (g0.level !== "green" || !LIVE_LINK.test(input.link)) {
    // a copy-cat site, a site we don't know, an ID, or an issuer we can't ask
    if (kind) useKind();
    else askAbout(label, input, typedName ? null : g0, "");
    if (scroll) scrollToResult();
    return;
  }

  $("result").innerHTML = waitingHtml(input.link);
  if (scroll) scrollToResult();
  await apiCheck;
  if (mine !== checkNo) return;
  if (!apiReady) {
    if (kind) useKind();
    else askAbout(label, input, g0, "This copy of CertWise has no server, so we could not read the certificate's name from the issuer.");
    return;
  }

  let live = null;
  try {
    const res = await fetch("api/live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ link: input.link })       // only the link is sent - never the file
    });
    live = res.ok ? await res.json() : null;
  } catch (e) {
    live = null;
  }
  if (mine !== checkNo) return;
  const today = new Date().toISOString().slice(0, 10);

  if (live && live.supported && live.exists === false) {
    // the issuer has no record: there is no certificate to name or to score
    const stub = { id: "unknown", unknown: true, name: typedName || "Certificate at " + SITE_NAME[live.issuer],
                   issuer: SITE_NAME[live.issuer], custom: false, src: [], costNote: "", roles: [], aliases: [] };
    last = { cert: stub, g: applyLive(g0, live, stub, CERTS, today), v: null, input: input, typed: typedName };
    showResult();
    return;
  }

  if (live && live.exists === true && live.details && live.details.badgeName) {
    // is it one of the certificates we have hand-checked facts for? otherwise score it from the record itself
    const listed = listedCert(live.details, CERTS);
    const cert = listed || recordCert(live.details, live.issuer, KNOWN_ISSUERS, FIELD_WORDS, COURSERA_GRADED_SRC);
    const first = listed ? checkGenuine(listed, input, VERIFY_METHODS, CERT_VERIFY, FAKE_UNIS) : g0;
    last = { cert: cert, g: applyLive(first, live, cert, CERTS, today),
             v: marketValue(cert, ROLES, ROLE_INFO, LIVE_DATA), input: input, typed: "" };
    showResult();
    return;
  }

  // the issuer confirmed the link but gave no name, or did not answer
  if (kind) {
    useKind();
    return;
  }
  const stub = { custom: true, name: label, aliases: [] };
  const seen = live ? applyLive(g0, live, stub, CERTS, today) : g0;
  askAbout(label, input, seen, live && live.exists === true
    ? "The issuer confirmed this certificate exists, but its record did not give us the certificate's name."
    : "The issuer did not answer just now, so we checked the link only.");
}

// draw the newest result (last) - in the main box, or under the three questions for an unlisted certificate
function showResult() {
  const html = resultHtml(last.cert, last.g, last.v);
  if (last.cert.custom) $("customResult").innerHTML = html;
  else $("result").innerHTML = "<section class='box result'>" + html + "</section>";
  $("reportBtn").addEventListener("click", downloadReport);
  if ($("shareBtn")) $("shareBtn").addEventListener("click", toggleShare);
  if ($("useRecord")) {
    // the record is for another certificate: check that one, straight from the link
    $("useRecord").addEventListener("click", e => {
      e.preventDefault();
      $("certInput").value = last.input.link;
      $("linkInput").value = "";
      showDetect();
      runCheck(true);
    });
  }
  wirePicks();
  countUp();
  saveRecent();
}

// the percent inside each ring counts up while the ring fills
function countUp() {
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  for (const text of document.querySelectorAll("#result .gauge text")) {
    const target = parseInt(text.textContent, 10);
    if (!(target > 0)) continue;
    const start = performance.now();
    const step = now => {
      const t = Math.min(1, (now - start) / 800);
      text.textContent = Math.round(target * (1 - Math.pow(1 - t, 3))) + "%";
      if (t < 1) requestAnimationFrame(step);
    };
    text.textContent = "0%";
    requestAnimationFrame(step);
  }
}

// ---------- live check: ask the issuer itself (needs the CertWise API - run "npm start") ----------

let apiReady = false;    // is our API reachable? (it isn't on a plain file or on GitHub Pages)
let apiCheck = Promise.resolve();   // finishes once we know whether the API is there
let checkNo = 0;         // so a slow answer for an old check can't overwrite a newer one

// links the live check can ask an issuer about
const LIVE_LINK = /credly\.com\/badges\/|coursera\.org\/verify\/|edx\.org\/certificates\//i;
// the copy of CertWise that runs with the server (shown as a pointer on copies that have no server)
const FULL_SITE = "https://certwise-ctrlfreaks.onrender.com/";

function findApi() {
  if (!location.protocol.startsWith("http")) return;
  apiCheck = fetch("api/health")
    .then(res => (res.ok ? res.json() : null))
    .then(info => {
      apiReady = !!(info && info.ok);
      if (!apiReady) {
        // a copy without the server (for example GitHub Pages): point to the one that has it
        $("apiInfo").innerHTML = "<span>The live check with the issuer is off on this copy. " +
          "<a href='" + FULL_SITE + "'>Open the full version</a>.</span>";
        return;
      }
      $("apiInfo").textContent = "Live check with the issuer is on (Credly, Coursera, edX).";
      // examples that only make sense with the live check
      for (const a of document.querySelectorAll(".live-only")) a.classList.remove("hidden");
    })
    .catch(() => { apiReady = false; });
}

// only when the link already looks official: ask the issuer whether the certificate really exists
async function askIssuer() {
  if (!last || last.input.link === "" || last.g.level !== "green") return;
  const mine = ++checkNo;
  await apiCheck;
  if (mine !== checkNo || !last) return;
  const note = $("liveNote");
  if (!apiReady) {
    // no server here (for example on GitHub Pages): say plainly how far this check went
    if (note && LIVE_LINK.test(last.input.link)) {
      note.textContent = "Only the link's website was checked here. Asking the issuer whether this exact certificate " +
        "exists needs the CertWise server - open the official check to confirm it.";
    }
    return;
  }
  if (note) note.textContent = "Asking the issuer...";
  try {
    const res = await fetch("api/live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ link: last.input.link })     // only the link is sent - never the file
    });
    const live = res.ok ? await res.json() : null;
    if (mine !== checkNo || !last) return;
    const today = new Date().toISOString().slice(0, 10);
    const better = applyLive(last.g, live, last.cert, CERTS, today);
    if (better !== last.g) {
      last.g = better;
      showResult();
    } else if ($("liveNote")) {
      $("liveNote").textContent = live && live.supported ? "The issuer didn't answer just now - we checked the link only." : "";
    }
  } catch (e) {
    if ($("liveNote")) $("liveNote").textContent = "";
  }
}

// both answers in one line, shown above the two panels
function stripHtml(g, v) {
  const line = verdictLine(g, v);
  const part = (ask, side) => "<div class='strip-item " + side.level + "'><span class='strip-ask'>" + ask + "</span>" +
    icon(LEVEL_ICON[side.level]) + "<b>" + esc(side.text) + "</b></div>";
  return "<div class='strip'>" + part("Genuine?", line.genuine) + part("Worth?", line.worth) + "</div>";
}

const SITE_NAME = { credly: "Credly", coursera: "Coursera", edx: "edX" };

// shown while the issuer is being asked
function waitingHtml(link) {
  const site = /credly|youracclaim/i.test(link) ? "Credly" : (/coursera/i.test(link) ? "Coursera" : "edX");
  return "<section class='box result waiting'><div class='result-head'><div class='tile'><span class='spinner'></span></div>" +
    "<div class='grow'><h3>Asking " + site + " about this certificate</h3>" +
    "<div class='small'>Only the link is sent - never your file.</div></div></div>" +
    "<ol class='steps'>" +
    "<li class='done'>" + icon("check") + "<span>The link is on " + esc(hostOf(link)) + ", an official verification site</span></li>" +
    "<li class='now'><span class='spinner small'></span><span>Reading " + site + "'s own record: the certificate's name, issuer and how it is earned</span></li>" +
    "<li>" + icon("award") + "<span>Scoring it from what the record says</span></li>" +
    "</ol></section>";
}

// the two answer panels with a heading and the report button
function resultHtml(cert, g, v) {
  return "<div class='result-head'><div class='tile'>" + icon("award") + "</div>" +
    "<div class='grow'><h3>" + esc(cert.name) + "</h3><div class='small'>Issued by " + esc(cert.issuer) + "</div></div>" +
    "<div class='head-actions'>" +
    (cert.custom ? "" : "<button id='shareBtn' class='ghost' type='button' aria-expanded='false'>" + icon("share") + " Share</button>") +
    "<button id='reportBtn' class='ghost'>" + icon("download") + " Download report</button></div></div>" +
    (cert.custom ? "" : "<div id='shareBox' class='sharebox hidden'></div>") +
    (cert.custom ? "<div class='warn'>" + icon("edit") + "<span>This certificate is not in our list, so it is scored from " +
      "<b>your answers</b>. We could not check those facts ourselves.</span></div>" : "") +
    (cert.record ? "<div class='info'>" + icon("check") + "<span>This certificate is not in our list. We read it from <b>" +
      esc(SITE_NAME[cert.record.site]) + "'s own record</b> and scored it from that.</span></div>" : "") +
    stripHtml(g, v) +
    "<div class='two'>" + genuineHtml(cert, g) + valueHtml(cert, v, g) + "</div>";
}

// ---------- a certificate that is not in our list: three quick questions ----------

const QUESTIONS = [
  { id: "issuer", ask: "Who issued it?", options: [
    ["vendor", "The company or body that owns the field (like AWS, Microsoft, Cisco, CompTIA)"],
    ["academic", "An IIT or a university, with its own exam"],
    ["platform", "An online learning platform (like Coursera, Udemy, edX)"],
    ["unknown", "A training company or event organiser - or I'm not sure"]
  ] },
  { id: "earned", ask: "How was it earned?", options: [
    ["proctored", "By passing a supervised exam"],
    ["graded", "By passing online tests or projects"],
    ["completion", "By finishing the videos or tasks"],
    ["attendance", "Just by attending"]
  ] },
  { id: "hasLink", ask: "Does it have a verification link, QR code or ID?", options: [
    ["yes", "Yes"],
    ["no", "No"]
  ] }
];

// query = what to call the certificate; g = a genuineness result to show first (or null);
// why = one line saying why we are asking; hasLink = a link or ID was given
function notFoundHtml(query, g, why, hasLink) {
  let html = "<section class='box result'><div class='result-head'><div class='tile'>" + icon("help") + "</div>";
  if (g) {
    html += "<div><h3>Which certificate is this?</h3>" +
      "<div class='small'>" + esc(why || "We checked the link. To score it, tell us which certificate it is.") + "</div></div></div>" +
      "<div class='linkfirst'>" + statusHtml(g.level, g.verdict, g.live ? LIVE_NOTE[g.level] : LEVEL_NOTE[g.level]) + "<ul class='reasons'>";
    for (const r of g.reasons) html += "<li>" + esc(r) + "</li>";
    html += "</ul>";
    if (g.page) html += "<a class='button' href='" + esc(g.page) + "' target='_blank' rel='noopener'>" + icon("open") + " Open the official check</a>";
    html += "</div><label class='field-label' for='whichInput'>Type the certificate's name</label>" +
      "<div class='which-row'><input id='whichInput' type='text' class='plain' placeholder='e.g. NPTEL, AZ-900, RHCSA' autocomplete='off'>" +
      "<button id='whichBtn' type='button' class='ghost'>Use this name</button></div>" +
      "<p class='small'>Or answer three quick questions and we will still score it:</p>";
  } else {
    html += "<div><h3>\"" + esc(query) + "\" is not in our list yet</h3>" +
      "<div class='small'>" + esc(why || "Answer 3 quick questions and we will still check it.") + "</div></div></div>";
    const close = rankCerts(query, CERTS).filter(r => r.score >= 0.3).slice(0, 3);
    if (close.length > 0) {
      html += "<div class='chips'>Did you mean: " + close.map(r => "<a href='#' class='pick' data-name='" + esc(r.cert.name) + "'>" +
        esc(r.cert.name) + "</a>").join(" ") + "</div>";
    }
  }
  html += "<div class='asks3'>";
  QUESTIONS.forEach((q, i) => {
    html += "<fieldset class='q'><legend><span class='num'>" + (i + 1) + "</span> " + esc(q.ask) + "</legend>";
    for (const [value, text] of q.options) {
      // a link or ID was given, so the answer to "does it have one?" is already yes
      const ticked = q.id === "hasLink" && value === "yes" && hasLink ? " checked" : "";
      html += "<label class='opt'><input type='radio' name='q_" + q.id + "' value='" + value + "'" + ticked + "> " + esc(text) + "</label>";
    }
    html += "</fieldset>";
  });
  html += "</div><label class='field-label' for='q_field'>Which job is it for? <span class='optional'>(optional)</span></label>" +
    "<select id='q_field'><option value=''>Not sure / general</option>";
  for (const r of ROLES) html += "<option value='" + r.id + "'>" + esc(r.name) + "</option>";
  html += "</select><p id='customNote' class='small'></p>" +
    "<button id='customBtn' class='primary'>" + icon("check") + " Score this certificate</button>" +
    "<div id='customResult'></div></section>";
  return html;
}

function runCustom(query) {
  const form = readForm();
  const input = { link: form.link, issuer: form.issuer };
  const picked = id => {
    const on = document.querySelector("input[name='q_" + id + "']:checked");
    return on ? on.value : "";
  };
  const fakeUni = input.issuer && matchFakeUni(input.issuer, FAKE_UNIS);
  const answers = { issuer: picked("issuer"), earned: picked("earned"), field: $("q_field").value };
  const hasLink = picked("hasLink");

  if (!fakeUni && (!answers.issuer || !answers.earned || !hasLink)) {
    $("customNote").textContent = "Please answer all three questions.";
    return;
  }
  $("customNote").textContent = "";
  // a fake university: the answers don't matter, so use the lowest ones
  if (!answers.issuer) answers.issuer = "unknown";
  if (!answers.earned) answers.earned = "attendance";

  const cert = customCert(query, input.issuer, answers);
  const g = checkGenuineAny(input, hasLink, VERIFY_METHODS, FAKE_UNIS);
  const v = marketValue(cert, ROLES, ROLE_INFO, LIVE_DATA);
  last = { cert: cert, g: g, v: v, input: input, typed: query };
  showResult();
  askIssuer();
  $("customResult").scrollIntoView({ behavior: "smooth", block: "start" });
}

// the coloured block with an icon and the verdict
function statusHtml(level, verdict, note) {
  return "<div class='status " + level + "'><div class='status-icon'>" + icon(LEVEL_ICON[level]) + "</div>" +
    "<div><div class='verdict'>" + esc(verdict) + "</div><div class='status-sub'>" + esc(note) + "</div></div></div>";
}

function genuineHtml(cert, g) {
  const fakeUni = g.verdict === "Fake university";
  let html = "<div class='panel' data-level='" + g.level + "'>" +
    "<div class='panel-title'><span class='num'>1</span> Is it genuine?</div>";
  html += statusHtml(g.level, g.verdict, fakeUni ? "Not a valid university" : (g.live ? LIVE_NOTE[g.level] : LEVEL_NOTE[g.level]));
  html += "<ul class='reasons'>";
  for (const r of g.reasons) html += "<li>" + esc(r) + "</li>";
  html += "</ul>";
  // the live check writes here while it waits; afterwards a small tag shows the answer came from the issuer
  if (g.verdict === "Real, but a different certificate") {
    html += "<p><a href='#' id='useRecord'>Check the certificate that is on the record instead</a></p>";
  }
  html += g.live ? "<div class='livetag'>" + icon("check") + " Live check with the issuer</div>"
                 : "<div id='liveNote' class='small'></div>";
  if (g.page) {
    html += "<a class='button' href='" + esc(g.page) + "' target='_blank' rel='noopener'>" + icon("open") + " Open the official check</a>";
  }
  if (fakeUni) {
    html += "<p class='proof'><b>Proof:</b> " + proofLinks([FAKE_UNIS_SRC]) + "</p>";
  } else if (g.method) {
    html += "<div class='howbox'><b>How " + esc(cert.issuer) + " certificates are verified:</b> " + esc(g.method.how);
    if (g.method.src.length > 0) html += "<br><b>Proof:</b> " + proofLinks(g.method.src);
    html += "</div>";
  } else if (!g.live) {
    // a certificate that is not in our list: we don't know how its issuer verifies
    html += "<div class='howbox'><b>Tip:</b> a real certificate almost always has a verification link or ID " +
      "on the issuer's own website. If it has neither, anyone could have made it.</div>";
  }
  return html + "</div>";
}

// a ring that fills up to the percent
function gaugeHtml(percent, level) {
  const around = 2 * Math.PI * 52;                 // length of the ring
  const empty = around * (1 - percent / 100);      // the part left unfilled
  return "<svg class='gauge " + level + "' viewBox='0 0 120 120' role='img' aria-label='" + percent + " percent'>" +
    "<circle class='gauge-bg' cx='60' cy='60' r='52'/>" +
    "<circle class='gauge-fg' cx='60' cy='60' r='52' stroke-dasharray='" + around.toFixed(1) +
    "' stroke-dashoffset='" + empty.toFixed(1) + "'/>" +
    "<text x='60' y='69' text-anchor='middle'>" + percent + "%</text></svg>";
}

// points as filled / empty dots, e.g. 1 of 2 -> ● ○
function dotsHtml(points, max) {
  let html = "<span class='dots' title='" + points + " of " + max + " points'>";
  for (let i = 0; i < max; i++) html += "<span class='dot" + (i < points ? " on" : "") + "'></span>";
  return html + "</span>";
}

function valueHtml(cert, v, g) {
  const fake = g.level === "red";
  let html = "<div class='panel' data-level='" + (fake ? "red" : v.level) + "'>" +
    "<div class='panel-title'><span class='num'>2</span> What is it worth?</div>";

  if (g.verdict === "Fake university") {
    // nothing else to score: a certificate from a fake university is not valid at all
    return html + "<div class='gauge-row'>" + gaugeHtml(0, "red") +
      "<div><div class='verdict red-text'>No market value</div>" +
      "<div class='status-sub'>A degree or certificate from a fake university is not valid for jobs or higher studies.</div></div></div></div>";
  }
  if (fake) {
    html += "<div class='gauge-row'>" + gaugeHtml(0, "red") +
      "<div><div class='verdict red-text'>No market value if it is fake</div>" +
      "<div class='status-sub'>A fake certificate is worth nothing - and showing one can cost you the job.</div></div></div>";
    if (!v) {
      // the issuer has no record, so we don't even know which certificate this link claims to be
      return html + "<p class='small'>The issuer has no record behind this link, so there is no certificate to score.</p></div>";
    }
    html += "<p class='small'>For a genuine " + esc(cert.name) + ", the score would be:</p>";
  }
  html += "<div class='gauge-row'>" + gaugeHtml(v.percent, v.level) +
    "<div><div class='verdict " + v.level + "-text'>" + esc(v.band) + (fake ? " (if genuine)" : "") + "</div>" +
    "<div class='status-sub'>" + v.total + " of " + v.max + " points from 3 checks</div></div></div>";
  if (g.verdict === "Real, but a different certificate") {
    html += "<div class='warn'>" + icon("alert") + "<span>This score is for " + esc(cert.name) +
      ". The issuer's record is for a different certificate, so it may not apply to this holder.</span></div>";
  }
  if (v.warning) html += "<div class='warn'>" + icon("alert") + "<span>" + esc(v.warning) + "</span></div>";

  html += "<div class='checks'>";
  for (const ch of v.checks) {
    html += "<div class='check-row'><div class='check-head'><span>" + esc(ch.name) + "</span>" +
      dotsHtml(ch.points, ch.max) + "</div><div class='check-why'>" + esc(ch.reason);
    if (ch.src && ch.src.length > 0) html += "<br>Proof: " + sourceLinks(ch.src);
    if (ch.links && ch.links.length > 0) html += "<br>Proof: " + proofLinks(ch.links);
    html += "</div></div>";
  }
  html += "</div>";

  // what the issuer's own record lists (only for a certificate we read from the record)
  if (cert.record) {
    const hasPage = /^https:\/\//.test(cert.record.url);
    if (cert.record.skills.length > 0 || hasPage) {
      html += "<div class='howbox'><b>From the issuer's record</b>";
      if (cert.record.skills.length > 0) {
        html += "<div class='skills'>" + cert.record.skills.map(s => "<span class='skill'>" + esc(s) + "</span>").join("") + "</div>";
      }
      if (hasPage) {
        html += "<div><a href='" + esc(cert.record.url) + "' target='_blank' rel='noopener'>Open this badge's public page</a></div>";
      }
      html += "</div>";
    }
    html += "<div class='fact'>" + icon("tag") + "<div><b>Price:</b> not part of the issuer's record, so it is not shown.</div></div>";
  }

  // price (hand-checked, with proof) + newest verified facts from the monthly refresh
  if (cert.costNote) {
    html += "<div class='fact'>" + icon("tag") + "<div><b>Price:</b> " + esc(cert.costNote);
    if (cert.src.length > 0) html += "<div class='proof'>Proof: " + proofLinks(cert.src) + "</div>";
    html += "</div></div>";
  }
  const lc = LIVE_DATA.certs[cert.id];
  if (lc && (lc.price || lc.status)) {
    html += "<p><b>Latest verified facts:</b></p>";
    if (lc.price) html += "<p>Price: " + factHtml(lc.price) + "</p>";
    if (lc.status) html += "<p>Status: " + factHtml(lc.status) + "</p>";
  }
  if (lc && lc.demand && lc.demand.length > 0) {
    html += "<p><b>Sources that call it in demand:</b></p><ul>";
    for (const d of lc.demand) html += "<li>" + factHtml(d, false) + "</li>";
    html += "</ul>";
  }

  // the jobs it leads to, with fresher salary
  if (v.jobs.length > 0) {
    html += "<div class='fact'>" + icon("briefcase") + "<div><b>Jobs it leads to</b> (fresher pay in India)</div></div><div class='jobs'>";
    for (const j of v.jobs) {
      const liveRole = LIVE_DATA.roles[j.id];
      if (liveRole && liveRole.salary) {
        html += "<div class='job'><b>" + esc(j.name) + "</b>" + factHtml(liveRole.salary) + "</div>";
      } else {
        html += "<div class='job'><b>" + esc(j.name) + "</b>" + esc(j.info.salary.range) +
          "<div class='proof'>Source: " + sourceLinks(j.info.salary.src) + "</div></div>";
      }
    }
    html += "</div><p class='proof'>" + esc(PUNE_NOTE.text) + " (" + sourceLinks(PUNE_NOTE.src) + ").</p>";
  }

  if (cert.note) html += "<div class='fact'>" + icon("bulb") + "<div><span class='adv'>our advice</span> " + esc(cert.note) + "</div></div>";

  const better = betterValue(cert, CERTS, ROLES, ROLE_INFO, LIVE_DATA, 3);
  if (better.length > 0) {
    html += "<div class='alts'><b>Higher value in the same field</b><ul>";
    for (const b of better) {
      html += "<li><a href='#' class='pick' data-name='" + esc(b.cert.name) + "'>" + esc(b.cert.name) + "</a> " +
        b.percent + "% · " + esc(b.cert.costNote) + "</li>";
    }
    html += "</ul></div>";
  }
  return html + "</div>";
}

// "did you mean" and "higher value" links check that certificate
function wirePicks() {
  for (const a of document.querySelectorAll(".pick")) {
    if (a.dataset.wired) continue;     // already has its click handler
    a.dataset.wired = "yes";
    a.addEventListener("click", e => {
      e.preventDefault();
      $("certInput").value = a.dataset.name;
      $("linkInput").value = "";
      $("issuerInput").value = "";
      $("moreBox").open = false;
      fileNote("");
      showDetect();
      runCheck(true);
    });
  }
}

// ---------- share a result ----------

// the address that runs this same check again for whoever opens it
function shareUrl() {
  return location.href.split("#")[0] + shareHash({ name: last.typed || "", link: last.input.link, issuer: last.input.issuer });
}

function toggleShare() {
  const box = $("shareBox");
  const opening = box.classList.contains("hidden");
  box.classList.toggle("hidden", !opening);
  $("shareBtn").setAttribute("aria-expanded", opening ? "true" : "false");
  if (!opening) return;
  const url = shareUrl();
  const text = shareText(last.cert, last.g, last.v) + " Check it yourself: " + url;
  box.innerHTML = "<div class='share-row'><button type='button' id='shareCopy' class='ghost'>" + icon("copy") + " Copy link</button>" +
    "<a class='ghost' id='shareWa' href='https://wa.me/?text=" + encodeURIComponent(text) + "' target='_blank' rel='noopener'>" +
    icon("message") + " WhatsApp</a>" +
    "<button type='button' id='shareCard' class='ghost'>" + icon("image") + " Save as a picture</button></div>" +
    "<input id='shareLink' type='text' class='plain hidden' readonly aria-label='Link to this check'>" +
    "<p class='small'>Whoever opens the link sees the check run again, live - not a copy of this result. " +
    "The link contains the certificate's link, so send it only to people who should see it.</p>";
  $("shareCopy").addEventListener("click", () => copyLink(url));
  $("shareCard").addEventListener("click", saveCard);
}

function copyLink(url) {
  const done = () => toast("Link copied");
  const byHand = () => {
    // copying is blocked here: show the link, selected, so it can be copied by hand
    const field = $("shareLink");
    field.value = url;
    field.classList.remove("hidden");
    field.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    if (ok) done(); else toast("Press Ctrl+C to copy the link");
  };
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(url).then(done, byHand);
  else byHand();
}

const CARD_INK = { green: "#1b7f3b", amber: "#946200", red: "#b3261e", grey: "#475569" };
const CARD_TINT = { green: "#e3f4e8", amber: "#fff4d9", red: "#fde7e5", grey: "#eef1f5" };

function roundBox(pen, x, y, w, h, r) {
  pen.beginPath();
  pen.moveTo(x + r, y);
  pen.arcTo(x + w, y, x + w, y + h, r);
  pen.arcTo(x + w, y + h, x, y + h, r);
  pen.arcTo(x, y + h, x, y, r);
  pen.arcTo(x, y, x + w, y, r);
  pen.closePath();
}

// break text into lines no wider than max (using the pen's current font)
function wrapLines(pen, text, max) {
  const lines = [];
  let line = "";
  for (const word of String(text).split(/\s+/)) {
    const next = line === "" ? word : line + " " + word;
    if (pen.measureText(next).width > max && line !== "") {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line !== "") lines.push(line);
  return lines;
}

// cut text with "..." so it fits in max
function fitText(pen, text, max) {
  let out = String(text);
  while (out.length > 3 && pen.measureText(out).width > max) out = out.slice(0, -4) + "...";
  return out;
}

// a picture of the newest result, 1200 x 630, drawn in the browser
function resultCard() {
  const line = verdictLine(last.g, last.v);
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const pen = canvas.getContext("2d");
  const sans = "'Segoe UI', Arial, sans-serif";
  const serif = "Georgia, 'Times New Roman', serif";

  // green background and a white card
  const back = pen.createLinearGradient(0, 0, 1200, 630);
  back.addColorStop(0, "#0f2f24");
  back.addColorStop(0.55, "#1d4a3a");
  back.addColorStop(1, "#2e6d5d");
  pen.fillStyle = back;
  pen.fillRect(0, 0, 1200, 630);
  roundBox(pen, 48, 48, 1104, 534, 28);
  pen.fillStyle = "#ffffff";
  pen.fill();

  // the name of the site, with its tick
  roundBox(pen, 92, 86, 58, 58, 14);
  pen.fillStyle = "#b8892e";
  pen.fill();
  pen.strokeStyle = "#ffffff";
  pen.lineWidth = 6;
  pen.lineCap = "round";
  pen.lineJoin = "round";
  pen.beginPath();
  pen.moveTo(108, 116);
  pen.lineTo(118, 127);
  pen.lineTo(135, 104);
  pen.stroke();
  pen.fillStyle = "#0f2f24";
  pen.font = "bold 40px " + serif;
  pen.fillText("CertWise", 166, 130);
  pen.fillStyle = "#5b6b63";
  pen.font = "22px " + sans;
  pen.textAlign = "right";
  pen.fillText("Checked on " + new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }), 1108, 126);
  pen.textAlign = "left";

  // the certificate (two lines at most) and who issued it
  pen.fillStyle = "#16241e";
  pen.font = "bold 48px " + serif;
  const name = wrapLines(pen, last.cert.name, 1016);
  if (name.length > 2) name[1] = fitText(pen, name[1] + " " + name.slice(2).join(" "), 1016);
  let y = 222;
  for (const part of name.slice(0, 2)) {
    pen.fillText(part, 92, y);
    y += 58;
  }
  pen.fillStyle = "#5b6b63";
  pen.font = "26px " + sans;
  pen.fillText(fitText(pen, "Issued by " + last.cert.issuer, 1016), 92, y - 8);

  // the two answers
  const answer = (top, ask, side) => {
    roundBox(pen, 92, top, 1016, 70, 35);
    pen.fillStyle = CARD_TINT[side.level];
    pen.fill();
    pen.fillStyle = "#5b6b63";
    pen.font = "bold 20px " + sans;
    pen.fillText(ask, 122, top + 44);
    pen.fillStyle = CARD_INK[side.level];
    pen.font = "bold 30px " + sans;
    pen.fillText(fitText(pen, side.text, 800), 262, top + 46);
  };
  answer(356, "GENUINE?", line.genuine);
  answer(440, "WORTH?", line.worth);

  pen.fillStyle = "#5b6b63";
  pen.font = "21px " + sans;
  pen.fillText(fitText(pen, "Run this check yourself at " + location.host + location.pathname, 1016), 92, 552);
  return canvas;
}

function saveCard() {
  const name = last.cert.name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 40);
  resultCard().toBlob(blob => {
    if (!blob) {
      toast("Could not make the picture");
      return;
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "CertWise-result-" + name + ".png";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast("Picture saved");
  }, "image/png");
}

// ---------- download the result as a PDF report ----------

const JSPDF = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";   // only loaded when asked for

let pdfWriterReady = null;
function loadPdfWriter() {
  if (!pdfWriterReady) {
    pdfWriterReady = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = JSPDF;
      s.onload = resolve;
      s.onerror = () => { pdfWriterReady = null; reject(new Error("jsPDF did not load")); };
      document.head.appendChild(s);
    });
  }
  return pdfWriterReady;
}

// the PDF's built-in font only knows Latin letters, so swap the few other symbols we use
function plainText(text) {
  return String(text)
    .replace(/₹\s?/g, "Rs ")
    .replace(/[“”]/g, "\"").replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-").replace(/→/g, "->")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "");
}

const REPORT_COLOR = { green: [27, 127, 59], amber: [148, 98, 0], red: [179, 38, 30], grey: [71, 85, 105] };

// build the report from the newest result (last) and return the PDF document
function reportDoc() {
  const doc = new window.jspdf.jsPDF({ unit: "mm", format: "a4" });
  const LEFT = 15, WIDTH = 180, BOTTOM = 282;
  let y = 20;

  // write wrapped text, then move down; a full page starts a new one
  function write(text, size, style, color) {
    doc.setFont("helvetica", style || "normal");
    doc.setFontSize(size);
    const c = color || [22, 36, 30];
    doc.setTextColor(c[0], c[1], c[2]);
    for (const line of doc.splitTextToSize(plainText(text), WIDTH)) {
      if (y > BOTTOM) { doc.addPage(); y = 20; }
      doc.text(line, LEFT, y);
      y += size * 0.42;
    }
  }
  // a label followed by clickable links, one per line
  function links(label, list) {
    const ok = list.filter(s => /^https?:\/\//.test(s.url));
    if (ok.length === 0) return;
    write(label, 9, "bold", [91, 107, 99]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(11, 95, 165);
    for (const s of ok) {
      if (y > BOTTOM) { doc.addPage(); y = 20; }
      // the name and the website, clickable (a full web address is often too long for one line)
      const shown = doc.splitTextToSize(plainText(s.name + " (" + siteOf(s.url) + ")"), WIDTH)[0];
      doc.textWithLink(shown, LEFT, y, { url: s.url });
      y += 4.2;
    }
  }
  function heading(text) {
    y += 4;
    write(text, 13, "bold", [46, 109, 93]);
    y += 1;
  }
  const srcList = keys => (keys || []).filter(k => SOURCES[k]).map(k => SOURCES[k]);

  const cert = last.cert, g = last.g, v = last.v;
  const fake = g.level === "red";

  write("CertWise report", 20, "bold", [46, 109, 93]);
  write("Is this certificate genuine, and what is it worth?  ·  Checked on " + new Date().toLocaleString("en-IN"), 9, "normal", [91, 107, 99]);
  y += 4;
  write(cert.name, 14, "bold");
  write("Issued by " + cert.issuer, 10, "normal", [91, 107, 99]);
  if (last.input.link) write("Link / ID checked: " + last.input.link, 9);
  if (last.input.issuer) write("Institute checked: " + last.input.issuer, 9);
  if (cert.custom) write("This certificate is not in our list. It is scored from the user's own answers, which CertWise could not check.", 9, "italic", REPORT_COLOR.amber);
  if (cert.record) write("This certificate is not in our list. It was read from " + SITE_NAME[cert.record.site] + "'s own record and scored from that.", 9, "italic", REPORT_COLOR.grey);

  heading("1. Is it genuine?");
  write(g.verdict, 12, "bold", REPORT_COLOR[g.level]);
  if (g.live) write("Checked live with the issuer.", 9, "italic", [91, 107, 99]);
  for (const r of g.reasons) write("- " + r, 10);
  if (g.page) links("Official check:", [{ name: "Open the official page", url: g.page }]);
  if (g.verdict === "Fake university") {
    links("Proof:", [FAKE_UNIS_SRC]);
  } else if (g.method) {
    write("How " + cert.issuer + " certificates are verified: " + g.method.how, 9, "normal", [91, 107, 99]);
    links("Proof:", g.method.src);
  }

  heading("2. What is it worth?");
  if (g.verdict === "Fake university") {
    write("0% - No market value. A degree or certificate from a fake university is not valid for jobs or higher studies.", 12, "bold", REPORT_COLOR.red);
    y += 5;
    write("CertWise checks the link, the ID format, public lists and published facts. It sells no courses and takes no commission.", 8, "italic", [91, 107, 99]);
    return doc;
  }
  if (fake) write("0% - No market value if it is fake.", 12, "bold", REPORT_COLOR.red);
  if (!v) {
    write("The issuer has no record behind this link, so there is no certificate to score.", 10);
    y += 5;
    write("CertWise checks the link, the ID format, public lists and published facts. It sells no courses and takes no commission.", 8, "italic", [91, 107, 99]);
    return doc;
  }
  write((fake ? "For a genuine one: " : "") + v.percent + "% - " + v.band + " (" + v.total + " of " + v.max + " points)", 12, "bold",
        fake ? REPORT_COLOR.grey : REPORT_COLOR[v.level]);
  if (v.warning) write("Note: " + v.warning, 10, "normal", REPORT_COLOR.amber);
  y += 1;
  for (const ch of v.checks) {
    write(ch.name + ": " + ch.points + " / " + ch.max, 10, "bold");
    write(ch.reason, 10);
    links("Proof:", srcList(ch.src));
    if (ch.links) links("Proof:", ch.links);
    y += 1;
  }
  if (cert.costNote) {
    write("Price: " + cert.costNote, 10, "bold");
    links("Proof:", cert.src);
  }
  if (v.jobs.length > 0) {
    y += 1;
    write("Jobs it leads to (fresher pay in India)", 10, "bold");
    for (const j of v.jobs) {
      write("- " + j.name + ": " + j.info.salary.range, 10);
      links("Source:", srcList(j.info.salary.src));
    }
    write(PUNE_NOTE.text + ".", 9, "normal", [91, 107, 99]);
  }
  if (cert.note) {
    y += 1;
    write("Our advice: " + cert.note, 10, "italic");
  }
  const better = betterValue(cert, CERTS, ROLES, ROLE_INFO, LIVE_DATA, 3);
  if (better.length > 0) {
    y += 1;
    write("Higher value in the same field", 10, "bold");
    for (const b of better) write("- " + b.cert.name + ": " + b.percent + "% · " + b.cert.costNote, 10);
  }

  y += 5;
  write("CertWise checks the link, the ID format, public lists and published facts. It cannot read the issuer's own records, " +
    "so always confirm on the issuer's official page. CertWise sells no courses and takes no commission.", 8, "italic", [91, 107, 99]);
  return doc;
}

async function downloadReport() {
  if (!last) return;
  const btn = $("reportBtn");
  const label = btn.innerHTML;
  btn.textContent = "Preparing...";
  try {
    await loadPdfWriter();
    const name = last.cert.name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 40);
    reportDoc().save("CertWise-report-" + name + ".pdf");
    btn.innerHTML = label;
    toast("Report saved as a PDF");
  } catch (e) {
    btn.textContent = "Couldn't make the PDF (needs internet)";
  }
}

setup();
