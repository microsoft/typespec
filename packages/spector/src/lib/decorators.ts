import {
  $service,
  Enum,
  EnumMember,
  getNamespaceFullName,
  getTypeName,
  Interface,
  listServices,
  Model,
  ModelProperty,
  Namespace,
  Operation,
  Program,
  Union,
  UnionVariant,
} from "@typespec/compiler";
import {
  $route,
  $server,
  getOperationVerb,
  getRoutePath,
  getServers,
  HttpVerb,
} from "@typespec/http";
import { $versioned } from "@typespec/versioning";
import {
  ScenarioDecorator,
  ScenarioDocDecorator,
  ScenarioServiceDecorator,
  SurfaceDocDecorator,
} from "../../generated-defs/TypeSpec.Spector.js";
import { SpectorStateKeys } from "./lib.js";

export const $scenario: ScenarioDecorator = (context, target, name?) => {
  context.program.stateMap(SpectorStateKeys.Scenario).set(target, name ?? target.name);
};

export const $scenarioDoc: ScenarioDocDecorator = (context, target, doc, formatArgs?) => {
  const formattedDoc = formatArgs ? replaceTemplatedStringFromProperties(doc, formatArgs) : doc;
  context.program.stateMap(SpectorStateKeys.ScenarioDoc).set(target, formattedDoc);
};

export const $surfaceDoc: SurfaceDocDecorator = (
  context,
  target,
  category,
  subject,
  expected,
  doc?,
) => {
  const map = context.program.stateMap(SpectorStateKeys.SurfaceDoc);
  const existing: StoredSurfaceDoc[] = map.get(target) ?? [];
  existing.push({
    category,
    subject: subject as SurfaceSubject,
    expected: expected as string | Record<string, string>,
    doc,
  });
  // A target can carry several `@surfaceDoc`s (different categories), so store a
  // list — never overwrite a previously recorded check.
  map.set(target, existing);
};

/**
 * What a single `@surfaceDoc` application records. `expected` is either one
 * canonical string (recast per language) or a `scope → value` dict (each value
 * matched verbatim for its scope).
 */
interface StoredSurfaceDoc {
  category: string;
  subject: SurfaceSubject;
  expected: string | Record<string, string>;
  doc?: string;
}

export const $scenarioService: ScenarioServiceDecorator = (context, target, route, options?) => {
  const properties = new Map().set("title", {
    type: { kind: "String", value: getNamespaceFullName(target).replace(/\./g, "") },
  });

  context.program.stateSet(SpectorStateKeys.ScenarioService).add(target);

  const versions = options ? (options as Model).properties.get("versioned")?.type : null;
  if (versions) {
    context.call($versioned, target, versions as Enum);
  }
  context.call($service, target, {
    kind: "Model",
    properties,
    decorators: [],
    name: "Service",
    derivedModels: [],
  } as any);
  context.call($server, target, "http://localhost:3000", "TestServer endpoint");
  context.call($route, target, route);
};

export function getScenarioDoc(
  program: Program,
  target: Operation | Interface | Namespace,
): string | undefined {
  return program.stateMap(SpectorStateKeys.ScenarioDoc).get(target);
}

function replaceTemplatedStringFromProperties(formatString: string, formatArgs: Model) {
  return formatString.replace(/{(\w+)}/g, (_, propName) => {
    const type = formatArgs.properties.get(propName)?.type;
    if (type === undefined) {
      return "";
    }
    return "value" in type ? String(type.value) : getTypeName(type);
  });
}

export interface Scenario {
  name: string;
  scenarioDoc: string;
  target: Operation | Interface | Namespace;
  endpoints: ScenarioEndpoint[];
}

export interface ScenarioEndpoint {
  verb: HttpVerb;
  path: string;
  target: Operation;
}

export function listScenarios(program: Program): Scenario[] {
  return listScenarioIn(program, program.getGlobalNamespaceType());
}

