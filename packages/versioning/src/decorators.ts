import type {
  DecoratorContext,
  DiagnosticTarget,
  Enum,
  EnumMember,
  Interface,
  Model,
  ModelProperty,
  Namespace,
  Operation,
  Program,
  Scalar,
  Type,
  Union,
  UnionVariant,
} from "@typespec/compiler";
import type {
  AddedDecorator,
  MadeOptionalDecorator,
  MadeRequiredDecorator,
  RenamedFromDecorator,
  ReturnTypeChangedFromDecorator,
  TypeChangedFromDecorator,
  VersionedDecorator,
} from "../generated-defs/TypeSpec.Versioning.js";
import { VersioningStateKeys, reportDiagnostic } from "./lib.js";
import type { Version } from "./types.js";
import { getVersionForEnumMember } from "./versioning.js";

export const namespace = "TypeSpec.Versioning";

function checkIsVersion(
  program: Program,
  enumMember: EnumMember,
  diagnosticTarget: DiagnosticTarget,
): Version | undefined {
  const version = getVersionForEnumMember(program, enumMember);

  if (!version) {
    reportDiagnostic(program, {
      code: "version-not-found",
      target: diagnosticTarget,
      format: { version: enumMember.name, enumName: enumMember.enum.name },
    });
  }
  return version;
}

export const $added: AddedDecorator = (
  context: DecoratorContext,
  t:
    | Model
    | ModelProperty
    | Operation
    | Enum
    | EnumMember
    | Union
    | UnionVariant
    | Scalar
    | Interface,
  v: EnumMember,
) => {
  const { program } = context;

  const version = checkIsVersion(context.program, v, context.getArgumentTarget(0)!);
  if (!version) {
    return;
  }

  // retrieve statemap to update or create a new one
  const record =
    program.stateMap(VersioningStateKeys.addedOn).get(t as Type) ?? new Array<Version>();
  record.push(version);
  // ensure that records are stored in ascending order
  (record as Version[]).sort((a, b) => a.index - b.index);

  program.stateMap(VersioningStateKeys.addedOn).set(t as Type, record);
};

export function $removed(
  context: DecoratorContext,
  t:
    | Model
    | ModelProperty
    | Operation
    | Enum
    | EnumMember
    | Union
    | UnionVariant
    | Scalar
    | Interface,
  v: EnumMember,
) {
  const { program } = context;

  const version = checkIsVersion(context.program, v, context.getArgumentTarget(0)!);
  if (!version) {
    return;
  }

  // retrieve statemap to update or create a new one
  const record =
    program.stateMap(VersioningStateKeys.removedOn).get(t as Type) ?? new Array<Version>();
  record.push(version);
  // ensure that records are stored in ascending order
  (record as Version[]).sort((a, b) => a.index - b.index);

  program.stateMap(VersioningStateKeys.removedOn).set(t as Type, record);
}

/**
 * Returns the mapping of versions to old type values, if applicable
 * @param p TypeSpec program
 * @param t type to query
 * @returns Map of versions to old types, if any
 */
export function getTypeChangedFrom(p: Program, t: Type): Map<Version, Type> | undefined {
  return p.stateMap(VersioningStateKeys.typeChangedFrom).get(t) as Map<Version, Type>;
}

export const $typeChangedFrom: TypeChangedFromDecorator = (
  context: DecoratorContext,
  prop: ModelProperty,
  v: EnumMember,
  oldType: any,
) => {
  const { program } = context;

  const version = checkIsVersion(context.program, v, context.getArgumentTarget(0)!);
  if (!version) {
    return;
  }

  // retrieve statemap to update or create a new one
  let record = getTypeChangedFrom(program, prop) ?? new Map<Version, any>();
  record.set(version, oldType);
  // ensure the map is sorted by version
  record = new Map([...record.entries()].sort((a, b) => a[0].index - b[0].index));
  program.stateMap(VersioningStateKeys.typeChangedFrom).set(prop, record);
};

/**
 * Returns the mapping of versions to old return type values, if applicable
 * @param p TypeSpec program
 * @param t type to query
 * @returns Map of versions to old types, if any
 */
export function getReturnTypeChangedFrom(p: Program, t: Type): Map<Version, Type> | undefined {
  return p.stateMap(VersioningStateKeys.returnTypeChangedFrom).get(t) as Map<Version, Type>;
}

