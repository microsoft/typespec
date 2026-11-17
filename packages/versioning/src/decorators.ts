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

/** Records that the target becomes available starting at the given version, including re-additions. */
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

/** Records that the target stops being available starting at the given version. */
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
 * Gets property type changes in ascending version order, or `undefined` when none are recorded.
 * Each key is the first version using the new type; its value is the type used before that change.
 * The returned map belongs to the program's metadata and should not be modified.
 * @param p TypeSpec program
 * @param t type to query
 * @returns Map of versions to old types, if any
 */
export function getTypeChangedFrom(p: Program, t: Type): Map<Version, Type> | undefined {
  return p.stateMap(VersioningStateKeys.typeChangedFrom).get(t) as Map<Version, Type>;
}

/** Records a property type change that takes effect at the given version, retaining the preceding type. */
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
 * Gets operation return type changes in ascending version order, or `undefined` when none are recorded.
 * Each key is the first version using the new return type; its value is the preceding return type.
 * The returned map belongs to the program's metadata and should not be modified.
 * @param p TypeSpec program
 * @param t type to query
 * @returns Map of versions to old types, if any
 */
export function getReturnTypeChangedFrom(p: Program, t: Type): Map<Version, Type> | undefined {
  return p.stateMap(VersioningStateKeys.returnTypeChangedFrom).get(t) as Map<Version, Type>;
}

/** Records a return type change that takes effect at the given version, retaining the preceding return type. */
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

/** One historical name change, as returned by {@link getRenamedFrom}. */
interface RenamedFrom {
  /** First version in which the old name no longer applies. */
  version: Version;
  /** Name used immediately before this change. */
  oldName: string;
}

/** Records the target's name before the given version; multiple applications describe successive renames. */
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

/** Records the version where a required property becomes optional; the current declaration must be optional. */
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

/** Records the version where an optional property becomes required; the current declaration must be required. */
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
 * Gets historical names in ascending change-version order, or `undefined` when no renames are recorded.
 * The returned array and its records belong to the program's metadata and should not be modified.
 */
export function getRenamedFrom(p: Program, t: Type): Array<RenamedFrom> | undefined {
  return p.stateMap(VersioningStateKeys.renamedFrom).get(t) as Array<RenamedFrom>;
}

/**
 * Gets rename boundaries in ascending version order, or `undefined` when no renames are recorded.
 * The array is newly allocated, but its {@link Version} objects are shared with the program.
 */
export function getRenamedFromVersions(p: Program, t: Type): Version[] | undefined {
  return getRenamedFrom(p, t)?.map((x) => x.version);
}

/**
 * Gets explicit addition versions in ascending enum order, including re-additions.
 * Returns `undefined` when no `@added` metadata is recorded, not an inferred first version.
 * The returned array belongs to the program's metadata and should not be modified.
 */
export function getAddedOnVersions(p: Program, t: Type): Version[] | undefined {
  return p.stateMap(VersioningStateKeys.addedOn).get(t) as Version[];
}

/**
 * Gets explicit removal versions in ascending enum order.
 * Returns `undefined` when no `@removed` metadata is recorded.
 * The returned array belongs to the program's metadata and should not be modified.
 */
export function getRemovedOnVersions(p: Program, t: Type): Version[] | undefined {
  return p.stateMap(VersioningStateKeys.removedOn).get(t) as Version[];
}

/**
 * Gets the version recorded by `@madeOptional`, or `undefined` when absent.
 * This queries the change boundary, not the property's current optionality.
 */
export function getMadeOptionalOn(p: Program, t: Type): Version | undefined {
  return p.stateMap(VersioningStateKeys.madeOptional).get(t);
}

/**
 * Associates a namespace's version enum members with shared {@link Version} metadata.
 * Member identity is used for lookups; versions retain enum declaration order.
 */
export class VersionMap {
  private map = new Map<EnumMember, Version>();

  /** Creates metadata for each enum member without registering it on the namespace. */
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

  /** Gets the shared version object, or `undefined` if this exact member is not in the map. */
  public getVersionForEnumMember(member: EnumMember): Version | undefined {
    return this.map.get(member);
  }

  /** Returns a new array in enum declaration order, containing the map's shared version objects. */
  public getVersions(): Version[] {
    return [...this.map.values()];
  }

  /** Number of enum members represented in this map. */
  public get size(): number {
    return this.map.size;
  }
}

/** Registers the enum as the namespace's ordered set of supported versions. */
export const $versioned: VersionedDecorator = (
  context: DecoratorContext,
  t: Namespace,
  versions: Enum,
) => {
  context.program.stateMap(VersioningStateKeys.versions).set(t, new VersionMap(t, versions));
};

/**
 * Gets the version map registered directly on the namespace by `@versioned`,
 * or `undefined` if absent. Does not search parent namespaces.
 */
export function getVersion(program: Program, namespace: Namespace): VersionMap | undefined {
  return program.stateMap(VersioningStateKeys.versions).get(namespace);
}

/** Finds the nearest namespace with `@versioned`, including the supplied namespace, or `undefined`. */
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

/**
 * Records dependency version selections for a namespace or one member of a
 * service's version enum.
 */
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

/**
 * Gets explicit `@useDependency` selections keyed by dependency namespace.
 * Values are either a fixed dependency version or a map from local versions to
 * dependency versions. Returns `undefined` when no applicable metadata is found.
 *
 * Namespace lookup stops at the first namespace or version enum with dependency
 * metadata, searching outward through parents rather than merging their selections.
 * Returned maps are newly allocated and contain shared version objects.
 * @param searchEnum Whether namespace lookup also checks each namespace's version enum.
 * Defaults to `true`; ignored when the target is already an enum.
 */
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
