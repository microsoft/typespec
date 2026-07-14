import { glob, readFile, readdir } from "fs/promises";
import { join } from "path";

/**
 * Shared, language-agnostic runner for client-surface checks.
 *
 * The wire-format Spector tests can't observe surface properties (naming,
 * visibility, shape, hierarchy). `@surfaceDoc` describes them once in the spec;
 * `generate-surface-checks` precomputes a checks doc; each emitter authors a
 * **declarative** `verifiers.json` that tells this engine, per category, which
 * files to look in and what pattern proves the surface is correct. Nothing here
 * is language-specific: Python/Java/C#/... all share this engine and differ only
 * in their `verifiers.json` (globs + regex templates + casing) and generated-root.
 *
 * A category may instead defer to an existing emitter test
 * (`{ "test": "…" }`) — reported `deferred`/`test`, no pattern and no AI. A
 * category with no verifier at all is left for the AI orchestrator (`needs_ai`).
 */

// ---------------------------------------------------------------------------
// Checks doc
// ---------------------------------------------------------------------------

export interface CheckItem {
  id: string;
  scenario?: string;
  category: string;
  target: string;
  /**
   * Language scope, e.g. `python` or `!java`. Set only for verbatim per-language
   * checks; empty means all languages (idiomatic recast).
   */
  scope?: string;
  details: Record<string, string | boolean>;
  doc: string;
  /** Optional per-language resolved names, e.g. `{ "python": "…" }`. */
  client_names?: Record<string, string>;
}

/** Parse the checks doc — a Markdown table (the shipped format) or JSON. */
export function parseChecksDoc(text: string): CheckItem[] {
  const trimmed = text.trimStart();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    const data = JSON.parse(text);
    return Array.isArray(data) ? data : data.items;
  }
  const rows: CheckItem[] = [];
  let headerSeen = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line.startsWith("|")) continue;
    const cells = line
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split(/(?<!\\)\|/)
      .map((c) => c.trim().replace(/\\\|/g, "|"));
    if (!headerSeen) {
      if (cells[0] === "id") headerSeen = true;
      continue;
    }
    if (cells.every((c) => /^[- ]*$/.test(c))) continue; // separator row
    if (cells.length < 7) continue;
    const [id, scenario, category, target, scope, details, doc] = cells;
    rows.push({
      id,
      scenario: scenario || undefined,
      category,
      target,
      scope: scope || undefined,
      details: parseDetails(details),
      doc,
    });
  }
  return rows;
}

/** `key=value; key=value` → object; `true`/`false` become booleans. */
function parseDetails(cell: string): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (const pair of cell.split(";")) {
    const p = pair.trim();
    if (!p || !p.includes("=")) continue;
    const i = p.indexOf("=");
    const k = p.slice(0, i).trim();
    const v = p
      .slice(i + 1)
      .trim()
      .replace(/\\\|/g, "|");
    out[k] = v === "true" ? true : v === "false" ? false : v;
  }
  return out;
}

/**
 * Decide whether a scoped check applies to the active language, using the same
 * scope grammar as the client-generator decorators: comma-separated language
 * names, `!name` to exclude, and `!(a,b)` to exclude a group. An empty/undefined
 * scope applies to every language.
 */
export function scopeApplies(scope: string | undefined, language: string): boolean {
  const s = scope?.trim();
  if (!s) return true;
  const group = s.match(/^!\((.*)\)$/);
  if (group) {
    const excluded = group[1].split(",").map((x) => x.trim());
    return !excluded.includes(language);
  }
  const positives: string[] = [];
  const negatives: string[] = [];
  for (const part of s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)) {
    if (part.startsWith("!")) {
      negatives.push(part.slice(1).trim());
    } else {
      positives.push(part);
    }
  }
  if (positives.length > 0) return positives.includes(language);
  if (negatives.length > 0) return !negatives.includes(language);
  return true;
}

type Expect =
  | "present"
  | "absent"
  | { absentWhen: string }
  | { whenExpected: Record<string, "present" | "absent"> };

/** A pattern rule: search `files` for `find`; PASS per `expect`. */
export interface Rule {
  /** Glob(s) relative to the package dir. Default `**\/*`. */
  files?: string | string[];
  /** Optional regex template isolating blocks (e.g. a class body); `find` runs within each. */
  scope?: string;
  /** Regex template with `{var[:casing]}` placeholders. */
  find: string;
  /** `present` (default), `absent`, `{ absentWhen: <detail key> }`, or `{ whenExpected: { <value>: present|absent } }`. */
  expect?: Expect;
  /** Per-kind casing map for the `{name:byKind}` modifier. */
  casing?: Record<string, string>;
  /** A second rule AND-ed with this one (e.g. present here AND absent there). */
  also?: Rule;
}

/** Defer to an existing emitter test that already asserts this surface. */
export interface TestVerifier {
  test: string;
  note?: string;
}

/**
 * Declare a whole category not-applicable for this language — the surface concept
 * has no equivalent in the emitter's output (e.g. a language with no method
 * overloading). Mirrors how wire scenarios are marked N/A via
 * `unsupportedScenarios`: emitter-owned, no pattern, no AI. Every check in the
 * category resolves to `not-applicable`.
 */