export const $returnTypeChangedFrom: ReturnTypeChangedFromDecorator = (
  context: DecoratorContext,
  op: Operation,
  v: EnumMember,
  oldReturnType: Type,
) => {
  const { program } = context;

  const version = checkIsVersion(context.program, v, context.getArgumentTarget(0)!);
  if (!version) {
    return;
  }

  // retrieve statemap to update or create a new one
  let record = getReturnTypeChangedFrom(program, op) ?? new Map<Version, any>();
  record.set(version, oldReturnType);
  // ensure the map is sorted by version
  record = new Map([...record.entries()].sort((a, b) => a[0].index - b[0].index));
  program.stateMap(VersioningStateKeys.returnTypeChangedFrom).set(op, record);
};

interface RenamedFrom {
  version: Version;
  oldName: string;
}

export const $renamedFrom: RenamedFromDecorator = (
  context: DecoratorContext,
  t:
    | Model
    | ModelProperty
    | Operation
    | Enum
    | EnumMember
    | Union
    | UnionVariant
    | Scalar
    | Interface,
  v: EnumMember,
  oldName: string,
) => {
  const { program } = context;
  const version = checkIsVersion(context.program, v, context.getArgumentTarget(0)!);
  if (!version) {
    return;
  }

  if (oldName === "") {
    reportDiagnostic(program, {
      code: "invalid-renamed-from-value",
      target: t as Type,
    });
  }

  // retrieve statemap to update or create a new one
  const record = getRenamedFrom(program, t as Type) ?? [];
  record.push({ version: version, oldName: oldName });
  // ensure that records are stored in ascending order
  record.sort((a, b) => a.version.index - b.version.index);

  program.stateMap(VersioningStateKeys.renamedFrom).set(t as Type, record);
};

export const $madeOptional: MadeOptionalDecorator = (
  context: DecoratorContext,
  t: ModelProperty,
  v: EnumMember,
) => {
  const { program } = context;
  const version = checkIsVersion(context.program, v, context.getArgumentTarget(0)!);
  if (!version) {
    return;
  }
  program.stateMap(VersioningStateKeys.madeOptional).set(t, version);
};

export const $madeRequired: MadeRequiredDecorator = (
  context: DecoratorContext,
  t: ModelProperty,
  v: EnumMember,
) => {
  const { program } = context;
  const version = checkIsVersion(context.program, v, context.getArgumentTarget(0)!);
  if (!version) {
    return;
  }
  program.stateMap(VersioningStateKeys.madeRequired).set(t, version);
};

/**
 * @returns version when the given type was made required if applicable.
 */
export function getMadeRequiredOn(p: Program, t: Type): Version | undefined {
  return p.stateMap(VersioningStateKeys.madeRequired).get(t);
}

/**
 * @returns the array of RenamedFrom metadata if applicable.
 */
export function getRenamedFrom(p: Program, t: Type): Array<RenamedFrom> | undefined {
  return p.stateMap(VersioningStateKeys.renamedFrom).get(t) as Array<RenamedFrom>;
}

/**
 * @returns the list of versions for which this decorator has been applied
 */
export function getRenamedFromVersions(p: Program, t: Type): Version[] | undefined {
  return getRenamedFrom(p, t)?.map((x) => x.version);
}

export function getAddedOnVersions(p: Program, t: Type): Version[] | undefined {
  return p.stateMap(VersioningStateKeys.addedOn).get(t) as Version[];
}

export function getRemovedOnVersions(p: Program, t: Type): Version[] | undefined {
  return p.stateMap(VersioningStateKeys.removedOn).get(t) as Version[];
}

/**
 * @returns version when the given type was made optional if applicable.
 */
export function getMadeOptionalOn(p: Program, t: Type): Version | undefined {
  return p.stateMap(VersioningStateKeys.madeOptional).get(t);
}

export class VersionMap {
  private map = new Map<EnumMember, Version>();

  constructor(namespace: Namespace, enumType: Enum) {
    let index = 0;
    for (const member of enumType.members.values()) {
      this.map.set(member, {
        name: member.name,
        value: member.value?.toString() ?? member.name,
        enumMember: member,
        index,
        namespace,
      });
      index++;
    }
  }

  public getVersionForEnumMember(member: EnumMember): Version | undefined {
    return this.map.get(member);
  }

  public getVersions(): Version[] {
    return [...this.map.values()];
  }

  public get size(): number {
    return this.map.size;
  }
}

export const $versioned: VersionedDecorator = (
  context: DecoratorContext,
  t: Namespace,
  versions: Enum,
) => {
  context.program.stateMap(VersioningStateKeys.versions).set(t, new VersionMap(t, versions));
};

