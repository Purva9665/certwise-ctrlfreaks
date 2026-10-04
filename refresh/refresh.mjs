// CertWise - monthly data refresh
//
//   node refresh/refresh.mjs              refresh everything
//   node refresh/refresh.mjs --dry-run    show what would be asked, no API calls
//   node refresh/refresh.mjs --only roles | --only certs | --ids aws-ccp,rhcsa
//
// It needs a free GEMINI_API_KEY (from Google AI Studio). We download the trusted pages listed in
// our data, and Gemini copies out the facts with exact quotes: prices, status, salary, demand, skills.
// We fetch each page ourselves and keep a fact ONLY if its quote is really there
// and every number in the value is inside the quote (refresh/verify.js).
// Verified facts go to data/live.js; dropped facts are listed in refresh/report.json.

import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { askGemini, GEMINI_MODEL } from "./gemini.mjs";

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const { CERTS, ROLES } = require(path.join(root, "data", "certs.js"));
const { ROLE_INFO, SOURCES } = require(path.join(root, "data", "roles.js"));
const { verifyFact, htmlToText } = require(path.join(here, "verify.js"));
const { excerpt } = require(path.join(here, "pages.js"));

const MODEL = GEMINI_MODEL;
const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const only = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;
const ids = args.includes("--ids") ? args[args.indexOf("--ids") + 1].split(",") : null;
const today = new Date().toISOString().slice(0, 10);

const RULES = `You extract facts for CertWise, a free tool that tells students in India whether a certificate is genuine and what it is worth in the job market.

Use ONLY the PAGES given below. Rules:
- Report a fact only if it is written in one of the pages. Never use memory, never estimate, never combine numbers into a new number.
- For every fact give "url" (exactly one of the page URLs below) and "quote": one or two sentences copied word-for-word from that page's text that contain the value. Our software checks the quote against the page, so any change in wording makes the fact fail.
- If the pages don't say it, use null. An empty answer is better than a guess.

End your answer with the JSON inside <json></json> tags and nothing after it.`;

function roleTask(role) {
  return `Role: ${role.name} (India, fresh graduates).
Find:
1. salary: a typical fresher (0-1 year) salary range in India, e.g. "₹3.5 - 6 LPA".
2. demand: one statement about current hiring demand in India for this role or its main skills.
3. skills: up to 5 skills that employers or reports say this role needs (one fact each).

Return:
<json>{"salary": {"value": "...", "url": "...", "quote": "..."} or null,
 "demand": {"value": "short summary", "url": "...", "quote": "..."} or null,
 "skills": [{"value": "skill name", "url": "...", "quote": "..."}]}</json>`;
}

function certTask(cert) {
  return `Certificate: ${cert.name} (issued by ${cert.issuer}).
Find in the pages:
1. price: the current exam / certificate fee (include the currency).
2. status: is it currently offered? value "active" or "closed".

Return:
<json>{"price": {"value": "...", "url": "...", "quote": "..."} or null,
 "status": {"value": "active or closed", "url": "...", "quote": "..."} or null}</json>`;
}

// ---------- Gemini reads pages we downloaded ----------

// the trusted pages we already list in our data for this role / certificate
function sourceUrls(kind, item) {
  if (kind === "cert") return [...new Set(item.src.map(s => s.url))];
  const info = ROLE_INFO[item.id] || {};
  const keys = [...((info.salary && info.salary.src) || []), ...((info.demand && info.demand.src) || [])];
  return [...new Set(keys.filter(k => SOURCES[k]).map(k => SOURCES[k].url))];
}

function keywordsFor(kind, item) {
  if (kind === "cert") {
    return [...item.aliases, "fee", "price", "cost", "usd", "₹", "$", "voucher", "retire", "closed", "discontinu"];
  }
  return [...item.name.split(/[\s/]+/).filter(w => w.length > 2), "lpa", "salary", "₹", "fresher", "hiring", "demand", "skill"];
}

async function ask(kind, item, report) {
  const pages = [];
  for (const url of sourceUrls(kind, item)) {
    const text = await pageText(url);
    if (text === null) {
      report.push({ label: item.id, url, why: "could not read the page ourselves (blocked or needs JavaScript)" });
      continue;
    }
    pages.push({ url, text: excerpt(text, keywordsFor(kind, item), 6000) });
  }
  if (pages.length === 0) throw new Error("none of the listed pages could be read");
  const task = kind === "cert" ? certTask(item) : roleTask(item);
  const prompt = RULES + "\n\n" + task + "\n\nPAGES:\n\n" +
    pages.map((p, i) => `[${i + 1}] URL: ${p.url}\n${p.text}`).join("\n\n");
  return parseJson(await askGemini(prompt));
}

function parseJson(text) {
  const m = text.match(/<json>([\s\S]*?)<\/json>/);
  if (!m) throw new Error("no <json> block in the answer");
  return JSON.parse(m[1]);
}

// ---------- checking ----------

const pageCache = new Map();