export interface NaVerifier {
  na: true;
  note?: string;
}

export type Verifier = Rule | TestVerifier | NaVerifier;

function isTestVerifier(v: Verifier): v is TestVerifier {
  return "test" in v && !!v.test && !("find" in v);
}

function isNaVerifier(v: Verifier): v is NaVerifier {
  return "na" in v && v.na === true;
}

// ---------------------------------------------------------------------------
// Casing (language-idiomatic recasing, driven by verifiers.json)
// ---------------------------------------------------------------------------

function splitWords(name: string): string[] {
  let s = name.replace(/[_\-\s]+/g, " ");
  s = s.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  s = s.replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
  return s.split(/\s+/).filter(Boolean);
}

function applyCasing(name: string, casing: string): string {
  const w = splitWords(name);
  const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1).toLowerCase();
  switch (casing) {
    case "pascal":
      return w.map(cap).join("");
    case "camel":
      return w.length ? w[0].toLowerCase() + w.slice(1).map(cap).join("") : name;
    case "snake":
      return w.map((x) => x.toLowerCase()).join("_");
    case "upper_snake":
      return w.map((x) => x.toUpperCase()).join("_");
    default:
      return name;
  }
}

// ---------------------------------------------------------------------------
// Template + rule engine
// ---------------------------------------------------------------------------

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Resolve a `{var[:casing]}` placeholder to a concrete value.
 * `target` → item.target; `name` → resolved client name; anything else → a
 * `details` field. `:byKind` looks up the casing map at `details.kind`.
 */
function resolveVar(
  name: string,
  mod: string | undefined,
  item: CheckItem,
  language: string,
  casingMap: Record<string, string> | undefined,
): string | undefined {
  let val: string | undefined;
  if (name === "target") {
    val = item.target;
  } else if (name === "name") {
    val = item.client_names?.[language] ?? (item.details?.name as string | undefined);
  } else {
    const d = item.details?.[name];
    val = d == null ? undefined : String(d);
  }
  if (val == null) return undefined;
  // A scoped check carries a verbatim per-language value — never recase it.
  if (mod && !item.scope) {
    const casing = mod === "byKind" ? casingMap?.[String(item.details?.kind)] : mod;
    if (!casing) return undefined; // no casing rule for this kind → N/A
    val = applyCasing(val, casing);
  }
  return val;
}

/** Compile a regex template; returns null if any placeholder is unresolvable (N/A). */
function buildRegex(
  template: string,
  item: CheckItem,
  language: string,
  casingMap: Record<string, string> | undefined,
): RegExp | null {
  let missing = false;
  const source = template.replace(/\{(\w+)(?::(\w+))?\}/g, (_m, v: string, mod?: string) => {
    const resolved = resolveVar(v, mod, item, language, casingMap);
    if (resolved == null) {
      missing = true;
      return "";
    }
    return escapeRegExp(resolved);
  });
  return missing ? null : new RegExp(source);
}

async function readGlobbed(pkgDir: string, files: string | string[] | undefined): Promise<string> {
  const globs = Array.isArray(files) ? files : [files ?? "**/*"];
  const seen = new Set<string>();
  for (const g of globs) {
    for await (const f of glob(g, { cwd: pkgDir })) seen.add(f as string);
  }
  const texts: string[] = [];
  for (const rel of [...seen].sort()) {
    try {
      texts.push(await readFile(join(pkgDir, rel), "utf8"));
    } catch {
      // directories / unreadable entries are skipped
    }
  }
  return texts.join("\n");
}

function resolveExpect(expect: Expect | undefined, item: CheckItem): "present" | "absent" {
  if (!expect) return "present";
  if (typeof expect === "string") return expect;
  if ("whenExpected" in expect) {
    return expect.whenExpected[String(item.details?.expected)] ?? "present";
  }
  return item.details?.[expect.absentWhen] ? "absent" : "present";
}

interface RuleOutcome {
  status: "pass" | "fail";
  evidence: string;
}

/** Run one pattern rule. Returns null when it doesn't apply (missing placeholder → N/A). */
async function runRule(
  rule: Rule,
  item: CheckItem,
  pkgDir: string,
  language: string,
): Promise<RuleOutcome | null> {
  const findRe = buildRegex(rule.find, item, language, rule.casing);
  if (findRe === null) return null;

  const text = await readGlobbed(pkgDir, rule.files);
  let haystacks: string[] = [text];
  if (rule.scope) {
    const scopeRe = buildRegex(rule.scope, item, language, rule.casing);
    if (scopeRe === null) return null;
    haystacks = [...text.matchAll(new RegExp(scopeRe.source, "g"))].map((m) => m[0]);
  }

  const found = haystacks.some((h) => findRe.test(h));
  const expect = resolveExpect(rule.expect, item);
  const ok = expect === "present" ? found : !found;
  const evidence =
    `/${findRe.source}/ ${found ? "found" : "not found"}` +
    (rule.scope ? " in scope" : "") +
    ` (wanted ${expect})`;
  return { status: ok ? "pass" : "fail", evidence };
}