/**
 * Get the version map of the namespace.
 */
export function getVersion(program: Program, namespace: Namespace): VersionMap | undefined {
  return program.stateMap(VersioningStateKeys.versions).get(namespace);
}

export function findVersionedNamespace(
  program: Program,
  namespace: Namespace,
): Namespace | undefined {
  let current: Namespace | undefined = namespace;

  while (current) {
    if (program.stateMap(VersioningStateKeys.versions).has(current)) {
      return current;
    }
    current = current.namespace;
  }

  return undefined;
}

export function $useDependency(
  context: DecoratorContext,
  target: EnumMember | Namespace,
  ...versionRecords: EnumMember[]
) {
  const versions: Version[] = [];
  // ensure only valid versions are passed in
  for (const record of versionRecords) {
    const ver = checkIsVersion(context.program, record, context.getArgumentTarget(0)!);
    if (ver) {
      versions.push(ver);
    }
  }

  if (target.kind === "Namespace") {
    let state = getNamespaceUseDependencyState(context.program, target);
    if (!state) {
      state = versions;
    } else {
      state.push(...versions);
    }
    context.program.stateMap(VersioningStateKeys.useDependencyNamespace).set(target, state);
  } else if (target.kind === "EnumMember") {
    const targetEnum = target.enum;
    let state = context.program
      .stateMap(VersioningStateKeys.useDependencyEnum)
      .get(targetEnum) as Map<EnumMember, Version[]>;
    if (!state) {
      state = new Map<EnumMember, Version[]>();
    }
    // get any existing versions and combine them
    const currentVersions = state.get(target) ?? [];
    currentVersions.push(...versions);
    state.set(target, currentVersions);
    context.program.stateMap(VersioningStateKeys.useDependencyEnum).set(targetEnum, state);
  }
}

function getNamespaceUseDependencyState(
  program: Program,
  target: Namespace,
): Version[] | undefined {
  return program.stateMap(VersioningStateKeys.useDependencyNamespace).get(target);
}

export function getUseDependencies(
  program: Program,
  target: Namespace | Enum,
  searchEnum: boolean = true,
): Map<Namespace, Map<Version, Version> | Version> | undefined {
  const result = new Map<Namespace, Map<Version, Version> | Version>();
  if (target.kind === "Namespace") {
    let current: Namespace | undefined = target;
    while (current) {
      const data = getNamespaceUseDependencyState(program, current);
      if (!data) {
        // See if the namspace has a version enum
        if (searchEnum) {
          const versions = getVersion(program, current)?.getVersions();
          if (versions?.length) {
            const enumDeps = getUseDependencies(program, versions[0].enumMember.enum);
            if (enumDeps) {
              return enumDeps;
            }
          }
        }
        current = current.namespace;
      } else {
        for (const v of data) {
          result.set(v.namespace, v);
        }
        return result;
      }
    }
    return undefined;
  } else if (target.kind === "Enum") {
    const data = program.stateMap(VersioningStateKeys.useDependencyEnum).get(target) as Map<
      EnumMember,
      Version[]
    >;
    if (!data) {
      return undefined;
    }
    const resolved = resolveVersionDependency(program, data);
    if (resolved instanceof Map) {
      for (const [enumVer, value] of resolved) {
        for (const val of value) {
          const targetNamespace = val.enumMember.enum.namespace;
          if (!targetNamespace) {
            reportDiagnostic(program, {
              code: "version-not-found",
              target: val.enumMember.enum,
              format: { version: val.enumMember.name, enumName: val.enumMember.enum.name },
            });
            return undefined;
          }
          let subMap = result.get(targetNamespace) as Map<Version, Version>;
          if (subMap) {
            subMap.set(enumVer, val);
          } else {
            subMap = new Map([[enumVer, val]]);
          }
          result.set(targetNamespace, subMap);
        }
      }
    }
  }
  return result;
}

function resolveVersionDependency(
  program: Program,
  data: Map<EnumMember, Version[]> | Version[],
): Map<Version, Version[]> | Version[] {
  if (!(data instanceof Map)) {
    return data;
  }
  const mapping = new Map<Version, Version[]>();
  for (const [key, value] of data) {
    const sourceVersion = getVersionForEnumMember(program, key);
    if (sourceVersion !== undefined) {
      mapping.set(sourceVersion, value);
    }
  }
  return mapping;
}
