import { getSourceLocation, normalizePath } from "@typespec/compiler";
import { relative } from "path";
import pc from "picocolors";
import prettier from "prettier";
import type { SurfaceDetails, SurfaceDoc, SurfaceSubject } from "../lib/decorators.js";
import { buildSurfaceDetails } from "../lib/decorators.js";
import { logger } from "../logger.js";
import { findScenarioSpecFiles } from "../scenarios-resolver.js";
import { importSpecExpect, importTypeSpec } from "../spec-utils/index.js";
import { createDiagnosticReporter, Diagnostic, getSourceLocationStr } from "../utils/index.js";
import { getCommit, getPackageJson } from "../utils/misc-utils.js";

/** One language-neutral entry of the surface-checks doc — what to check, for every emitter. */
export interface SurfaceCheckItem {
  /**
   * Stable id, `<scenario>_<category>` (with a `_n` suffix to disambiguate
   * several same-category checks on one scenario), e.g. `listWithPageSize_paging`.
   */
  id: string;
  /** The enclosing `@scenario` name this surface check belongs to. */
  scenario: string | undefined;
  /** The kind of surface assertion (routes the check to a verifier). */
  category: string;
  /** The subject symbol's own name, matched against the generated code. */
  target: string;
  /**
   * Language scope, e.g. `python` or `!java`. Set only for verbatim per-language
   * checks (from a `scope → value` dict); empty means all languages (recast).
   */
  scope?: string;
  /** Language-agnostic description of the expected surface. */
  doc: string;
  /** Where the `@surfaceDoc` lives in the spec. */
  location: SurfaceCheckLocation;
  /** Generic detail fields (`expected`, `kind`, `origin`); absent for prose-only checks. */
  details?: SurfaceDetails;
}

export interface SurfaceCheckLocation {
  path: string;
  start: { line: number; character: number };
  end: { line: number; character: number };
}

export interface SurfaceChecksManifest {
  version: string;
  commit: string;
  items: SurfaceCheckItem[];
}

export async function computeSurfaceChecksManifest(
  scenariosPath: string,
): Promise<[SurfaceChecksManifest | undefined, readonly Diagnostic[]]> {
  const [surfaceDocs, diagnostics] = await loadSurfaceDocs(scenariosPath);
  if (diagnostics.length > 0) {
    return [undefined, diagnostics];
  }

  const commit = getCommit(scenariosPath);
  const pkg = await getPackageJson(scenariosPath);
  return [createSurfaceChecksManifest(scenariosPath, pkg?.version, commit, surfaceDocs), []];
}

export function createSurfaceChecksManifest(
  scenariosPath: string,
  version: string | undefined,
  commit: string,
  surfaceDocs: SurfaceDoc[],
): SurfaceChecksManifest {
  const items: SurfaceCheckItem[] = [];
  const usedIds = new Map<string, number>();
  for (const surfaceDoc of surfaceDocs) {
    const location = getCheckLocation(scenariosPath, surfaceDoc.subject);
    const target = getSubjectName(surfaceDoc.subject);
    const details = buildSurfaceDetails(surfaceDoc);
    const scopeSuffix = surfaceDoc.scope ? `_${surfaceDoc.scope.replace(/[^\w]+/g, "-")}` : "";
    // Every check is identified by its resolved scenario name, so all checks on
    // one surface scenario share a stable prefix; `uniqueId` disambiguates when
    // a scenario carries several checks of the same category.
    const idBase = surfaceDoc.scenario ?? target;
    items.push({
      id: uniqueId(usedIds, `${idBase}_${surfaceDoc.category}${scopeSuffix}`),
      scenario: surfaceDoc.scenario,
      category: surfaceDoc.category,
      target,
      ...(surfaceDoc.scope ? { scope: surfaceDoc.scope } : {}),
      doc: surfaceDoc.doc,
      location,
      ...(Object.keys(details).length > 0 ? { details } : {}),
    });
  }
  items.sort((a, b) => a.id.localeCompare(b.id));
  return { version: version ?? "?", commit, items };
}

/**
 * Render a {@link SurfaceChecksManifest} as a single Markdown document that is
 * both human-readable and machine-readable: the table below is the source of
 * truth consumed by the shared `verify-surface-checks` runner, and is also easy
 * to read in review. The
 * `details` column encodes category-specific expectations as `key=value` pairs
 * separated by `; ` (booleans as `true`/`false`).
 */