export function getScenarioEndpoints(
  program: Program,
  target: Namespace | Interface | Operation,
): ScenarioEndpoint[] {
  switch (target.kind) {
    case "Namespace":
      return [
        ...[...target.namespaces.values()].flatMap((x) => getScenarioEndpoints(program, x)),
        ...[...target.interfaces.values()].flatMap((x) => getScenarioEndpoints(program, x)),
        ...[...target.operations.values()].flatMap((x) => getScenarioEndpoints(program, x)),
      ];
    case "Interface":
      return [...target.operations.values()].flatMap((x) => getScenarioEndpoints(program, x));
    case "Operation":
      return [
        {
          verb: getOperationVerb(program, target) ?? "get",
          path: getOperationRoute(program, target),
          target,
        },
      ];
  }
}

function getRouteSegments(program: Program, target: Operation | Interface | Namespace): string[] {
  const route = getRoutePath(program, target)?.path;
  const seg = route ? [route] : [];
  switch (target.kind) {
    case "Namespace":
      return target.namespace ? [...getRouteSegments(program, target.namespace), ...seg] : seg;
    case "Interface":
      return target.namespace ? [...getRouteSegments(program, target.namespace), ...seg] : seg;

    case "Operation":
      return target.interface
        ? [...getRouteSegments(program, target.interface), ...seg]
        : target.namespace
          ? [...getRouteSegments(program, target.namespace), ...seg]
          : seg;
  }
}

function getOperationRoute(program: Program, target: Operation): string {
  const template = getRouteSegmentFromServer(program);
  const segments = getRouteSegments(program, target);
  return (
    (template
      ? template.endsWith("/") || segments.length === 0
        ? template
        : template + "/"
      : "/") + segments.map((x) => (x.startsWith("/") ? x.substring(1) : x)).join("/")
  );
}

function getRouteSegmentFromServer(program: Program): string | undefined {
  const serviceNs = listServices(program)[0]?.type;
  const server = getServers(program, serviceNs);
  if (server && server.length === 1) {
    if (server[0].url.indexOf("localhost:3000") > -1) {
      return server[0].url.split("localhost:3000")[1];
    } else if (server[0].url.indexOf("{endpoint}") > -1) {
      return server[0].url.split("{endpoint}")[1];
    } else {
      return server[0].url;
    }
  }
  return undefined;
}

export function listScenarioIn(
  program: Program,
  target: Namespace | Interface | Operation,
): Scenario[] {
  const scenarioName = getScenarioName(program, target);
  if (scenarioName) {
    return [
      {
        target,
        scenarioDoc: getScenarioDoc(program, target)!, /// `onValidate` validate against this happening
        name: scenarioName,
        endpoints: getScenarioEndpoints(program, target),
      },
    ];
  }
  switch (target.kind) {
    case "Namespace":
      return [
        ...[...target.namespaces.values()].flatMap((x) => listScenarioIn(program, x)),
        ...[...target.interfaces.values()].flatMap((x) => listScenarioIn(program, x)),
        ...[...target.operations.values()].flatMap((x) => listScenarioIn(program, x)),
      ];
    case "Interface":
      return [...target.operations.values()].flatMap((x) => listScenarioIn(program, x));
    case "Operation":
      return [];
  }
}

function resolveScenarioName(target: Operation | Interface | Namespace, name: string): string {
  const names = [name];

  let current: Operation | Interface | Namespace | undefined = target;
  while (true) {
    current =
      current.kind === "Operation" && current.interface ? current.interface : current.namespace;
    if (
      current === undefined ||
      (current.kind === "Namespace" && (current.name === "" || current.name === "_Specs_"))
    ) {
      break;
    }
    names.unshift(current.name);
  }
  return names.join("_");
}

export function isScenario(program: Program, target: Operation | Interface | Namespace): boolean {
  return program.stateMap(SpectorStateKeys.Scenario).has(target);
}

export function getScenarioName(
  program: Program,
  target: Operation | Interface | Namespace,
): string | undefined {
  const name = program.stateMap(SpectorStateKeys.Scenario).get(target);
  if (name === undefined) {
    return undefined;
  }
  return resolveScenarioName(target, name);
}

/**
 * The element `@surfaceDoc` is applied to. To keep surface checks grounded in a
 * real scenario, this must be a `@scenario`/`@scenarioDoc` element (enforced in
 * `$onValidate`), so the union matches `@scenarioDoc`'s target.
 */