async function pageText(url) {
  if (pageCache.has(url)) return pageCache.get(url);
  let text = null;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "CertWise-factcheck/1.0 (student project)" },
      signal: AbortSignal.timeout(20000)
    });
    const type = res.headers.get("content-type") || "";
    if (res.ok && type.includes("html")) text = htmlToText(await res.text());
  } catch (e) {
    text = null;
  }
  pageCache.set(url, text);
  return text;
}

async function check(fact, report, label) {
  if (!fact) return null;
  const text = await pageText(fact.url);
  if (text === null) {
    report.push({ label, url: fact.url, why: "could not read the page ourselves" });
    return null;
  }
  const v = verifyFact(fact, text);
  if (!v.ok) {
    report.push({ label, url: fact.url, why: v.why });
    return null;
  }
  return { value: fact.value === undefined ? null : fact.value, url: fact.url, quote: fact.quote, checkedOn: today };
}

// ---------- main ----------

function loadLive() {
  const file = path.join(root, "data", "live.js");
  if (!fs.existsSync(file)) return { refreshedOn: null, roles: {}, certs: {} };
  return require(file).LIVE;
}

function saveLive(live) {
  const body = "// CertWise - verified live facts. Written by refresh/refresh.mjs - do not edit by hand.\n" +
    "// Every fact was checked: its quote was found on the source page on checkedOn.\n\n" +
    "const LIVE = " + JSON.stringify(live, null, 2) + ";\n\n" +
    "if (typeof module !== \"undefined\") {\n  module.exports = { LIVE };\n}\n";
  fs.writeFileSync(path.join(root, "data", "live.js"), body);
}

async function main() {
  let roles = ROLES;
  let certs = CERTS.filter(c => c.aliases.length > 0);   // generic types (workshops...) have nothing to look up
  if (only === "roles") certs = [];
  if (only === "certs") roles = [];
  if (ids) {
    roles = roles.filter(r => ids.includes(r.id));
    certs = certs.filter(c => ids.includes(c.id));
  }

  console.log(`Refreshing ${roles.length} roles and ${certs.length} certificates with ${MODEL}` +
    " (reading our listed sources)" + (DRY ? " - dry run" : ""));
  if (DRY) {
    for (const r of roles) {
      console.log("\n--- role " + r.id + "\n" + roleTask(r));
      console.log("pages: " + sourceUrls("role", r).join(" "));
    }
    for (const c of certs) {
      console.log("\n--- cert " + c.id + "\n" + certTask(c));
      console.log("pages: " + sourceUrls("cert", c).join(" "));
    }
    return;
  }
  if (!process.env.GEMINI_API_KEY) {
    console.log("No API key. Add GEMINI_API_KEY (free, from Google AI Studio) " +
      "as a repository secret (Settings -> Secrets and variables -> Actions).");
    process.exit(1);
  }

  const live = loadLive();
  const report = [];

  for (const r of roles) {
    try {
      const a = await ask("role", r, report);
      const salary = await check(a.salary, report, r.id + " salary");
      const demand = await check(a.demand, report, r.id + " demand");
      const skills = [];
      for (const s of (a.skills || []).slice(0, 5)) {
        const ok = await check(s, report, r.id + " skill");
        if (ok) skills.push(ok);
      }
      // keep the previous verified fact if this month's one failed the check
      const old = live.roles[r.id] || {};
      live.roles[r.id] = { salary: salary || old.salary || null, demand: demand || old.demand || null,
                           skills: skills.length ? skills : (old.skills || []) };
      console.log(`role ${r.id}: salary ${salary ? "ok" : "-"}, demand ${demand ? "ok" : "-"}, skills ${skills.length}`);
    } catch (e) {
      report.push({ label: r.id, why: "error: " + e.message });
      console.log(`role ${r.id}: error ${e.message}`);
    }
  }

  for (const c of certs) {
    try {
      const a = await ask("cert", c, report);
      const price = await check(a.price, report, c.id + " price");
      const status = await check(a.status, report, c.id + " status");
      const old = live.certs[c.id] || {};
      const entry = { price: price || old.price || null, status: status || old.status || null };
      // the refresh doesn't look for new demand sources: keep any already saved, otherwise leave
      // demand out so the app shows it as "not scored yet" instead of 0 points
      if (old.demand) entry.demand = old.demand;
      live.certs[c.id] = entry;
      console.log(`cert ${c.id}: price ${price ? "ok" : "-"}, status ${status ? "ok" : "-"}` +
        (entry.demand ? `, demand ${entry.demand.length}` : ""));
    } catch (e) {
      report.push({ label: c.id, why: "error: " + e.message });
      console.log(`cert ${c.id}: error ${e.message}`);
    }
  }

  live.refreshedOn = today;
  live.model = MODEL;
  saveLive(live);
  fs.writeFileSync(path.join(here, "report.json"), JSON.stringify({ date: today, dropped: report }, null, 2));
  console.log(`\nSaved data/live.js. Dropped ${report.length} facts (see refresh/report.json).`);
}

main();
