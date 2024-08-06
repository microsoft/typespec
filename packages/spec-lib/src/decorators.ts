import {
  $service,
  DecoratorContext,
  Enum,
  getNamespaceFullName,
  getTypeName,
  Interface,
  listServices,
  Model,
  Namespace,
  Operation,
  Program,
  StringLiteral,
} from "@typespec/compiler";
import { $route, $server, getOperationVerb, getRoutePath, getServers, HttpVerb } from "@typespec/http";
import { $versioned } from "@typespec/versioning";
import { reportDiagnostic } from "./lib.js";
import { SupportedBy } from "./types.js";

// Allow transition for breaking change https://github.com/microsoft/typespec/pull/1877
function unifyString(type: string | StringLiteral) {
  return typeof type === "string" ? type : type.value;
}

const SupportedByOptions: Set<string> = new Set(["arm", "dpg"]);
const SupportedBy = Symbol("SupportedBy");
export function $supportedBy(context: DecoratorContext, target: Namespace, catgoryType: string | StringLiteral) {
  const category = unifyString(catgoryType);
  if (!SupportedByOptions.has(category)) {
    reportDiagnostic(context.program, {
      code: "category-invalid",
      format: { category, allowed: [...SupportedByOptions].join(", ") },
      target: context.getArgumentTarget(0)!,
    });
  }
  context.program.stateMap(SupportedBy).set(target, category);
}

export function getSupportedBy(program: Program, target: Namespace): SupportedBy | undefined {
  return program.stateMap(SupportedBy).get(target);
}

const ScenarioDocKey = Symbol("ScenarioDoc");
export function $scenarioDoc(
  context: DecoratorContext,
  target: Namespace | Operation | Interface,
  docType: string | StringLiteral,
  formatArgs?: Model,
) {
  const doc = unifyString(docType);
  const formattedDoc = formatArgs ? replaceTemplatedStringFromProperties(doc, formatArgs) : doc;
  context.program.stateMap(ScenarioDocKey).set(target, formattedDoc);
}

export function getScenarioDoc(program: Program, target: Operation | Interface | Namespace): string | undefined {
  return program.stateMap(ScenarioDocKey).get(target);
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

const ScenarioKey = Symbol("Scenario");
export function $scenario(
  context: DecoratorContext,
  target: Namespace | Operation | Interface,
  nameType?: string | StringLiteral,
) {
  const name = nameType && unifyString(nameType);
  context.program.stateMap(ScenarioKey).set(target, name ?? target.name);
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

export function getScenarioEndpoints(program: Program, target: Namespace | Interface | Operation): ScenarioEndpoint[] {
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
    (template ? (template.endsWith("/") || segments.length === 0 ? template : template + "/") : "/") +
    segments.map((x) => (x.startsWith("/") ? x.substring(1) : x)).join("/")
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

export function listScenarioIn(program: Program, target: Namespace | Interface | Operation): Scenario[] {
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
    current = current.kind === "Operation" && current.interface ? current.interface : current.namespace;
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
  return program.stateMap(ScenarioKey).has(target);
}

export function getScenarioName(program: Program, target: Operation | Interface | Namespace): string | undefined {
  const name = program.stateMap(ScenarioKey).get(target);
  if (name === undefined) {
    return undefined;
  }
  return resolveScenarioName(target, name);
}

const ScenarioServiceKey = Symbol("ScenarioService");
export function $scenarioService(
  context: DecoratorContext,
  target: Namespace,
  routeType: string | StringLiteral,
  options?: Model,
) {
  const route = unifyString(routeType);
  const properties = new Map().set("title", {
    type: { kind: "String", value: getNamespaceFullName(target).replace(/\./g, "") },
  });

  context.program.stateSet(ScenarioServiceKey).add(target);

  const versions = options?.properties.get("versioned")?.type;
  if (versions) {
    context.call($versioned, target, versions as Enum);
  }
  context.call($service, target, {
    kind: "Model",
    properties,
    decorators: [],
    projections: [],
    name: "Service",
    derivedModels: [],
    projectionsByName: [],
  } as any);
  context.call($server, target, "http://localhost:3000", "TestServer endpoint");
  context.call($route, target, route);
}
