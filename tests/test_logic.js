// Test harness for CertWise logic (sample links and "live" facts here are TEST-ONLY, never shipped)
const L = require("../logic.js");
const { CERTS, ROLES } = require("../data/certs.js");
const { VERIFY_METHODS, CERT_VERIFY, FAKE_UNIS } = require("../data/verify.js");
const { ROLE_INFO } = require("../data/roles.js");

let fails = 0;
function eq(name, got, want) {
  const ok = got === want;
  if (!ok) fails++;
  console.log((ok ? "PASS " : "FAIL ") + name + "  got=" + got + (ok ? "" : "  want=" + want));
}

// --- data sanity ---
const ids = new Set();
for (const c of CERTS) {
  if (ids.has(c.id)) { fails++; console.log("FAIL duplicate id " + c.id); }
  ids.add(c.id);
  for (const k of ["issuerType", "assessment", "costBand"]) {
    const allowed = { issuerType: ["vendor","academic","platform","unknown"], assessment: ["proctored","graded","completion","attendance"], costBand: ["free","low","medium","high"] }[k];
    if (!allowed.includes(c[k])) { fails++; console.log("FAIL bad " + k + " in " + c.id); }
  }
  for (const r of c.roles) if (r !== "all" && !ROLE_INFO[r]) { fails++; console.log("FAIL bad role " + r + " in " + c.id); }
  if (!VERIFY_METHODS[CERT_VERIFY[c.id]]) { fails++; console.log("FAIL no verify method for " + c.id); }
}
for (const key in VERIFY_METHODS) {
  const m = VERIFY_METHODS[key];
  if (m.domains.length > 0 && m.src.length === 0) { fails++; console.log("FAIL no proof for verify method " + key); }
}
for (const c of CERTS) {
  if (c.aliases.length > 0 && c.src.length === 0) { fails++; console.log("FAIL no proof link for " + c.id); }
}
eq("certs in list", CERTS.length, 44);
eq("official ways to verify", Object.keys(VERIFY_METHODS).filter(k => VERIFY_METHODS[k].domains.length > 0).length, 17);
eq("UGC fake universities", FAKE_UNIS.length, 32);

// --- search ---
const s = q => { const c = L.findCert(q, CERTS); return c ? c.id : null; };
eq("rhcsa", s("rhcsa"), "rhcsa");
eq("typo security plus", s("secuirty plus"), "secplus");
eq("comptia security+", s("CompTIA Security+"), "secplus");
eq("typo cloud practioner", s("aws cloud practioner"), "aws-ccp");
eq("az900 no dash", s("az900"), "az-900");
eq("nptel java", s("nptel java"), "nptel");
eq("tensorflow", s("tensorflow certificate"), "tf-dev");
eq("ai tools workshop", s("AI tools workshop"), "workshop");
eq("paid internship", s("paid virtual internship certificate"), "paid-internship");
eq("google data analytics", s("Google Data Analytics"), "google-data");
eq("gibberish", s("qwerty zzz"), null);
// certificates added in version 2
eq("udemy", s("Udemy python course certificate"), "udemy");
eq("linkedin learning", s("LinkedIn Learning Excel"), "linkedin-learning");
eq("edx", s("edX CS50"), "edx");
eq("ibm data science", s("IBM Data Science"), "ibm-ds");
eq("great learning", s("great learning python"), "great-learning");
eq("internshala", s("Internshala web development training"), "internshala");
eq("tcs ion", s("TCS iON Career Edge"), "tcs-ion");
eq("ai-900", s("AI-900"), "ai-900");
eq("github foundations", s("GitHub Foundations"), "github-found");
eq("associate cloud engineer", s("Google Associate Cloud Engineer"), "gcp-ace");
eq("aws developer", s("AWS Certified Developer Associate"), "aws-dva");
eq("forage", s("Forage job simulation"), "forage");
eq("simplilearn", s("Simplilearn SkillUp"), "simplilearn");
eq("not in list", s("Blockchain Basics certificate"), null);

