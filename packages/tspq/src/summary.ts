import {
  getLocationContext,
  getNamespaceFullName,
  getTypeName,
  isStdNamespace,
  listOperationsIn,
  listServices,
  type DiagnosticTarget,
  type Namespace,
  type Program,
} from "@typespec/compiler";

export interface ServiceSummary {
  name: string;
  title?: string;
  operations: string[];
}

export interface ProgramSummary {
  services: ServiceSummary[];
  operations: string[];
  types: TypeSummary;
  counts: {
    services: number;
    operations: number;
    types: number;
    models: number;
    enums: number;
    unions: number;
    scalars: number;
    interfaces: number;
    namespaces: number;
  };
}

export interface TypeSummary {
  models: string[];
  enums: string[];
  unions: string[];
  scalars: string[];
  interfaces: string[];
  namespaces: string[];
}

export function summarizeProgram(program: Program): ProgramSummary {
  const services = listServices(program)
    .filter((service) => isProjectType(program, service.type))
    .map((service) => {
      return {
        name: getTypeName(service.type),
        title: service.title,
        operations: listOperationsIn(service.type)
          .filter((op) => isProjectType(program, op))
          .map((op) => getTypeName(op)),
      };
    });

  const operations = listOperationsIn(program.getGlobalNamespaceType())
    .filter((op) => isProjectType(program, op))
    .map((op) => getTypeName(op));

  const types = createTypeSummary();
  collectTypes(program, program.getGlobalNamespaceType(), types);
  sortTypeSummary(types);

  return {
    services,
    operations,
    types,
    counts: {
      services: services.length,
      operations: operations.length,
      types: countAllTypes(types),
      models: types.models.length,
      enums: types.enums.length,
      unions: types.unions.length,
      scalars: types.scalars.length,
      interfaces: types.interfaces.length,
      namespaces: types.namespaces.length,
    },
  };
}

function createTypeSummary(): TypeSummary {
  return {
    models: [],
    enums: [],
    unions: [],
    scalars: [],
    interfaces: [],
    namespaces: [],
  };
}

function countAllTypes(summary: TypeSummary): number {
  return (
    summary.models.length +
    summary.enums.length +
    summary.unions.length +
    summary.scalars.length +
    summary.interfaces.length +
    summary.namespaces.length
  );
}

function sortTypeSummary(summary: TypeSummary) {
  summary.models.sort((left, right) => left.localeCompare(right));
  summary.enums.sort((left, right) => left.localeCompare(right));
  summary.unions.sort((left, right) => left.localeCompare(right));
  summary.scalars.sort((left, right) => left.localeCompare(right));
  summary.interfaces.sort((left, right) => left.localeCompare(right));
  summary.namespaces.sort((left, right) => left.localeCompare(right));
}

function collectTypes(program: Program, namespace: Namespace, summary: TypeSummary) {
  for (const model of namespace.models.values()) {
    if (isProjectType(program, model)) {
      summary.models.push(getTypeName(model));
    }
  }
  for (const scalar of namespace.scalars.values()) {
    if (isProjectType(program, scalar)) {
      summary.scalars.push(getTypeName(scalar));
    }
  }
  for (const union of namespace.unions.values()) {
    if (isProjectType(program, union)) {
      summary.unions.push(getTypeName(union));
    }
  }
  for (const iface of namespace.interfaces.values()) {
    if (isProjectType(program, iface)) {
      summary.interfaces.push(getTypeName(iface));
    }
  }
  for (const enumType of namespace.enums.values()) {
    if (isProjectType(program, enumType)) {
      summary.enums.push(getTypeName(enumType));
    }
  }

  for (const subNamespace of namespace.namespaces.values()) {
    if (isStdNamespace(subNamespace)) {
      continue;
    }
    if (isProjectType(program, subNamespace)) {
      summary.namespaces.push(getNamespaceFullName(subNamespace));
    }
    collectTypes(program, subNamespace, summary);
  }
}

function isProjectType(program: Program, target: DiagnosticTarget): boolean {
  return getLocationContext(program, target).type === "project";
}
