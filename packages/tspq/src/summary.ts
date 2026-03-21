import {
  getDoc,
  getLocationContext,
  getNamespaceFullName,
  getTypeName,
  isStdNamespace,
  listOperationsIn,
  listServices,
  type DiagnosticTarget,
  type Namespace,
  type Program,
  type Type,
} from "@typespec/compiler";

export interface ServiceSummary {
  name: string;
  title?: string;
  operations: SummaryItem[];
  description?: string;
}

export interface SummaryItem {
  name: string;
  description?: string;
}

export interface ProgramSummary {
  services: ServiceSummary[];
  operations: SummaryItem[];
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
  models: SummaryItem[];
  enums: SummaryItem[];
  unions: SummaryItem[];
  scalars: SummaryItem[];
  interfaces: SummaryItem[];
  namespaces: SummaryItem[];
}

export function summarizeProgram(program: Program): ProgramSummary {
  const services = listServices(program)
    .filter((service) => isProjectType(program, service.type))
    .map((service) => {
      return {
        name: getTypeName(service.type),
        title: service.title,
        description: getDoc(program, service.type),
        operations: listOperationsIn(service.type)
          .filter((op) => isProjectType(program, op))
          .map((op) => createTypeSummaryItem(program, op)),
      };
    });

  const operations = listOperationsIn(program.getGlobalNamespaceType())
    .filter((op) => isProjectType(program, op))
    .map((op) => createTypeSummaryItem(program, op));

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
  summary.models.sort((left, right) => left.name.localeCompare(right.name));
  summary.enums.sort((left, right) => left.name.localeCompare(right.name));
  summary.unions.sort((left, right) => left.name.localeCompare(right.name));
  summary.scalars.sort((left, right) => left.name.localeCompare(right.name));
  summary.interfaces.sort((left, right) => left.name.localeCompare(right.name));
  summary.namespaces.sort((left, right) => left.name.localeCompare(right.name));
}

function collectTypes(program: Program, namespace: Namespace, summary: TypeSummary) {
  for (const model of namespace.models.values()) {
    if (isProjectType(program, model)) {
      summary.models.push(createTypeSummaryItem(program, model));
    }
  }
  for (const scalar of namespace.scalars.values()) {
    if (isProjectType(program, scalar)) {
      summary.scalars.push(createTypeSummaryItem(program, scalar));
    }
  }
  for (const union of namespace.unions.values()) {
    if (isProjectType(program, union)) {
      summary.unions.push(createTypeSummaryItem(program, union));
    }
  }
  for (const iface of namespace.interfaces.values()) {
    if (isProjectType(program, iface)) {
      summary.interfaces.push(createTypeSummaryItem(program, iface));
    }
  }
  for (const enumType of namespace.enums.values()) {
    if (isProjectType(program, enumType)) {
      summary.enums.push(createTypeSummaryItem(program, enumType));
    }
  }

  for (const subNamespace of namespace.namespaces.values()) {
    if (isStdNamespace(subNamespace)) {
      continue;
    }
    if (isProjectType(program, subNamespace)) {
      summary.namespaces.push(createNamespaceSummaryItem(program, subNamespace));
    }
    collectTypes(program, subNamespace, summary);
  }
}

function isProjectType(program: Program, target: DiagnosticTarget): boolean {
  return getLocationContext(program, target).type === "project";
}

function createTypeSummaryItem(program: Program, target: Type): SummaryItem {
  return {
    name: getTypeName(target),
    description: getDoc(program, target),
  };
}

function createNamespaceSummaryItem(program: Program, target: Namespace): SummaryItem {
  return {
    name: getNamespaceFullName(target),
    description: getDoc(program, target),
  };
}