// --- genuineness ---
const cert = id => CERTS.find(c => c.id === id);
const g = (id, link, issuer) => L.checkGenuine(cert(id), { link: link || "", issuer: issuer || "" }, VERIFY_METHODS, CERT_VERIFY, FAKE_UNIS);
eq("aws credly badge", g("aws-ccp", "https://www.credly.com/badges/sample-id").verdict, "Official verification link");
eq("aws credly, not a badge page", g("aws-ccp", "https://www.credly.com/users/someone").verdict, "Official site, but not a verification page");
eq("coursera verify link", g("google-data", "coursera.org/verify/SAMPLE123").verdict, "Official verification link");
eq("coursera look-alike", g("google-data", "https://coursera-verify.com/verify/SAMPLE123").level, "red");
eq("credly typo domain", g("aws-ccp", "https://www.credlly.com/badges/x").level, "red");
eq("credly link for coursera cert", g("google-data", "https://www.credly.com/badges/x").verdict, "Not the issuer's official site");
eq("unrelated site", g("google-data", "https://example.com/cert/1").verdict, "Not the issuer's official site");
eq("nptel qr link", g("nptel", "https://nptel.ac.in/noc/E_Certificate/NPTEL00SAMPLE").level, "green");
eq("comptia verify subdomain", g("secplus", "https://verify.comptia.org/").level, "green");
eq("red hat id format ok", g("rhcsa", "140-123-456").verdict, "ID looks right - confirm it");
eq("red hat id format wrong", g("rhcsa", "14012345").verdict, "ID doesn't match the format");
eq("workshop can't be verified", g("workshop").verdict, "Can't be verified");
eq("springboard no public page", g("springboard").verdict, "No public check found");
eq("no link yet", g("aws-ccp").verdict, "Not checked yet");
eq("fake university", g("nptel", "", "Commercial University Ltd, Daryaganj").verdict, "Fake university");
eq("fake university typo", g("nptel", "", "Commercial Universty Ltd").verdict, "Fake university");
eq("real university not flagged", g("nptel", "", "Savitribai Phule Pune University").verdict, "Not checked yet");
eq("hostOf without https", L.hostOf("coursera.org/verify/x"), "coursera.org");
eq("hostOf an ID", L.hostOf("140-123-456"), null);
eq("subdomain is not look-alike", L.looksLike("verify.comptia.org", "comptia.org"), false);
eq("look-alike with brand", L.looksLike("coursera-certificates.net", "coursera.org"), true);