export type SurfaceDocTarget = Namespace | Interface | Operation;

/**
 * The `subject` of a surface check — the type or member whose generated surface
 * is being asserted. May differ from the annotated {@link SurfaceDocTarget}
 * (e.g. a check on an operation asserts something about a model it returns).
 */
export type SurfaceSubject =
  | Namespace
  | Interface
  | Operation
  | Model
  | Enum
  | Union
  | ModelProperty
  | EnumMember
  | UnionVariant;

/**
 * The generic, category-agnostic fields the shared runner substitutes into an
 * emitter's `verifiers.json` (as `{expected}`, `{kind}`, `{origin}`). They are
 * derived the same way for every category, so a new category needs no core
 * change — only a `verifiers.json` entry (or the AI fallback).
 */
export interface SurfaceDetails {
  /** The author's `expected` client-surface output for this check. */
  expected?: string;
  /** The subject's language-agnostic symbol kind (for casing-aware checks). */
  kind?: string;
  /** The subject's declaring container (e.g. the client an operation moved from). */
  origin?: string;
}

/** A resolved `@surfaceDoc` annotation. */
export interface SurfaceDoc {
  /**
   * Scenario-style name resolved from the **subject**'s position in the spec
   * tree (e.g. `Type_Model_Enum_Extensible`), named the way `@scenario`s are.
   */
  name: string;
  /** The name of the enclosing `@scenario` the annotated element belongs to. */
  scenario: string | undefined;
  /** The annotated element (a scenario namespace/interface/operation). */
  target: SurfaceDocTarget;
  /** The type/member the check is about. */
  subject: SurfaceSubject;
  /** The kind of surface assertion (routes the check to a verifier). */
  category: string;
  /** The expected client-surface output for this category. */
  expected: string;
  /**
   * The language scope this check applies to, e.g. `"python"`, `"python,csharp"`,
   * or `"!java"`. Set only when `expected` came from a `scope → value` dict; in
   * that case the value is matched **verbatim**. Unset = all languages (recast).
   */
  scope?: string;
  /** Natural-language description (author-supplied, or synthesized for fallback). */
  doc: string;
}

/** A short prose fallback so the AI path always has something to verify against. */
function synthesizeDoc(category: string, subject: SurfaceSubject, expected: string): string {
  const subjectName = typeof subject.name === "string" ? subject.name : "the subject";
  return `${category}: ${subjectName} → ${expected}`;
}

function getSurfaceParent(target: SurfaceSubject): SurfaceSubject | undefined {
  switch (target.kind) {
    case "Namespace":
    case "Interface":
    case "Model":
    case "Enum":
    case "Union":
      return target.namespace;
    case "Operation":
      return target.interface ?? target.namespace;
    case "ModelProperty":
      return target.model;
    case "EnumMember":
      return target.enum;
    case "UnionVariant":
      return target.union;
    default:
      return undefined;
  }
}

/**
 * Build a scenario-style name for a surface subject by walking up its
 * containers and joining their names, stopping at the (unnamed) global or the
 * `_Specs_` root — the same convention `@scenario` uses.
 */
function resolveSurfaceName(target: SurfaceSubject): string {
  const names: string[] = [];
  let current: SurfaceSubject | undefined = target;
  while (current) {
    if (current.kind === "Namespace" && (current.name === "" || current.name === "_Specs_")) {
      break;
    }
    const name = typeof current.name === "string" ? current.name : undefined;
    if (name) {
      names.unshift(name);
    }
    current = getSurfaceParent(current);
  }
  return names.join("_");
}

function getEnclosingScenarioName(program: Program, target: SurfaceDocTarget): string | undefined {
  let current: SurfaceSubject | undefined = target;
  while (current) {
    if (
      current.kind === "Namespace" ||
      current.kind === "Interface" ||
      current.kind === "Operation"
    ) {
      const name = getScenarioName(program, current);
      if (name) {
        return name;
      }
    }
    current = getSurfaceParent(current);
  }
  return undefined;
}

