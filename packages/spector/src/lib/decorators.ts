import {
  $service,
  Enum,
  getAutoDecoratorTargets,
  getAutoDecoratorValue,
  getNamespaceFullName,
  getTypeName,
  Interface,
  listServices,
  Model,
  Namespace,
  Operation,
  Program,
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
} from "../../generated-defs/TypeSpec.Spector.js";
import { SpectorStateKeys } from "./lib.js";

export const $scenario: ScenarioDecorator = (context, target, name?) => {
  context.program.stateMap(SpectorStateKeys.Scenario).set(target, name ?? target.name);
};

export const $scenarioDoc: ScenarioDocDecorator = (context, target, doc, formatArgs?) => {
  const formattedDoc = formatArgs ? replaceTemplatedStringFromProperties(doc, formatArgs) : doc;
  context.program.stateMap(SpectorStateKeys.ScenarioDoc).set(target, formattedDoc);
};

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
 * `loadSurfaceDocs` while the manifest is built), so the union matches
 * `@scenarioDoc`'s target.
 */
export type SurfaceDocTarget = Namespace | Interface | Operation;

/**
 * The generic, category-agnostic fields the shared runner substitutes into an
 * emitter's `verifiers.json` (as `{expected}`, `{kind}`, `{origin}`). They are
 * derived the same way for every category, so a new category needs no core
 * change — only a `verifiers.json` entry (or the AI fallback).
 */
export interface SurfaceDetails {
  /** The author's `expected` client-surface output for this check. */
  expected?: string;
}

/** A resolved `@surfaceDoc` annotation. */
export interface SurfaceDoc {
  /**
   * The resolved name of the enclosing `@scenario` this check belongs to (named
   * the way `@scenario`s are, e.g. `Payload_Pageable_PageSize_listWithPageSize`).
   * Every surface check is grounded in — and identified by — its scenario, so
   * multiple checks on one scenario share this name. `undefined` only if the
   * annotated element has no enclosing `@scenario` (which `loadSurfaceDocs`
   * rejects, since `@surfaceDoc` requires `@scenarioDoc`).
   */
  scenario: string | undefined;
  /** The annotated element (a scenario namespace/interface/operation). */
  target: SurfaceDocTarget;
  /** The subject of the check — defaults to the target's name when omitted. */
  subject: string;
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
function synthesizeDoc(category: string, subject: string, expected: string): string {
  return `${category}: ${subject} → ${expected}`;
}

/**
 * Build a scenario-style name by walking up an element's containers and joining
 * their names, stopping at the (unnamed) global or the `_Specs_` root — the same
 * convention `@scenario` uses.
 */
function getEnclosingScenarioName(program: Program, target: SurfaceDocTarget): string | undefined {
  let current: SurfaceDocTarget | Namespace | Interface | undefined = target;
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
    if (current.kind === "Namespace" || current.kind === "Interface") {
      current = current.namespace;
    } else if (current.kind === "Operation") {
      current = current.interface ?? current.namespace;
    } else {
      break;
    }
  }
  return undefined;
}

/** The FQN used by the auto dec for `@surfaceDoc`. */
const SURFACE_DOC_FQN = "TypeSpec.Spector.surfaceDoc";

/**
 * What the auto dec stores for `@surfaceDoc`. Single valueof model param `check`:
 * `{ check: { category, expected, subject?, doc? } }`.
 */
interface StoredSurfaceDoc {
  check: {
    category: string;
    expected: string | Record<string, string>;
    subject?: string;
    doc?: string;
  };
}

/**
 * Collect every `@surfaceDoc` in the program into a list of language-agnostic
 * surface docs. Analogous to {@link listScenarios}, but for the generated
 * surface instead of the wire. Each entry records the author-supplied category,
 * subject, and expected output verbatim — nothing is inferred from other
 * decorators. Feeds the `surface-checks.md` checks doc.
 */
export function listSurfaceDocs(program: Program): SurfaceDoc[] {
  const targets = getAutoDecoratorTargets(program, SURFACE_DOC_FQN);
  const result: SurfaceDoc[] = [];
  for (const [target] of targets) {
    const stored = getAutoDecoratorValue(program, SURFACE_DOC_FQN, target) as
      StoredSurfaceDoc | undefined;
    if (!stored) continue;
    const docTarget = target as SurfaceDocTarget;
    const scenario = getEnclosingScenarioName(program, docTarget);
    const { category, expected, subject, doc } = stored.check;
    const resolvedSubject = subject ?? docTarget.name ?? "";
    for (const { expected: exp, scope } of expandExpected(expected)) {
      result.push({
        scenario,
        target: docTarget,
        subject: resolvedSubject,
        category,
        expected: exp,
        scope,
        doc: doc ?? synthesizeDoc(category, resolvedSubject, exp),
      });
    }
  }
  return result.sort(
    (a, b) =>
      (a.scenario ?? "").localeCompare(b.scenario ?? "") ||
      a.category.localeCompare(b.category) ||
      (a.scope ?? "").localeCompare(b.scope ?? ""),
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
  const targets = getAutoDecoratorTargets(program, SURFACE_DOC_FQN);
  const result: SurfaceDocTarget[] = [];
  for (const [target] of targets) {
    const docTarget = target as SurfaceDocTarget;
    if (getScenarioDoc(program, docTarget) === undefined) {
      result.push(docTarget);
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
  return details;
}