// --- uploaded file: allowed types and size limit ---
const MB = 1024 * 1024;
eq("png accepted", L.checkFile("cert.png", "image/png", 1 * MB, 5).kind, "image");
eq("jpg accepted", L.checkFile("photo.JPG", "image/jpeg", 2 * MB, 5).kind, "image");
eq("pdf accepted", L.checkFile("certificate.pdf", "application/pdf", 3 * MB, 5).kind, "pdf");
eq("pdf by extension when type is missing", L.checkFile("certificate.pdf", "", 3 * MB, 5).kind, "pdf");
eq("too big rejected", L.checkFile("big.pdf", "application/pdf", 7.2 * MB, 5).ok, false);
eq("too big message", L.checkFile("big.pdf", "application/pdf", 7.2 * MB, 5).why, "This file is 7.2 MB - the limit is 5 MB.");
eq("exactly at the limit accepted", L.checkFile("ok.png", "image/png", 5 * MB, 5).ok, true);
eq("word file rejected", L.checkFile("cert.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 1 * MB, 5).ok, false);
eq("gif rejected", L.checkFile("anim.gif", "image/gif", 1 * MB, 5).ok, false);
eq("empty file rejected", L.checkFile("empty.pdf", "application/pdf", 0, 5).ok, false);

// --- links found inside a PDF ---
eq("verify page wins", L.pickLink(["https://www.coursera.org/learn/x", "https://coursera.org/verify/ABC123.", "https://example.com"], VERIFY_METHODS), "https://coursera.org/verify/ABC123");
eq("official site over others", L.pickLink(["https://example.com/a", "https://www.isc2.org/about"], VERIFY_METHODS), "https://www.isc2.org/about");
eq("look-alike kept so it gets flagged", L.pickLink(["https://example.com/a", "https://coursera-verify.com/verify/1"], VERIFY_METHODS), "https://coursera-verify.com/verify/1");
eq("no links", L.pickLink(["not a link", "123"], VERIFY_METHODS), null);

// --- new verification methods (version 2) ---
eq("udemy short link", g("udemy", "https://ude.my/UC-sample").level, "green");
eq("udemy.com link", g("udemy", "https://www.udemy.com/certificate/UC-sample/").level, "green");
eq("edx certificate link", g("edx", "https://courses.edx.org/certificates/sampleid").verdict, "Official verification link");
eq("edx home page is not a certificate", g("edx", "https://www.edx.org/").verdict, "Official site, but not a verification page");
eq("internshala verify page", g("internshala", "https://trainings.internshala.com/verify-certificate/?certificate_number=SAMPLE").level, "green");
eq("github foundations on credly", g("github-found", "https://www.credly.com/badges/sample").level, "green");
eq("linkedin learning has no public check", g("linkedin-learning").verdict, "No public check found");

// --- a certificate that is not in our list (answers come from the user) ---
const anyG = (link, hasLink, issuer) => L.checkGenuineAny({ link: link || "", issuer: issuer || "" }, hasLink, VERIFY_METHODS, FAKE_UNIS);
eq("unlisted: no link at all", anyG("", "no").verdict, "Can't be verified");
eq("unlisted: has a link but not pasted", anyG("", "yes").verdict, "Not checked yet");
eq("unlisted: credly link", anyG("https://www.credly.com/badges/x", "yes").verdict, "Known verification site");
eq("unlisted: look-alike", anyG("https://credly-badges.net/x", "yes").level, "red");
eq("unlisted: unknown website", anyG("https://xyzacademy.example/cert/1", "yes").verdict, "We don't know this website");
eq("unlisted: an ID", anyG("ABC-12345", "yes").verdict, "Check the ID with the issuer");
eq("unlisted: fake university", anyG("", "no", "Raja Arabic University, Nagpur").verdict, "Fake university");
const cv = (issuer, earned, field) => L.marketValue(L.customCert("Some certificate", "", { issuer: issuer, earned: earned, field: field }), ROLES, ROLE_INFO, { certs: {}, roles: {} });
eq("unlisted: vendor + supervised exam + cloud", cv("vendor", "proctored", "cloud").percent, 100);
eq("unlisted: platform + online tests + data", cv("platform", "graded", "data").percent, 67);
eq("unlisted: platform + videos, no field", cv("platform", "completion", "").percent, 33);
eq("unlisted: unknown issuer + attended", cv("unknown", "attendance", "ai").percent, 0);
eq("unlisted: unknown issuer gets no demand points", cv("unknown", "proctored", "ai").checks[2].points, 0);
eq("unlisted: band", cv("unknown", "attendance", "").band, "Low market value");

// --- market value ---
const mv = (id, live) => L.marketValue(cert(id), ROLES, ROLE_INFO, live || { certs: {}, roles: {} });
let r = mv("workshop"); eq("workshop value", r.percent, 0); eq("workshop band", r.band, "Low market value");
r = mv("aws-ccp"); eq("aws ccp value", r.percent, 100);
r = mv("nptel"); eq("nptel value", r.percent, 83);
r = mv("google-data"); eq("google data value", r.percent, 67); eq("google data band", r.band, "Medium market value");
r = mv("oracle-java-se"); eq("java se (IT under pressure)", r.percent, 83);
r = mv("cissp"); eq("cissp needs experience", r.warning !== null, true);
r = mv("tf-dev"); eq("tf closed", r.warning, "No longer offered - it can't be earned now.");
eq("aws ccp leads to cloud jobs", mv("aws-ccp").jobs[0].id, "cloud");

// demand from verified live sources (TEST-ONLY sample, never shipped)
const fakeLive = { roles: {}, certs: {
  rhcsa: { demand: [{ url: "https://a.example", quote: "q" }, { url: "https://b.example", quote: "q" }] },
  ccna: { demand: [{ url: "https://a.example", quote: "q" }] },
  "aws-ccp": { demand: [] },
  "az-104": { price: { value: "test value" } }   // free refresh: price checked, demand not looked up
} };
eq("2 sources -> 2 pts", mv("rhcsa", fakeLive).checks[2].points, 2);
eq("1 source -> 1 pt", mv("ccna", fakeLive).checks[2].points, 1);
eq("0 sources -> 0 pts", mv("aws-ccp", fakeLive).checks[2].points, 0);
eq("no demand list -> job demand", mv("az-104", fakeLive).checks[2].points, 2);

// higher value in the same field
const better = (id) => L.betterValue(cert(id), CERTS, ROLES, ROLE_INFO, { certs: {}, roles: {} }, 3).map(v => v.cert.id);
eq("workshop -> nptel first", better("workshop")[0], "nptel");
eq("google data -> pl-300 suggested", better("google-data").includes("pl-300"), true);
eq("aws ccp -> nothing higher", better("aws-ccp").length, 0);
console.log("   better for google-cyber:", better("google-cyber").join(", "));

// --- browse and compare ---
const NO_LIVE = { certs: {}, roles: {} };
const browse = (field, sortBy) => L.browseList(CERTS, ROLES, ROLE_INFO, NO_LIVE, field, sortBy);
const inOrder = (list, ok) => list.every((v, i) => i === 0 || ok(list[i - 1], v));
eq("browse: all certificates listed", browse("all", "value").length, CERTS.length);
eq("browse: highest value first", browse("all", "value")[0].percent, 100);
eq("browse: lowest value last", browse("all", "value")[CERTS.length - 1].percent, 0);
eq("browse: sorted by value", inOrder(browse("all", "value"), (a, b) => a.percent >= b.percent), true);
eq("browse: field filter keeps only that field", browse("sec", "value").every(v => v.cert.roles.includes("sec")), true);
eq("browse: field filter finds them all", browse("cloud", "value").length, CERTS.filter(c => c.roles.includes("cloud")).length);
eq("browse: general = not tied to one job", browse("general", "value").every(v => v.cert.roles.every(x => x === "all")), true);
eq("browse: workshop is general", browse("general", "value").some(v => v.cert.id === "workshop"), true);
eq("browse: every certificate is in a field or general", browse("general", "value").length +
  CERTS.filter(c => c.roles.some(x => x !== "all")).length, CERTS.length);
eq("browse: cheapest first", browse("all", "cost")[0].cert.costBand, "free");
eq("browse: sorted by name", inOrder(browse("all", "name"), (a, b) =>
  a.cert.name.replace(/^[^a-z0-9]+/i, "").localeCompare(b.cert.name.replace(/^[^a-z0-9]+/i, "")) <= 0), true);
let rows = L.compareRows(mv("pl-300"), mv("google-data"));
eq("compare: 7 rows", rows.length, 7);
eq("compare: pl-300 beats google data on value", rows[0].better, "a");
eq("compare: the other way round", L.compareRows(mv("google-data"), mv("pl-300"))[0].better, "b");
eq("compare: supervised exam beats online tests", rows[2].better, "a");
eq("compare: price has no winner", rows.find(x => x.label === "Price").better, "");
eq("compare: a certificate against itself is a tie", L.compareRows(mv("rhcsa"), mv("rhcsa")).every(x => x.better === ""), true);
eq("compare: warning shown", L.compareRows(mv("cissp"), mv("secplus")).find(x => x.label === "Good to know").a.startsWith("Not for freshers yet"), true);

// --- the one-line verdict at the top of a result ---
let line = L.verdictLine(g("aws-ccp", "https://www.credly.com/badges/abc"), mv("aws-ccp"));
eq("verdict line: genuine side", line.genuine.text, "Official verification link");
eq("verdict line: worth side", line.worth.text, "High market value (100%)");
eq("verdict line: worth colour", line.worth.level, "green");
line = L.verdictLine(g("google-data", "https://coursera-verify.com/verify/X"), mv("google-data"));
eq("verdict line: look-alike is red", line.genuine.level, "red");
eq("verdict line: a fake has no value", line.worth.text, "No market value if it is fake");
line = L.verdictLine(anyG("", "no", "Commercial University Ltd., Daryaganj"), cv("unknown", "attendance", ""));
eq("verdict line: fake university", line.worth.text, "No market value");
line = L.verdictLine(g("workshop", ""), mv("workshop"));
eq("verdict line: genuine but low value", line.worth.text, "Low market value (0%)");
line = L.verdictLine({ level: "amber", verdict: "Real, but a different certificate" }, mv("aws-ccp"));
eq("verdict line: a different certificate - score is for the one named", line.worth.text, "High market value (100%) - for the certificate you named");
eq("verdict line: a different certificate is amber", line.worth.level, "amber");

// --- free refresh helpers (refresh/pages.js) ---
const P = require("../refresh/pages.js");
const longPage = "x ".repeat(3000) + "The CCNA exam fee is USD 300 plus tax. " + "y ".repeat(3000);
const cut = P.excerpt(longPage, ["fee"], 1500);
eq("excerpt keeps the fee sentence", cut.includes("The CCNA exam fee is USD 300 plus tax."), true);
eq("excerpt is shorter", cut.length <= 1500, true);
eq("short page sent whole", P.excerpt("Exam fee USD 99.", ["fee"], 1500), "Exam fee USD 99.");
const sample = { steps: [{ type: "thought", signature: "abc" },
  { type: "model_output", content: [{ type: "text", text: "<json>{\"price\": null}</json>" }] }] };
eq("gemini answer text read", P.collectText(sample), "<json>{\"price\": null}</json>");
eq("empty gemini answer", P.collectText({}), "");

// --- fact checker (refresh/verify.js) ---
const V = require("../refresh/verify.js");
const page = V.htmlToText("<html><script>var x=1</script><p>Freshers typically earn &#8377;3.5&ndash;6 LPA in data analyst roles.</p>" +
  "<p>The exam costs USD 100.</p></html>");
eq("html stripped", page.includes("var x"), false);
eq("real quote accepted", V.verifyFact({ value: "₹3.5 - 6 LPA", url: "https://x.example", quote: "Freshers typically earn ₹3.5–6 LPA in data analyst roles." }, page).ok, true);
eq("Rs. vs ₹ accepted", V.verifyFact({ value: "Rs 3.5-6 LPA", url: "https://x.example", quote: "Freshers typically earn Rs. 3.5-6 LPA in data analyst roles" }, page).ok, true);
eq("changed quote rejected", V.verifyFact({ value: "₹4 - 8 LPA", url: "https://x.example", quote: "Freshers typically earn ₹4–8 LPA in data analyst roles." }, page).ok, false);
eq("number not in quote rejected", V.verifyFact({ value: "USD 150", url: "https://x.example", quote: "The exam costs USD 100." }, page).ok, false);
eq("missing url rejected", V.verifyFact({ value: "USD 100", url: "", quote: "The exam costs USD 100." }, page).ok, false);
eq("demand quote must name cert", V.quoteNamesCert("Employers want RHCSA holders", cert("rhcsa")), true);
eq("demand quote without cert", V.quoteNamesCert("Employers want Linux skills", cert("rhcsa")), false);

// --- edit distance ---
eq("edit kitten sitting", L.editDistance("kitten", "sitting"), 3);

// --- reading the text of a certificate (OCR / PDF text) ---
let f = L.findInText("Certificate of Completion\nGoogle Data Analytics\nVerify at coursera.org/verify/SAMPLE123ABC", CERTS, FAKE_UNIS, VERIFY_METHODS);
eq("text: certificate recognised", f.certId, "google-data");
eq("text: link found", f.link, "coursera.org/verify/SAMPLE123ABC");
f = L.findInText("Red Hat Certified System Administrator   Certification ID: 140-123-456", CERTS, FAKE_UNIS, VERIFY_METHODS);
eq("text: rhcsa recognised", f.certId, "rhcsa");
eq("text: ID found", f.id, "140-123-456");
f = L.findInText("Bachelor of Technology awarded by Commercial University Ltd. Daryaganj Delhi", CERTS, FAKE_UNIS, VERIFY_METHODS);
eq("text: fake university spotted", f.fakeUni, "Commercial University Ltd., Daryaganj, Delhi");
f = L.findInText("Certificate of participation in the annual sports day", CERTS, FAKE_UNIS, VERIFY_METHODS);
eq("text: nothing found", f.link === null && f.id === null && f.certId === null && f.fakeUni === null, true);

// --- the issuer's own answer applied to our result ---
const official = g("aws-ccp", "https://www.credly.com/badges/sample-id");
const yes = { supported: true, issuer: "credly", exists: true, details: { badgeName: "AWS Certified Cloud Practitioner", issuerName: "Amazon Web Services", issuedOn: "2025-06-01", expires: "2028-06-01" } };
eq("live: confirmed", L.applyLive(official, yes, cert("aws-ccp"), CERTS, "2026-10-03").verdict, "Confirmed by the issuer");
eq("live: no record", L.applyLive(official, { supported: true, issuer: "credly", exists: false }, cert("aws-ccp"), CERTS, "2026-10-03").verdict, "No record at the issuer");
eq("live: no record is red", L.applyLive(official, { supported: true, issuer: "credly", exists: false }, cert("aws-ccp"), CERTS, "2026-10-03").level, "red");
eq("live: expired", L.applyLive(official, yes, cert("aws-ccp"), CERTS, "2029-01-01").verdict, "Confirmed, but expired");
eq("live: real badge, wrong certificate", L.applyLive(official, yes, cert("ccna"), CERTS, "2026-10-03").verdict, "Real, but a different certificate");
eq("live: no clear answer keeps our result", L.applyLive(official, { supported: true, issuer: "credly", exists: null }, cert("aws-ccp"), CERTS, "2026-10-03"), official);
eq("live: unsupported link keeps our result", L.applyLive(official, { supported: false }, cert("aws-ccp"), CERTS, "2026-10-03"), official);
eq("same certificate by alias", L.sameCert(cert("rhcsa"), "Red Hat Certified System Administrator (RHCSA)", CERTS), true);
eq("different certificate", L.sameCert(cert("rhcsa"), "Oracle Database SQL Certified Expert", CERTS), false);

// --- CertWise API: which issuer address we ask (api/live.js) ---
const A = require("../api/live.js");
const UUID = "0a1b2c3d-1111-2222-3333-444455556666";
eq("api: credly badge", A.liveTarget("https://www.credly.com/badges/" + UUID + "/public_url").ask, "https://www.credly.com/api/v1/obi/v2/badge_assertions/" + UUID);
eq("api: credly needs a real ID format", A.liveTarget("https://www.credly.com/badges/sample-badge-id"), null);
eq("api: coursera verify", A.liveTarget("coursera.org/verify/ABCD1234EFGH").ask, "https://www.coursera.org/api/certificate.v1/pdf/ABCD1234EFGH");
eq("api: coursera long form", A.liveTarget("https://www.coursera.org/account/accomplishments/verify/ABCD1234EFGH").issuer, "coursera");
eq("api: coursera specialization left alone", A.liveTarget("https://www.coursera.org/account/accomplishments/specialization/ABCD1234EFGH"), null);
eq("api: edx certificate", A.liveTarget("https://courses.edx.org/certificates/0123456789abcdef0123456789abcdef").issuer, "edx");
eq("api: look-alike site is never fetched", A.liveTarget("https://credly.com.evil.example/badges/" + UUID), null);
eq("api: other websites are never fetched", A.liveTarget("https://example.com/badges/" + UUID), null);
eq("api: not a link", A.liveTarget("140-123-456"), null);

// a pretend issuer, so the tests never touch the real websites
function pretend(answers) {
  return async address => {
    const a = answers[address] || { status: 404 };
    return { status: a.status, ok: a.status === 200, json: async () => a.json, text: async () => a.text || "", body: null };
  };
}
const BADGE = "https://www.credly.com/api/v1/obi/v2/issuers/i1/badge_classes/b1";
const realCredly = pretend({
  ["https://www.credly.com/api/v1/obi/v2/badge_assertions/" + UUID]: { status: 200, json: { issuedOn: "2025-06-01T00:00:00.000Z", expires: "2028-06-01", badge: BADGE } },
  [BADGE]: { status: 200, json: { name: "AWS Certified Cloud Practitioner", issuer: { name: "Amazon Web Services Training and Certification" } } }
});

// --- any certificate: what the user typed, and scoring from the issuer's own record ---
const { KNOWN_ISSUERS, FIELD_WORDS, COURSERA_GRADED_SRC } = require("../data/issuers.js");
eq("kind: a name", L.kindOfText("AWS Cloud Practitioner", VERIFY_METHODS), "name");
eq("kind: a link", L.kindOfText("https://www.credly.com/badges/abc", VERIFY_METHODS), "link");
eq("kind: a link without https", L.kindOfText("coursera.org/verify/ABCD1234", VERIFY_METHODS), "link");
eq("kind: a bare website", L.kindOfText("credly.com", VERIFY_METHODS), "link");
eq("kind: a Red Hat ID", L.kindOfText("140-123-456", VERIFY_METHODS), "id");
eq("kind: node.js is a name", L.kindOfText("node.js", VERIFY_METHODS), "name");
eq("kind: az-900 is a name", L.kindOfText("az-900", VERIFY_METHODS), "name");
eq("kind: empty", L.kindOfText("  ", VERIFY_METHODS), "empty");

const ki = (name, text) => { const k = L.knownIssuer(name, text || "", KNOWN_ISSUERS); return k ? k.name + ":" + k.type : null; };
eq("issuer: AWS", ki("Amazon Web Services Training and Certification"), "Amazon Web Services:vendor");
eq("issuer: Cisco", ki("Cisco"), "Cisco:vendor");
eq("issuer: a Cisco academy course", ki("Cisco", "Passing score on Cisco Networking Academy final exam"), "Cisco Networking Academy:platform");
eq("issuer: ISC2 with brackets", ki("(ISC)²"), "ISC2:vendor");
eq("issuer: whole words only", ki("Intelligence Training Hub"), null);
eq("issuer: unknown", ki("Sharma Coaching Classes"), null);
const issuerNames = new Set();
for (const entry of KNOWN_ISSUERS) {
  if (issuerNames.has(entry.name)) { fails++; console.log("FAIL duplicate issuer " + entry.name); }
  issuerNames.add(entry.name);
  if (!["vendor", "academic", "platform"].includes(entry.type) || entry.match.length === 0) { fails++; console.log("FAIL bad issuer entry " + entry.name); }
}
for (const field in FIELD_WORDS) if (!ROLE_INFO[field]) { fails++; console.log("FAIL field words for an unknown role " + field); }

eq("earned: supervised", L.earnedFromText("Pass the proctored certification exam"), "proctored");
eq("earned: exam", L.earnedFromText("Assessment: Passing score on the final exam."), "graded");
eq("earned: passing grade", L.earnedFromText("successfully completed and received a passing grade in Git"), "graded");
eq("earned: attending", L.earnedFromText("Attend the two-day workshop"), "attendance");
eq("earned: finishing", L.earnedFromText("Complete all the video lessons"), "completion");
eq("earned: nothing said", L.earnedFromText(""), null);
eq("earned: no clue in the words", L.earnedFromText("Awarded to outstanding members"), null);

const ff = text => L.fieldsFromText(text, FIELD_WORDS).join(",");
eq("field: front-end", ff("Introduction to Front-End Development"), "web");
eq("field: git", ff("Git and GitHub Basics"), "dev");
eq("field: security skills", ff("Introduction to Cybersecurity Cyber Best Practices Network Vulnerabilities Threat Detection"), "sec");
eq("field: java is not javascript", ff("JavaScript Essentials"), "web");
eq("field: none", ff("Leadership and Teamwork"), "");

const lc = d => { const c = L.listedCert(d, CERTS); return c ? c.id : null; };
eq("listed: AWS badge", lc({ badgeName: "AWS Certified Cloud Practitioner", issuerName: "Amazon Web Services Training and Certification" }), "aws-ccp");
eq("listed: Cisco academy course", lc({ badgeName: "Introduction to Cybersecurity", issuerName: "Cisco" }), "netacad");
eq("listed: same name from another issuer is not ours", lc({ badgeName: "AWS Certified Cloud Practitioner", issuerName: "Sharma Coaching Classes" }), null);
eq("listed: a different AWS exam is not guessed", lc({ badgeName: "AWS Certified Data Engineer - Associate", issuerName: "Amazon Web Services Training and Certification" }), null);
eq("listed: a course we don't have", lc({ badgeName: "Git and GitHub Basics", issuerName: "IBM", platform: "edX" }), null);

const cfl = link => { const c = L.certForLink(link, VERIFY_METHODS, CERT_VERIFY, CERTS); return c ? c.id : null; };
eq("site: an NPTEL link is an NPTEL certificate", cfl("https://nptel.ac.in/noc/E_Certificate/NPTEL24CS01S1"), "nptel");
eq("site: a Udemy short link", cfl("https://ude.my/UC-12345"), "udemy");
eq("site: an Internshala link", cfl("trainings.internshala.com/verify_certificate"), "internshala");
eq("site: Credly hosts many certificates", cfl("https://www.credly.com/badges/" + UUID), null);
eq("site: Red Hat could be any Red Hat exam", cfl("https://rhtapps.redhat.com/verify"), null);
eq("site: a copy-cat is not the real site", cfl("https://nptel-ac.in.example.com/noc/x"), null);
eq("site: an ID is not a site", cfl("140-123-456"), null);

const rc = (d, site) => L.recordCert(d, site, KNOWN_ISSUERS, FIELD_WORDS, COURSERA_GRADED_SRC);
let auto = rc({ badgeName: "Networking Basics", issuerName: "Cisco", criteria: "Assessment: Passing score on Cisco Networking Academy final exam.", skills: ["Networking", "IP Addressing"] }, "credly");
eq("record: marked as read from the record", auto.auto, true);
eq("record: academy course is a learning programme", auto.issuerType, "platform");
eq("record: an exam, in the issuer's words", auto.assessment, "graded");
eq("record: field from the skills", auto.roles.join(","), "cloud");
r = L.marketValue(auto, ROLES, ROLE_INFO, NO_LIVE);
eq("record: score", r.percent, 67);
eq("record: the reason quotes the issuer", r.checks[1].reason.includes("Passing score on Cisco Networking Academy final exam"), true);
auto = rc({ badgeName: "AWS Certified Data Engineer - Associate", issuerName: "Amazon Web Services Training and Certification", criteria: "Pass the AWS Certified Data Engineer - Associate exam.", skills: ["AWS", "Data Pipelines"] }, "credly");
eq("record: AWS is a recognised issuer", auto.issuerType, "vendor");
eq("record: exam not called supervised scores 1", L.marketValue(auto, ROLES, ROLE_INFO, NO_LIVE).checks[1].points, 1);
eq("record: AWS exam score", L.marketValue(auto, ROLES, ROLE_INFO, NO_LIVE).percent, 83);
auto = rc({ badgeName: "Star Performer", issuerName: "Sharma Coaching Classes", criteria: "Attend the annual workshop" }, "credly");
eq("record: unknown issuer", auto.issuerType, "unknown");
r = L.marketValue(auto, ROLES, ROLE_INFO, NO_LIVE);
eq("record: unknown issuer + attendance = 0%", r.percent, 0);
eq("record: says the issuer is not recognised", r.checks[0].reason.includes("not on our list of recognised issuers"), true);
auto = rc({ badgeName: "Introduction to Front-End Development", issuerName: "Meta", platform: "Coursera" }, "coursera");
eq("record: a Coursera course is a platform certificate", auto.issuerType, "platform");
eq("record: shows who offers it", auto.issuer, "Meta, on Coursera");
eq("record: Coursera rule for how it is earned", auto.assessment, "graded");
eq("record: Coursera rule has a proof link", L.marketValue(auto, ROLES, ROLE_INFO, NO_LIVE).checks[1].links.length, 1);
eq("record: web field", auto.roles.join(","), "web");
auto = rc({ badgeName: "Git and GitHub Basics", issuerName: "IBM", platform: "edX", criteria: "successfully completed and received a passing grade in Git and GitHub Basics" }, "edx");
eq("record: edX passing grade", auto.assessment, "graded");
eq("record: edX field", auto.roles.join(","), "dev");
auto = rc({ badgeName: "Member Badge", issuerName: "Oracle" }, "credly");
eq("record: nothing said about earning it scores 0", L.marketValue(auto, ROLES, ROLE_INFO, NO_LIVE).checks[1].points, 0);
eq("record: no field found is scored in the middle", L.marketValue(auto, ROLES, ROLE_INFO, NO_LIVE).checks[2].points, 1);
const confirmed = L.applyLive(anyG("https://www.credly.com/badges/" + UUID, "yes"),
  { supported: true, issuer: "credly", exists: true, details: { badgeName: "Member Badge", issuerName: "Oracle", issuedOn: "2025-01-01" } }, auto, CERTS, "2026-10-06");
eq("record: the issuer's answer confirms it", confirmed.verdict, "Confirmed by the issuer");

(async () => {
  let live = await A.liveCheck("https://www.credly.com/badges/" + UUID, realCredly);
  eq("api: real badge exists", live.exists, true);
  eq("api: badge name read", live.details.badgeName, "AWS Certified Cloud Practitioner");
  eq("api: issuer name read", live.details.issuerName, "Amazon Web Services Training and Certification");
  eq("api: issue date read", live.details.issuedOn, "2025-06-01");
  live = await A.liveCheck("https://www.credly.com/badges/" + UUID, pretend({}));
  eq("api: made-up badge does not exist", live.exists, false);
  live = await A.liveCheck("coursera.org/verify/ABCD1234EFGH", pretend({ "https://www.coursera.org/api/certificate.v1/pdf/ABCD1234EFGH": { status: 200 } }));
  eq("api: real coursera certificate exists", live.exists, true);
  live = await A.liveCheck("coursera.org/verify/ABCD1234EFGH", pretend({}));
  eq("api: made-up coursera code does not exist", live.exists, false);
  live = await A.liveCheck("https://www.credly.com/badges/" + UUID, async () => { throw new Error("timeout"); });
  eq("api: issuer not answering gives no verdict", live.exists, null);
  // a 200 answer that is a web page, not a badge record, must NOT count as "confirmed"
  live = await A.liveCheck("https://www.credly.com/badges/" + UUID, async () => ({ status: 200, ok: true, json: async () => { throw new Error("not JSON"); } }));
  eq("api: unreadable answer gives no verdict", live.exists, null);
  live = await A.liveCheck("https://www.credly.com/badges/" + UUID, pretend({ ["https://www.credly.com/api/v1/obi/v2/badge_assertions/" + UUID]: { status: 200, json: { hello: "world" } } }));
  eq("api: an answer without a badge gives no verdict", live.exists, null);
  live = await A.liveCheck("https://example.com/x", pretend({}));
  eq("api: unsupported link", live.supported, false);

  // what the issuer's record says about the certificate itself (used when it is not in our list)
  const RICH = "https://www.credly.com/api/v1/obi/v2/issuers/i2/badge_classes/b2";
  live = await A.liveCheck("https://www.credly.com/badges/" + UUID, pretend({
    ["https://www.credly.com/api/v1/obi/v2/badge_assertions/" + UUID]: { status: 200, json: { issuedOn: "2025-06-01T00:00:00.000Z", badge: RICH } },
    [RICH]: { status: 200, json: { name: "<b>Networking</b> Basics", description: "Covers how networks work.",
      criteria: { id: "https://www.credly.com/org/cisco/badge/networking-basics", narrative: "Assessment: Passing score on the final exam." },
      tags: ["Networking", "IP Addressing", 42], issuer: { name: "Cisco" } } }
  }));
  eq("api: tags in a badge name are removed", live.details.badgeName, "Networking Basics");
  eq("api: how it is earned is read", live.details.criteria, "Assessment: Passing score on the final exam.");
  eq("api: skills are read (text only)", live.details.skills.join("|"), "Networking|IP Addressing");
  eq("api: the badge's public page is kept", live.details.recordUrl, "https://www.credly.com/org/cisco/badge/networking-basics");
  const COURSE_PAGE = "<html><head><meta property=\"og:title\" content=\"Completion Certificate for Introduction to Front-End Development\">" +
    "<meta property=\"og:description\" content=\"This certificate verifies my successful completion of Meta&#x27;s &quot;Introduction to Front-End Development&quot; on Coursera\"></head></html>";
  live = await A.liveCheck("coursera.org/verify/ABCD1234EFGH", pretend({
    "https://www.coursera.org/api/certificate.v1/pdf/ABCD1234EFGH": { status: 200 },
    "https://www.coursera.org/account/accomplishments/verify/ABCD1234EFGH": { status: 200, text: COURSE_PAGE }
  }));
  eq("api: coursera course name read", live.details.badgeName, "Introduction to Front-End Development");
  eq("api: coursera partner read", live.details.issuerName, "Meta");
  eq("api: coursera marked as a platform", live.details.platform, "Coursera");
  live = await A.liveCheck("coursera.org/verify/ABCD1234EFGH", pretend({ "https://www.coursera.org/api/certificate.v1/pdf/ABCD1234EFGH": { status: 200 } }));
  eq("api: coursera certificate exists even if its page can't be read", live.exists, true);
  eq("api: ...but then no course name is made up", live.details.badgeName, undefined);
  const EDX_ID = "0123456789abcdef0123456789abcdef";
  const EDX_PAGE = "<p><span class=\"accomplishment-summary copy\">successfully completed and received a passing grade in</span>" +
    "<span class=\"accomplishment-course\"><span class=\"accomplishment-course-number\">CD0131EN</span>: <span class=\"accomplishment-course-name\">Git and GitHub Basics</span></span>" +
    "<span class=\"accomplishment-statement-detail copy\">a course of study offered by IBM, an online learning initiative of IBM.</span></p>";
  live = await A.liveCheck("https://courses.edx.org/certificates/" + EDX_ID, pretend({ ["https://courses.edx.org/certificates/" + EDX_ID]: { status: 200, text: EDX_PAGE } }));
  eq("api: edx course name read", live.details.badgeName, "Git and GitHub Basics");
  eq("api: edx organisation read", live.details.issuerName, "IBM");
  eq("api: edx says a passing grade was needed", live.details.criteria.includes("received a passing grade"), true);

  console.log(fails === 0 ? "\nALL PASS" : "\n" + fails + " FAILED");
})();
