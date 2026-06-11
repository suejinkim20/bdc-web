/**
 * scripts/sync-publications.js
 *
 * Fetches the publications tab from a private Google Sheet via
 * @bdc/google-api, validates and cleans each row, strips
 * UTM/tracking params from URLs, and writes the result as YAML to
 * content/publications.yaml.
 *
 * Usage:
 *   node --env-file=../../.env scripts/sync-publications.js
 *
 * Required env vars:
 *   SHEET_ID                 — Google Sheet ID
 *   PUBLICATIONS_TAB         — sheet tab name (e.g. "Publications")
 *   GOOGLE_CREDENTIALS_BASE64 — base64-encoded service account key JSON
 */

import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { fetchGoogleSheetValues } from "@bdc/google-api";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SHEET_ID   = process.env.SHEET_ID;
const TAB_NAME   = process.env.PUBLICATIONS_TAB;
const OUT_PATH   = path.resolve("src/content/publications.yaml");

if (!SHEET_ID) {
  console.error("Error: SHEET_ID environment variable is required.");
  process.exit(1);
}

if (!TAB_NAME) {
  console.error("Error: PUBLICATIONS_TAB environment variable is required.");
  process.exit(1);
}

// GOOGLE_CREDENTIALS_BASE64 is read directly by @monorepo/google-api
// No need to reference it here — it will throw a clear error if missing.

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const REQUIRED_COLUMNS = ["title", "date", "journal", "url"];

/** Returns an array of human-readable error strings for a single row. */
function validateRow(row, index) {
  const errors = [];
  const rowNum = index + 2; // +1 for 0-index, +1 for header row

  // All fields required
  for (const field of REQUIRED_COLUMNS) {
    if (!row[field]?.trim()) {
      errors.push(`Row ${rowNum}: missing required field "${field}"`);
    }
  }

  // Date format
  if (row.date && !/^\d{4}-\d{2}-\d{2}$/.test(row.date.trim())) {
    errors.push(`Row ${rowNum}: "date" should be YYYY-MM-DD, got "${row.date}"`);
  }

  // URL format
  if (row.url?.trim()) {
    try { new URL(row.url.trim()); }
    catch { errors.push(`Row ${rowNum}: invalid URL "${row.url}"`); }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// URL cleaner — strips UTM and other common tracking params
// ---------------------------------------------------------------------------

/** @param {string} rawUrl */
function stripTrackingParams(rawUrl) {
  if (!rawUrl) return rawUrl;
  try {
    const url = new URL(rawUrl);
    const TRACKING_PARAMS = [
      "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
      "ref", "source", "fbclid", "gclid", "mc_cid", "mc_eid",
      "_hsenc", "_hsmi", "hsCtaTracking",
    ];
    TRACKING_PARAMS.forEach((p) => url.searchParams.delete(p));
    return url.toString();
  } catch {
    return rawUrl; // not a valid URL — return as-is, validation will flag it
  }
}

// ---------------------------------------------------------------------------
// Fetch — returns rows as array of objects
// ---------------------------------------------------------------------------

async function fetchSheetRows() {
  console.log(`Fetching publications from tab "${TAB_NAME}"…`);

  const rows = await fetchGoogleSheetValues(SHEET_ID, TAB_NAME);

  if (rows.length < 2) throw new Error("Sheet appears to be empty.");

  // Map raw arrays to objects using the header row.
  // Using the API directly avoids CSV reassembly, which breaks on cells
  // containing commas.
  const [headers, ...body] = rows;
  return body.map((row) =>
    Object.fromEntries(headers.map((h, i) => [h.trim().toLowerCase(), (row[i] ?? "").trim()]))
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // 1. Fetch
  const data = await fetchSheetRows();

  // 2. Check required columns exist
  const missingCols = REQUIRED_COLUMNS.filter((c) => !(c in (data[0] ?? {})));
  if (missingCols.length) {
    throw new Error(`Sheet is missing required columns: ${missingCols.join(", ")}`);
  }

  console.log(`Fetched ${data.length} rows.`);

  // 3. Validate rows (warn but don't abort — bad rows still write through)
  const validationErrors = data.flatMap((row, i) => validateRow(row, i));
  if (validationErrors.length) {
    console.warn(`\n⚠️  Validation warnings (${validationErrors.length}):`);
    validationErrors.forEach((e) => console.warn("  •", e));
    console.warn("");
  }

  // 4. Clean
  const publications = data.map((row) => ({
    title:   row.title,
    date:    row.date,
    journal: row.journal,
    url:     stripTrackingParams(row.url),
  }));

  // 5. Serialize to YAML
  const yamlOut = [
    "# content/publications.yaml",
    "# Auto-generated by scripts/sync-publications.js — do not edit manually.",
    `# Last synced: ${new Date().toISOString()}`,
    "#",
    yaml.dump(publications, { lineWidth: 120, quotingType: '"' }),
  ].join("\n");

  // 6. Write
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, yamlOut, "utf8");

  console.log(`✓ Written ${publications.length} publications to ${OUT_PATH}`);

  // Exit code 2 = data written but validation warnings present
  // CI will still open a PR but mark the job as failed
  if (validationErrors.length) process.exit(2);
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});