export function createSurfaceChecksSummary(manifest: SurfaceChecksManifest): Promise<string> {
  const lines = [
    `# Surface checks`,
    ``,
    `Generated from \`@surfaceDoc\` annotations. This table is both the human summary`,
    `and the machine-readable checks doc parsed by the shared \`verify-surface-checks\` runner.`,
    ``,
    `| id | scenario | category | target | scope | details | doc |`,
    `| --- | --- | --- | --- | --- | --- | --- |`,
  ];
  for (const item of manifest.items) {
    const cells = [
      item.id,
      item.scenario ?? "",
      item.category,
      item.target,
      item.scope ?? "",
      renderDetails(item.details),
      escapeCell(item.doc),
    ];
    lines.push(`| ${cells.join(" | ")} |`);
  }
  return prettier.format(lines.join("\n"), { parser: "markdown" });
}

/** Encode `details` as `key=value; key=value` for the Markdown table cell. */
function renderDetails(details: SurfaceDetails | undefined): string {
  if (!details) {
    return "";
  }
  return escapeCell(
    Object.entries(details)
      .map(([k, v]) => `${k}=${v}`)
      .join("; "),
  );
}

/** Escape characters that would break a Markdown table cell. */
function escapeCell(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function uniqueId(used: Map<string, number>, base: string): string {
  const count = used.get(base) ?? 0;
  used.set(base, count + 1);
  return count === 0 ? base : `${base}_${count + 1}`;
}

function getSubjectName(subject: SurfaceSubject): string {
  return typeof subject.name === "string" ? subject.name : "";
}

function getCheckLocation(scenariosPath: string, subject: SurfaceSubject): SurfaceCheckLocation {
  const tspLocation = getSourceLocation(subject);
  return {
    path: normalizePath(relative(scenariosPath, tspLocation.file.path)),
    start: tspLocation.file.getLineAndCharacterOfPosition(tspLocation.pos),
    end: tspLocation.file.getLineAndCharacterOfPosition(tspLocation.end),
  };
}

export async function loadSurfaceDocs(
  scenariosPath: string,
): Promise<[SurfaceDoc[], readonly Diagnostic[]]> {
  const scenarioFiles = await findScenarioSpecFiles(scenariosPath);
  const typespecCompiler = await importTypeSpec(scenariosPath);
  const specExpect = await importSpecExpect(scenariosPath);
  const diagnostics = createDiagnosticReporter();

  const surfaceDocs: SurfaceDoc[] = [];
  for (const { name, specFilePath } of scenarioFiles) {
    logger.debug(`Collecting surface docs from "${specFilePath}"`);
    const program = await typespecCompiler.compile(typespecCompiler.NodeHost, specFilePath, {
      additionalImports: ["@typespec/spector"],
      noEmit: true,
      warningAsError: true,
    });

    const programDiagnostics = program.diagnostics.filter(
      (d) =>
        !(
          d.code === "@azure-tools/typespec-azure-core/casing-style" &&
          typeof d.target === "object" &&
          "kind" in d.target &&
          d.target.kind === "Namespace" &&
          d.target.name === "DPG"
        ),
    );

    if (programDiagnostics.length > 0) {
      for (const item of programDiagnostics) {
        const sourceLocation = typespecCompiler.getSourceLocation(item.target);
        diagnostics.reportDiagnostic({
          message: `${item.message}: ${sourceLocation && getSourceLocationStr(sourceLocation)}`,
        });
      }
      diagnostics.reportDiagnostic({
        message: `${pc.red("✘")} Scenario ${name} is invalid.`,
      });
      continue;
    }

    // `@surfaceDoc` must sit on an element that also carries `@scenarioDoc`, so
    // every surface check is grounded in a documented scenario. Enforced here
    // (not via a compiler `$onValidate` hook) so plain spec compilation does not
    // trigger spector's other, currently-dormant scenario validations.
    const missingScenarioDoc = specExpect.listSurfaceDocsMissingScenarioDoc(program);
    if (missingScenarioDoc.length > 0) {
      for (const target of missingScenarioDoc) {
        const sourceLocation = typespecCompiler.getSourceLocation(target);
        diagnostics.reportDiagnostic({
          message: `@surfaceDoc may only be applied to an element that also has @scenarioDoc, so every surface check is grounded in a documented scenario.: ${sourceLocation && getSourceLocationStr(sourceLocation)}`,
        });
      }
      diagnostics.reportDiagnostic({
        message: `${pc.red("✘")} Scenario ${name} is invalid.`,
      });
      continue;
    }

    surfaceDocs.push(...specExpect.listSurfaceDocs(program));
  }

  return [surfaceDocs, diagnostics.diagnostics];
}
