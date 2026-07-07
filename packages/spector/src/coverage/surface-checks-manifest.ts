import { getSourceLocation, normalizePath } from "@typespec/compiler";
import { relative } from "path";
import pc from "picocolors";
import type { SurfaceCheck, SurfaceDoc, SurfaceDocTarget } from "../lib/decorators.js";
import { UNSPECIFIED_CATEGORY } from "../lib/decorators.js";
import { logger } from "../logger.js";
import { findScenarioSpecFiles } from "../scenarios-resolver.js";
import { importSpecExpect, importTypeSpec } from "../spec-utils/index.js";
import {
  createDiagnosticReporter,
  Diagnostic,
  getSourceLocationStr,
} from "../utils/index.js";
import { getCommit, getPackageJson } from "../utils/misc-utils.js";

/** One language-neutral entry of `surface-checks.json` — what to check, for every emitter. */
export interface SurfaceCheckItem {
  /** Stable id, e.g. `Type_Model_Enum_Extensible_naming`. */
  id: string;
  /** The enclosing `@scenario` name this surface check belongs to. */
  scenario: string | undefined;
  /** The kind of surface assertion (routes the check to a verifier). */
  category: string;
  /** The annotated symbol's own name, matched against the generated code. */
  target: string;
  /** Language-agnostic description of the expected surface. */
  doc: string;
  /** Where the `@surfaceDoc` lives in the spec. */
  location: SurfaceCheckLocation;
  /** Expected client-facing identifier (`naming` / `exactName`). */
  expected?: string;
  /** Symbol kind for casing-aware `naming` checks. */
  kind?: string;
  /** Expected base type on the client surface (`hierarchy`). */
  expected_base?: string;
  /** Client the operation should be surfaced on (`client-location`). */
  expected_client?: string;
  /** Client the operation should be absent from (`client-location`). */
  absent_from?: string;
  /** Whether the target should be hidden from the public surface (`access`). */
  internal?: boolean;
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
  for (const surfaceDoc of surfaceDocs) {
    const location = getCheckLocation(scenariosPath, surfaceDoc.target);
    const target = getTargetName(surfaceDoc.target);
    const usedIds = new Map<string, number>();
    if (surfaceDoc.checks.length === 0) {
      // Prose with no recognized client decorator: one AI-verified check.
      items.push({
        id: uniqueId(usedIds, `${surfaceDoc.name}_${UNSPECIFIED_CATEGORY}`),
        scenario: surfaceDoc.scenario,
        category: UNSPECIFIED_CATEGORY,
        target,
        doc: surfaceDoc.doc,
        location,
      });
      continue;
    }
    for (const check of surfaceDoc.checks) {
      const id = uniqueId(usedIds, `${surfaceDoc.name}_${check.category}`);
      items.push({
        id,
        scenario: surfaceDoc.scenario,
        category: check.category,
        target,
        doc: surfaceDoc.doc,
        location,
        ...renderCheckFields(check),
      });
    }
  }
  items.sort((a, b) => a.id.localeCompare(b.id));
  return { version: version ?? "?", commit, items };
}

function renderCheckFields(check: SurfaceCheck): Partial<SurfaceCheckItem> {
  const fields: Partial<SurfaceCheckItem> = {};
  if (check.expected !== undefined) fields.expected = check.expected;
  if (check.kind !== undefined) fields.kind = check.kind;
  if (check.expectedBase !== undefined) fields.expected_base = check.expectedBase;
  if (check.expectedClient !== undefined) fields.expected_client = check.expectedClient;
  if (check.absentFrom !== undefined) fields.absent_from = check.absentFrom;
  if (check.internal !== undefined) fields.internal = check.internal;
  return fields;
}

function uniqueId(used: Map<string, number>, base: string): string {
  const count = used.get(base) ?? 0;
  used.set(base, count + 1);
  return count === 0 ? base : `${base}_${count + 1}`;
}

function getTargetName(target: SurfaceDocTarget): string {
  return typeof target.name === "string" ? target.name : "";
}

function getCheckLocation(scenariosPath: string, target: SurfaceDocTarget): SurfaceCheckLocation {
  const tspLocation = getSourceLocation(target);
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

    surfaceDocs.push(...specExpect.listSurfaceDocs(program));
  }

  return [surfaceDocs, diagnostics.diagnostics];
}
