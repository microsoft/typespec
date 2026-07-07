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
  SurfaceCheck,
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

export const $surfaceDoc: SurfaceDocDecorator = (context, target, checks) => {
  context.program.stateMap(SpectorStateKeys.SurfaceDoc).set(target, checks);
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

export type { SurfaceCheck };

/** A resolved `@surfaceDoc` annotation with its language-agnostic surface checks. */
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
  /** The surface assertions declared on the element. */
  checks: readonly SurfaceCheck[];
}

export function getSurfaceChecks(
  program: Program,
  target: SurfaceDocTarget,
): readonly SurfaceCheck[] | undefined {
  return program.stateMap(SpectorStateKeys.SurfaceDoc).get(target);
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
    if (
      current.kind === "Namespace" &&
      (current.name === "" || current.name === "_Specs_")
    ) {
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

function getEnclosingScenarioName(
  program: Program,
  target: SurfaceDocTarget,
): string | undefined {
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
 * surface instead of the wire. Feeds the `surface-checks.json` manifest.
 */
export function listSurfaceDocs(program: Program): SurfaceDoc[] {
  const map = program.stateMap(SpectorStateKeys.SurfaceDoc);
  const result: SurfaceDoc[] = [];
  for (const [target, checks] of map as Map<SurfaceDocTarget, readonly SurfaceCheck[]>) {
    result.push({
      name: resolveSurfaceName(target),
      scenario: getEnclosingScenarioName(program, target),
      target,
      checks,
    });
  }
  return result.sort((a, b) => a.name.localeCompare(b.name));
}