export interface VerifyResult {
  id: string;
  category: string;
  status: string;
  evidence: string;
  how: string;
}

async function evalVerifier(
  v: Verifier,
  item: CheckItem,
  pkgDir: string,
  language: string,
): Promise<{ status: string; evidence: string; how: string }> {
  const primary = await runRule(v as Rule, item, pkgDir, language);
  if (primary === null) {
    return {
      status: "na",
      how: "deterministic",
      evidence: `no applicable rule (missing detail) for '${item.category}'`,
    };
  }
  let { status, evidence } = primary;
  const also = (v as Rule).also;
  if (also) {
    const second = await runRule(also, item, pkgDir, language);
    if (second) {
      if (second.status === "fail") status = "fail";
      evidence += ` | also: ${second.evidence}`;
    }
  }
  return { status, evidence, how: "deterministic" };
}

// ---------------------------------------------------------------------------
// Package resolution + orchestration
// ---------------------------------------------------------------------------

/** Find the generated package dir under <root>/<flavor> whose name contains the scenario. */
async function findPackage(
  root: string,
  flavor: string,
  scenario: string,
): Promise<string | undefined> {
  const base = join(root, flavor);
  let entries;
  try {
    entries = await readdir(base, { withFileTypes: true });
  } catch {
    return undefined;
  }
  const hit = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort()
    .find((n) => scenario && n.toLowerCase().includes(scenario.toLowerCase()));
  return hit ? join(base, hit) : undefined;
}

export interface VerifySurfaceChecksConfig {
  checksPath: string;
  verifiersPath: string;
  generatedRoot: string;
  flavor: string;
  language: string;
  /** Optional case-insensitive substring filter on the check id. */
  scenario?: string;
}

export interface VerifySurfaceChecksOutput {
  results: VerifyResult[];
  needs_ai: Array<{
    id: string;
    category: string;
    target: string;
    doc: string;
    details: Record<string, string | boolean>;
  }>;
}

/**
 * Run every check whose category has a verifier (in parallel, no AI) and collect
 * the residual (no verifier) into `needs_ai` for the orchestrator.
 */
export async function verifySurfaceChecks(
  config: VerifySurfaceChecksConfig,
): Promise<VerifySurfaceChecksOutput> {
  const { checksPath, verifiersPath, generatedRoot, flavor, language, scenario } = config;
  const items = parseChecksDoc(await readFile(checksPath, "utf8")).filter(
    (it) =>
      (!scenario || it.id.toLowerCase().includes(scenario.toLowerCase())) &&
      scopeApplies(it.scope, language),
  );
  const rawVerifiers = JSON.parse(await readFile(verifiersPath, "utf8")) as Record<string, unknown>;
  const verifiers: Record<string, Verifier> = {};
  for (const [k, val] of Object.entries(rawVerifiers)) {
    if (!k.startsWith("_")) verifiers[k] = val as Verifier;
  }

  const results: VerifyResult[] = [];
  const needsAi: VerifySurfaceChecksOutput["needs_ai"] = [];

  await Promise.all(
    items.map(async (item) => {
      const v = verifiers[item.category];
      if (!v) {
        needsAi.push({
          id: item.id,
          category: item.category,
          target: item.target,
          doc: item.doc,
          details: item.details,
        });
        return;
      }
      // Emitter-declared not-applicable: the concept has no surface in this
      // language. Mirrors wire `unsupportedScenarios`; no package or pattern.
      if (isNaVerifier(v)) {
        const note = v.note ? ` — ${v.note}` : "";
        results.push({
          id: item.id,
          category: item.category,
          status: "not-applicable",
          how: "not-applicable",
          evidence: `category '${item.category}' not applicable for ${language}${note}`,
        });
        return;
      }
      // Defer to an existing test: no package or pattern needed.
      if (isTestVerifier(v)) {
        const note = v.note ? ` — ${v.note}` : "";
        results.push({
          id: item.id,
          category: item.category,
          status: "deferred",
          how: "test",
          evidence: `covered by existing test: ${v.test}${note}`,
        });
        return;
      }
      const pkg = await findPackage(generatedRoot, flavor, item.scenario ?? "");
      if (!pkg) {
        results.push({
          id: item.id,
          category: item.category,
          status: "error",
          how: "deterministic",
          evidence: `package for scenario '${item.scenario}' not found`,
        });
        return;
      }
      try {
        const r = await evalVerifier(v, item, pkg, language);
        results.push({ id: item.id, category: item.category, ...r });
      } catch (e) {
        results.push({
          id: item.id,
          category: item.category,
          status: "error",
          how: "deterministic",
          evidence: `${(e as Error).name}: ${(e as Error).message}`,
        });
      }
    }),
  );

  results.sort((a, b) => a.id.localeCompare(b.id));
  needsAi.sort((a, b) => a.id.localeCompare(b.id));
  return { results, needs_ai: needsAi };
}
