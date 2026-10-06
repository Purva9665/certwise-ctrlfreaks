// CertWise API - live check with the issuer
//
// The browser can't ask Credly / Coursera / edX directly (their sites don't allow it), so this small
// server-side helper does. It answers one question: does the issuer have a record of this certificate?
//
// Safety: we never fetch the link the user typed. We only pull the certificate ID out of it, check
// its format, and build the issuer's address ourselves - so the server can't be tricked into
// fetching some other website.

const UA = { "User-Agent": "CertWise-livecheck/2.0 (student project)", "Accept": "*/*" };
// Credly only sends the data record (not a web page) when we ask for JSON alone
const JSON_ONLY = { "User-Agent": UA["User-Agent"], "Accept": "application/json" };

// "https://www.credly.com/badges/<id>/public_url" -> { issuer: "credly", id: "<id>", ask: "<issuer address>" }
// returns null when we have no live check for this kind of link
function liveTarget(link) {
  let url;
  try {
    url = new URL(/^https?:\/\//i.test(link.trim()) ? link.trim() : "https://" + link.trim());
  } catch (e) {
    return null;
  }
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const parts = url.pathname.split("/").filter(p => p.length > 0);

  // Credly badge: /badges/<36-character id>
  if ((host === "credly.com" || host === "youracclaim.com") && parts[0] === "badges" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(parts[1] || "")) {
    return { issuer: "credly", id: parts[1].toLowerCase(),
             ask: "https://www.credly.com/api/v1/obi/v2/badge_assertions/" + parts[1].toLowerCase() };
  }

  // Coursera course certificate: /verify/<CODE> or /account/accomplishments/verify/<CODE>
  // (specialization and professional-certificate links use a different check, so we leave those alone)
  if (host === "coursera.org") {
    const at = parts.indexOf("verify");
    const code = at >= 0 ? parts[at + 1] : "";
    if (at >= 0 && parts.length === at + 2 && /^[A-Z0-9]{8,16}$/.test(code)) {
      return { issuer: "coursera", id: code, ask: "https://www.coursera.org/api/certificate.v1/pdf/" + code };
    }
    return null;
  }

  // edX certificate: courses.edx.org/certificates/<32 hex characters>
  if (host === "courses.edx.org" && parts[0] === "certificates" && /^[0-9a-f]{32}$/i.test(parts[1] || "")) {
    return { issuer: "edx", id: parts[1].toLowerCase(), ask: "https://courses.edx.org/certificates/" + parts[1].toLowerCase() };
  }
  return null;
}

async function getJson(address, fetcher) {
  const res = await fetcher(address, { headers: JSON_ONLY, signal: AbortSignal.timeout(12000) });
  return res.ok ? await res.json() : null;
}

// text taken from an issuer's page: no tags, no HTML codes, not too long
function plain(text, max) {
  return String(text == null ? "" : text)
    .replace(/<[^>]*>/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (m, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (m, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&quot;/g, "\"").replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
    .replace(/\s+/g, " ").trim().slice(0, max || 200);
}

// <meta property="og:title" content="..."> -> the content (the two attributes can come in either order)
function metaTag(html, name) {
  const m = html.match(new RegExp("<meta[^>]+property=[\"']" + name + "[\"'][^>]*content=[\"']([^\"']*)[\"']", "i")) ||
            html.match(new RegExp("<meta[^>]+content=[\"']([^\"']*)[\"'][^>]*property=[\"']" + name + "[\"']", "i"));
  return m ? m[1] : "";
}

// Coursera's public certificate page names the course and the organisation that offers it
function readCoursera(html, details) {
  const title = plain(metaTag(html, "og:title"), 160).match(/^Completion Certificate for (.+)$/);
  if (!title) return;
  details.badgeName = title[1];
  details.platform = "Coursera";
  const about = plain(metaTag(html, "og:description"), 300).match(/completion of (.+?)['’]s ["“]/);
  if (about) details.issuerName = about[1];
}

// edX's certificate page: the course, who offers it, and that a passing grade was needed
function readEdx(html, details) {
  const course = html.match(/class="accomplishment-course-name"[^>]*>([^<]+)</);
  if (!course) return;
  details.badgeName = plain(course[1], 160);
  details.platform = "edX";
  const org = html.match(/a course of study offered by ([^,<]+),/);
  if (org) details.issuerName = plain(org[1], 80);
  const how = html.match(/class="accomplishment-summary[^"]*"[^>]*>([^<]+)</);
  if (how) details.criteria = plain(how[1], 200) + " " + details.badgeName;
}

// returns { supported, issuer, exists, details }
//   supported: false -> we have no live check for this link
//   exists: true / false / null (null = the issuer did not give a clear answer)
//   details: what the issuer's own record says about the CERTIFICATE (never about the person):
//            badgeName, issuerName, issuedOn, expires, and when the record has them
//            criteria (how it is earned), skills, description, recordUrl, platform
async function liveCheck(link, fetcher) {
  fetcher = fetcher || fetch;
  const target = liveTarget(link);
  if (!target) return { supported: false };
  const result = { supported: true, issuer: target.issuer, exists: null, details: {} };

  let res;
  try {
    res = await fetcher(target.ask, { headers: target.issuer === "credly" ? JSON_ONLY : UA, signal: AbortSignal.timeout(12000) });
  } catch (e) {
    return result;                       // the issuer's site didn't answer in time
  }

  if (res.status === 404 || res.status === 410) {
    result.exists = false;
  } else if (res.status === 200 && target.issuer === "credly") {
    // an Open Badges record: issue date, expiry, and a link to the badge's name and issuer.
    // "exists" is only true once we have actually read the record
    let record;
    try {
      record = await res.json();
    } catch (e) {
      return result;                     // not a record we can read: no clear answer
    }
    if (!record || typeof record !== "object" || !record.badge) return result;
    result.exists = true;
    result.details.issuedOn = String(record.issuedOn || "").slice(0, 10);
    if (record.expires) result.details.expires = String(record.expires).slice(0, 10);
    try {
      const badge = typeof record.badge === "string" && record.badge.startsWith("https://www.credly.com/")
        ? await getJson(record.badge, fetcher) : record.badge;
      if (badge && badge.name) {
        result.details.badgeName = plain(badge.name, 160);
        // what the badge itself says: how it is earned, the skills it covers, and its public description
        if (badge.description) result.details.description = plain(badge.description, 400);
        if (badge.criteria && badge.criteria.narrative) result.details.criteria = plain(badge.criteria.narrative, 400);
        if (badge.criteria && typeof badge.criteria.id === "string" && badge.criteria.id.startsWith("https://www.credly.com/")) {
          result.details.recordUrl = badge.criteria.id;
        }
        if (Array.isArray(badge.tags)) {
          result.details.skills = badge.tags.filter(t => typeof t === "string").slice(0, 12).map(t => plain(t, 40));
        }
        const iss = typeof badge.issuer === "string" && badge.issuer.startsWith("https://www.credly.com/")
          ? await getJson(badge.issuer, fetcher) : badge.issuer;
        if (iss && iss.name) result.details.issuerName = plain(iss.name, 80);
      }
    } catch (e) {
      // the badge exists, but its name could not be read - leave those details out
    }
  } else if (res.status === 200 && target.issuer === "coursera") {
    result.exists = true;
    if (res.body && res.body.cancel) res.body.cancel();   // Coursera sends the whole PDF: we only needed to know it exists
    try {
      // the address is built from the checked code - never from what the user typed
      const page = await fetcher("https://www.coursera.org/account/accomplishments/verify/" + target.id,
                                 { headers: UA, signal: AbortSignal.timeout(12000) });
      if (page.status === 200) readCoursera(await page.text(), result.details);
    } catch (e) {
      // the certificate exists, but the course name could not be read
    }
  } else if (res.status === 200) {
    result.exists = true;
    try {
      readEdx(await res.text(), result.details);
    } catch (e) {
      // the certificate exists, but the course name could not be read
    }
  }
  return result;
}

module.exports = { liveTarget, liveCheck, plain };
