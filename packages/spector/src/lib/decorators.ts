import type { Enum, Interface, Model, Namespace, Operation, Program } from "@typespec/compiler";
import { $service, getNamespaceFullName, getTypeName, listServices } from "@typespec/compiler";
import type { HttpVerb } from "@typespec/http";
import { $route, $server, getOperationVerb, getRoutePath, getServers } from "@typespec/http";
import { $versioned } from "@typespec/versioning";
import type {
  ScenarioDecorator,
  ScenarioDocDecorator,
  ScenarioServiceDecorator,
} from "../../generated-defs/TypeSpec.Spector.js";
import { SpectorStateKeys } from "./lib.js";

/**
 * Marks a declaration as a scenario, grouping all operations it contains under one name.
 * The local name defaults to the declaration's name; {@link getScenarioName} adds its containers.
 */
export const $scenario: ScenarioDecorator = (context, target, name?) => {
  context.program.stateMap(SpectorStateKeys.Scenario).set(target, name ?? target.name);
};

/**
 * Attaches implementation guidance to a scenario declaration.
 * When format arguments are provided, `{property}` placeholders use the property's literal value
 * or type name; missing properties are replaced with an empty string.
 */
export const $scenarioDoc: ScenarioDocDecorator = (context, target, doc, formatArgs?) => {
  const formattedDoc = formatArgs ? replaceTemplatedStringFromProperties(doc, formatArgs) : doc;
  context.program.stateMap(SpectorStateKeys.ScenarioDoc).set(target, formattedDoc);
};

/**
 * Configures a namespace as a scenario service with the supplied route and a
 * `http://localhost:3000` server. Its service title is the full namespace name without dots.
 * Applies versioning when the options specify a version enum.
 */
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

/**
 * Gets the implementation guidance attached directly to a declaration by `@scenarioDoc`,
 * after any format arguments have been substituted. Returns `undefined` when absent;
 * documentation on containing declarations is not inherited.
 */
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

/**
 * A scenario discovered in a TypeSpec program, linking implementation guidance and source
 * operations to the name used by mock API implementations and coverage reports.
 * This is specification metadata, not a mock handler or a coverage result.
 */
export interface Scenario {
  /** Fully qualified scenario name used as the mock implementation and coverage key. */
  name: string;
  /** Implementation guidance from `@scenarioDoc`; service validation diagnoses missing guidance. */
  scenarioDoc: string;
  /** Declaration marked with `@scenario`, which may group multiple operations. */
  target: Operation | Interface | Namespace;
  /** Route summaries for all operations contained by the scenario declaration. */
  endpoints: ScenarioEndpoint[];
}

/**
 * A source operation and its route summary within a scenario.
 * Use the source operation with the HTTP library when a fully resolved HTTP route is required.
 */
export interface ScenarioEndpoint {
  /** HTTP verb from the operation's HTTP metadata, falling back to `get` when unspecified. */
  verb: HttpVerb;
  /**
   * Concatenated `@route` segments with the recognized server prefix from the program's first
   * service, when it has a single server. This is not a fully resolved HTTP route.
   */
  path: string;
  /** Source operation, retained for resolving complete HTTP metadata or reporting diagnostics. */
  target: Operation;
}

/**
 * Discovers scenarios starting at the program's global namespace.
 * Like {@link listScenarioIn}, stops searching for nested scenario declarations once a scenario is found.
 */
export function listScenarios(program: Program): Scenario[] {
  return listScenarioIn(program, program.getGlobalNamespaceType());
}

/**
 * Collects route summaries for a declaration's operations, regardless of `@scenario` annotations.
 * Namespaces are traversed recursively through child namespaces, interfaces, then direct operations;
 * each collection retains its declaration-map order. An operation produces a single endpoint.
 */
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

/**
 * Discovers scenarios at or beneath a declaration. If the declaration has a scenario name,
 * returns that scenario with all its endpoints instead of discovering nested scenario declarations.
 * Otherwise visits child namespaces, interfaces, then direct operations in declaration-map order.
 */
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

/**
 * Tests whether a declaration itself has `@scenario`.
 * Operations contained in a scenario are not marked unless they also have the decorator.
 */
export function isScenario(program: Program, target: Operation | Interface | Namespace): boolean {
  return program.stateMap(SpectorStateKeys.Scenario).has(target);
}

/**
 * Gets a directly marked scenario's name, prefixed with containing namespace and interface names
 * separated by underscores. The global namespace and `_Specs_` namespace terminate the prefix.
 * Returns `undefined` for unmarked declarations, including operations merely contained in a scenario.
 */
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