/**
 * Collect every `@surfaceDoc` in the program into a list of language-agnostic
 * surface docs. Analogous to {@link listScenarios}, but for the generated
 * surface instead of the wire. Each entry records the author-supplied category,
 * subject, and expected output verbatim — nothing is inferred from other
 * decorators. Feeds the `surface-checks.md` checks doc.
 */
export function listSurfaceDocs(program: Program): SurfaceDoc[] {
  const map = program.stateMap(SpectorStateKeys.SurfaceDoc);
  const result: SurfaceDoc[] = [];
  for (const [target, storedList] of map as Map<SurfaceDocTarget, StoredSurfaceDoc[]>) {
    for (const stored of storedList) {
      const subjectName = resolveSurfaceName(stored.subject);
      const scenario = getEnclosingScenarioName(program, target);
      for (const { expected, scope } of expandExpected(stored.expected)) {
        result.push({
          name: subjectName,
          scenario,
          target,
          subject: stored.subject,
          category: stored.category,
          expected,
          scope,
          doc: stored.doc ?? synthesizeDoc(stored.category, stored.subject, expected),
        });
      }
    }
  }
  return result.sort(
    (a, b) => a.name.localeCompare(b.name) || (a.scope ?? "").localeCompare(b.scope ?? ""),
  );
}

/**
 * Surface docs whose annotated target does not also carry `@scenarioDoc`.
 *
 * `@surfaceDoc` must sit on an element that also has `@scenarioDoc` so every
 * surface check is grounded in a documented scenario. This is enforced while
 * the surface-checks manifest is built (see `loadSurfaceDocs`) rather than as a
 * compiler `$onValidate` hook, so it never activates spector's other,
 * currently-dormant scenario validations for consumers that only compile specs.
 */
export function listSurfaceDocsMissingScenarioDoc(program: Program): SurfaceDocTarget[] {
  const map = program.stateMap(SpectorStateKeys.SurfaceDoc);
  const result: SurfaceDocTarget[] = [];
  for (const target of map.keys() as Iterable<SurfaceDocTarget>) {
    if (getScenarioDoc(program, target) === undefined) {
      result.push(target);
    }
  }
  return result;
}

/**
 * Normalize an author's `expected` into one entry per check. A bare string is a
 * single, unscoped (idiomatically recast) check; a `scope → value` dict yields
 * one verbatim check per scope key.
 */
function expandExpected(
  expected: string | Record<string, string>,
): { expected: string; scope?: string }[] {
  if (typeof expected === "string") {
    return [{ expected }];
  }
  return Object.entries(expected).map(([scope, value]) => ({ expected: value, scope }));
}

/**
 * Build the generic, category-agnostic detail fields the shared runner
 * substitutes into `verifiers.json`. Derived the same way for every category so
 * a new category needs no core change: `expected` verbatim, plus the subject's
 * `kind` (for casing) and `origin` (its declaring container).
 */
export function buildSurfaceDetails(doc: SurfaceDoc): SurfaceDetails {
  const details: SurfaceDetails = {};
  if (doc.expected !== "") {
    details.expected = doc.expected;
  }
  const kind = getSurfaceKind(doc.subject);
  if (kind !== undefined) {
    details.kind = kind;
  }
  const origin = getDeclaringContainerName(doc.subject);
  if (origin !== undefined) {
    details.origin = origin;
  }
  return details;
}

/**
 * Map a surface subject to the language-agnostic symbol kind used by
 * casing-aware `naming` checks so each emitter can recast the expected
 * identifier into its idiomatic casing.
 */
function getSurfaceKind(target: SurfaceSubject): string | undefined {
  switch (target.kind) {
    case "Enum":
    case "Union":
      return "enum";
    case "EnumMember":
    case "UnionVariant":
      return "enumvalue";
    case "Model":
      return "model";
    case "ModelProperty":
      return "property";
    case "Operation":
      return "operation";
    case "Namespace":
    case "Interface":
      return "client";
    default:
      return undefined;
  }
}

/** The name of the client/group an element is declared in — its surface origin. */
function getDeclaringContainerName(target: SurfaceSubject): string | undefined {
  const parent = getSurfaceParent(target);
  return parent && typeof parent.name === "string" && parent.name ? parent.name : undefined;
}
