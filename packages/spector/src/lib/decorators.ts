import {
  $service,
  DecoratorApplication,
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
  Type,
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
  SurfaceCheckInfo,
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

export const $surfaceDoc: SurfaceDocDecorator = (context, target, doc, check?) => {
  context.program
    .stateMap(SpectorStateKeys.SurfaceDoc)
    .set(target, { doc, explicitCheck: check } satisfies StoredSurfaceDoc);
};

/** What `@surfaceDoc` records per target: the prose plus any explicit check. */
interface StoredSurfaceDoc {
  doc: string;
  explicitCheck?: SurfaceCheckInfo;
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
 * An element that can carry `@surfaceDoc`. Mirrors the decorator's target union
 * in `main.tsp`.
 */
export type SurfaceDocTarget =
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
 * A single language-agnostic, machine-checkable assertion about the generated
 * SDK surface, derived from a client decorator on a `@surfaceDoc` element.
 */
export interface SurfaceCheck {
  /** The kind of assertion, used to route the check to a verifier. */
  category: string;
  /** Category-specific expectation the verifier asserts. */
  details?: SurfaceDetails;
}

/**
 * The category-specific parameters a verifier asserts against the generated
 * surface. Which fields apply depends on the check's `category`.
 */
export interface SurfaceDetails {
  /** Expected client-facing identifier (`naming`). */
  name?: string;
  /** Symbol kind for casing-aware `naming` checks (e.g. `model`, `enum`). */
  kind?: string;
  /** Expected base type on the client surface (`hierarchy`). */
  base?: string;
  /** Client the operation should be surfaced on (`client-location`). */
  client?: string;
  /** Client the operation should be absent from (`client-location`). */
  absentFrom?: string;
  /** Whether the target should be hidden from the public surface (`access`). */
  internal?: boolean;
}

/** Category used when no known client decorator backs the prose — AI verifies it. */
export const UNSPECIFIED_CATEGORY = "unspecified";

/** A resolved `@surfaceDoc` annotation: its prose plus the checks derived from decorators. */
export interface SurfaceDoc {
  /**
   * Scenario-style name resolved from the element's position in the spec tree
   * (e.g. `Type_Model_Enum_Extensible`), named the same way `@scenario`s are.
   */
  name: string;
  /** The name of the enclosing `@scenario`, if the element lives inside one. */
  scenario: string | undefined;
  /** The annotated element. */
  target: SurfaceDocTarget;
  /** The natural-language description the author wrote. */
  doc: string;
  /**
   * Machine-checkable checks derived from the element's client decorators. May
   * be empty, in which case the prose is verified against the surface by AI.
   */
  checks: SurfaceCheck[];
}

/** Return the natural-language prose authored with `@surfaceDoc` on `target`. */
export function getSurfaceDoc(program: Program, target: SurfaceDocTarget): string | undefined {
  const stored: StoredSurfaceDoc | undefined = program
    .stateMap(SpectorStateKeys.SurfaceDoc)
    .get(target);
  return stored?.doc;
}

function getSurfaceParent(target: SurfaceDocTarget): SurfaceDocTarget | undefined {
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
 * Build a scenario-style name for a surface-doc target by walking up its
 * containers and joining their names, stopping at the (unnamed) global or the
 * `_Specs_` root — the same convention `@scenario` uses.
 */
function resolveSurfaceName(target: SurfaceDocTarget): string {
  const names: string[] = [];
  let current: SurfaceDocTarget | undefined = target;
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
  let current: SurfaceDocTarget | undefined = target;
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
 * surface instead of the wire. For each annotation it keeps the author's prose
 * and deterministically derives the machine-checkable checks from the element's
 * own client decorators. Feeds the `surface-checks.json` manifest.
 */
export function listSurfaceDocs(program: Program): SurfaceDoc[] {
  const map = program.stateMap(SpectorStateKeys.SurfaceDoc);
  const result: SurfaceDoc[] = [];
  for (const [target, stored] of map as Map<SurfaceDocTarget, StoredSurfaceDoc>) {
    result.push({
      name: resolveSurfaceName(target),
      scenario: getEnclosingScenarioName(program, target),
      target,
      doc: stored.doc,
      checks: mergeExplicitCheck(deriveSurfaceChecks(target), stored.explicitCheck),
    });
  }
  return result.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Fold an author-supplied explicit check into the derived checks: if it shares
 * a category with a derived check, its provided `details` override that check's;
 * otherwise it is appended as an additional check.
 */
function mergeExplicitCheck(
  derived: SurfaceCheck[],
  explicit: SurfaceCheckInfo | undefined,
): SurfaceCheck[] {
  if (explicit === undefined) {
    return derived;
  }
  const override = explicit.details ? pruneUndefined(explicit.details) : undefined;
  const existing = derived.find((c) => c.category === explicit.category);
  if (existing) {
    return derived.map((c) =>
      c === existing
        ? normalizeCheck({ category: c.category, details: { ...c.details, ...override } })
        : c,
    );
  }
  return [...derived, normalizeCheck({ category: explicit.category, details: override })];
}

/** Drop `undefined` fields so an explicit check only overrides what it sets. */
function pruneUndefined(details: SurfaceDetails): SurfaceDetails {
  return Object.fromEntries(
    Object.entries(details).filter(([, value]) => value !== undefined),
  ) as SurfaceDetails;
}

/**
 * Map a `@surfaceDoc` target to the language-agnostic symbol kind used by
 * casing-aware `naming` checks so each emitter can recast the expected
 * identifier into its idiomatic casing.
 */
export function getSurfaceKind(target: SurfaceDocTarget): string | undefined {
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

/**
 * A recognized decorator that carries a machine-checkable surface assertion —
 * either a core paging/typing decorator or a client-generator decorator.
 * Matched by decorator name + declaring namespace so spector does not need to
 * depend on the client-generator package — it only recognizes the decorators if
 * a spec applies them.
 */
interface KnownDecorator {
  name: `@${string}`;
  namespace: string;
  derive: (app: DecoratorApplication, target: SurfaceDocTarget) => SurfaceCheck | undefined;
}

const CLIENT_GENERATOR_CORE = "Azure.ClientGenerator.Core";
const CLIENT_GENERATOR_LEGACY = "Azure.ClientGenerator.Core.Legacy";
const TYPESPEC_CORE = "TypeSpec";

const KNOWN_DECORATORS: KnownDecorator[] = [
  {
    // @list — the operation surfaces a paginated iterator on the client
    name: "@list",
    namespace: TYPESPEC_CORE,
    derive: () => {
      return { category: "paging" };
    },
  },
  {
    // @clientName("RenamedForClients")
    name: "@clientName",
    namespace: CLIENT_GENERATOR_CORE,
    derive: (app, target) => {
      const expected = getStringArg(app, 0);
      if (expected === undefined) {
        return undefined;
      }
      return { category: "naming", details: { name: expected, kind: getSurfaceKind(target) } };
    },
  },
  {
    // @access(Access.internal | Access.public)
    name: "@access",
    namespace: CLIENT_GENERATOR_CORE,
    derive: (app) => {
      const access = getEnumMemberName(app, 0);
      if (access === undefined) {
        return undefined;
      }
      return { category: "access", details: { internal: access === "internal" } };
    },
  },
  {
    // @clientLocation(TargetClient) — moves an operation to another client
    name: "@clientLocation",
    namespace: CLIENT_GENERATOR_CORE,
    derive: (app, target) => {
      const client = getTypeOrStringName(app, 0);
      if (client === undefined) {
        return undefined;
      }
      return {
        category: "client-location",
        details: { client, absentFrom: getDeclaringContainerName(target) },
      };
    },
  },
  {
    // @hierarchyBuilding(Base) — reshapes the client inheritance hierarchy
    name: "@hierarchyBuilding",
    namespace: CLIENT_GENERATOR_LEGACY,
    derive: (app) => {
      const base = getTypeOrStringName(app, 0);
      if (base === undefined) {
        return undefined;
      }
      return { category: "hierarchy", details: { base } };
    },
  },
];

/**
 * Deterministically derive the machine-checkable checks for a `@surfaceDoc`
 * element by inspecting its own decorators for recognized client decorators.
 */
function deriveSurfaceChecks(target: SurfaceDocTarget): SurfaceCheck[] {
  const checks: SurfaceCheck[] = [];
  for (const app of target.decorators) {
    const known = KNOWN_DECORATORS.find((k) => matchesDecorator(app, k));
    if (!known) {
      continue;
    }
    const check = known.derive(app, target);
    if (check) {
      checks.push(normalizeCheck(check));
    }
  }
  return checks;
}

/** Drop empty/undefined `details` so a check only carries fields that apply. */
function normalizeCheck(check: SurfaceCheck): SurfaceCheck {
  const details = check.details && pruneUndefined(check.details);
  if (details && Object.keys(details).length > 0) {
    return { category: check.category, details };
  }
  return { category: check.category };
}

function matchesDecorator(app: DecoratorApplication, known: KnownDecorator): boolean {
  return (
    app.definition?.name === known.name &&
    getNamespaceFullName(app.definition.namespace) === known.namespace
  );
}

function getStringArg(app: DecoratorApplication, index: number): string | undefined {
  const value = app.args[index]?.jsValue;
  return typeof value === "string" ? value : undefined;
}

/** Read the name of an enum member passed as a decorator argument (e.g. `Access.internal`). */
function getEnumMemberName(app: DecoratorApplication, index: number): string | undefined {
  const arg = app.args[index];
  if (arg === undefined) {
    return undefined;
  }
  if (typeof arg.jsValue === "string") {
    return arg.jsValue;
  }
  const value = arg.value as Type | undefined;
  if (value && value.kind === "EnumMember") {
    return typeof value.value === "string" ? value.value : value.name;
  }
  return undefined;
}

/** Read the name of a type (or a string literal) passed as a decorator argument. */
function getTypeOrStringName(app: DecoratorApplication, index: number): string | undefined {
  const arg = app.args[index];
  if (arg === undefined) {
    return undefined;
  }
  if (typeof arg.jsValue === "string") {
    return arg.jsValue;
  }
  const value = arg.value as Type | undefined;
  if (value && "name" in value && typeof value.name === "string") {
    return value.name;
  }
  return undefined;
}

/** The name of the client/group an element is declared in — its surface origin. */
function getDeclaringContainerName(target: SurfaceDocTarget): string | undefined {
  const parent = getSurfaceParent(target);
  return parent && typeof parent.name === "string" && parent.name ? parent.name : undefined;
}
