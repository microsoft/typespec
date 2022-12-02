import {
  DecoratorContext,
  DiagnosticTarget,
  Enum,
  EnumMember,
  getNamespaceFullName,
  Namespace,
  ObjectType,
  Program,
  ProjectionApplication,
  Tuple,
  Type,
} from "@cadl-lang/compiler";
import { createStateSymbol, reportDiagnostic } from "./lib.js";

const addedOnKey = createStateSymbol("addedOn");
const removedOnKey = createStateSymbol("removedOn");
const versionsKey = createStateSymbol("versions");
const versionDependencyKey = createStateSymbol("versionDependency");
const renamedFromKey = createStateSymbol("renamedFrom");
const madeOptionalKey = createStateSymbol("madeOptional");

export const namespace = "Cadl.Versioning";

function checkIsVersion(
  program: Program,
  enumMember: EnumMember,
  diagnosticTarget: DiagnosticTarget
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

export function $added(context: DecoratorContext, t: Type, v: EnumMember) {
  const { program } = context;

  const version = checkIsVersion(context.program, v, context.getArgumentTarget(0)!);
  if (!version) {
    return;
  }

  program.stateMap(addedOnKey).set(t, version);
}

export function $removed(context: DecoratorContext, t: Type, v: EnumMember) {
  const { program } = context;

  const version = checkIsVersion(context.program, v, context.getArgumentTarget(0)!);
  if (!version) {
    return;
  }
  program.stateMap(removedOnKey).set(t, version);
}
export function $renamedFrom(context: DecoratorContext, t: Type, v: EnumMember, oldName: string) {
  const { program } = context;
  const version = checkIsVersion(context.program, v, context.getArgumentTarget(0)!);
  if (!version) {
    return;
  }
  const record = { v: version, oldName: oldName };

  program.stateMap(renamedFromKey).set(t, record);
}

export function $madeOptional(context: DecoratorContext, t: Type, v: EnumMember) {
  const { program } = context;
  const version = checkIsVersion(context.program, v, context.getArgumentTarget(0)!);
  if (!version) {
    return;
  }
  program.stateMap(madeOptionalKey).set(t, version);
}

/**
 * @returns version when the given type was added if applicable.
 */
export function getRenamedFromVersion(p: Program, t: Type): Version | undefined {
  return p.stateMap(renamedFromKey).get(t)?.v;
}

/**
 * @returns get old renamed name if applicable.
 */
export function getRenamedFromOldName(p: Program, t: Type): string {
  return p.stateMap(renamedFromKey).get(t)?.oldName ?? "";
}

/**
 * @returns version when the given type was added if applicable.
 */
export function getAddedOn(p: Program, t: Type): Version | undefined {
  return p.stateMap(addedOnKey).get(t);
}

/**
 * @returns version when the given type was removed if applicable.
 */
export function getRemovedOn(p: Program, t: Type): Version | undefined {
  return p.stateMap(removedOnKey).get(t);
}

/**
 * @returns version when the given type was made optional if applicable.
 */
export function getMadeOptionalOn(p: Program, t: Type): Version | undefined {
  return p.stateMap(madeOptionalKey).get(t);
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

export function $versioned(context: DecoratorContext, t: Namespace, versions: Enum) {
  context.program.stateMap(versionsKey).set(t, new VersionMap(t, versions));
}

export function getVersion(p: Program, t: Namespace): VersionMap | undefined {
  return p.stateMap(versionsKey).get(t);
}

export function $versionedDependency(
  context: DecoratorContext,
  referenceNamespace: Namespace,
  versionRecord: Tuple | EnumMember
) {
  const { program } = context;
  let state = program.stateMap(versionDependencyKey).get(referenceNamespace) as Map<
    Namespace,
    Version | Map<EnumMember, Version>
  >;

  if (!state) {
    state = new Map();
    context.program.stateMap(versionDependencyKey).set(referenceNamespace, state);
  }

  if (versionRecord.kind === "EnumMember") {
    const v = checkIsVersion(program, versionRecord, context.getArgumentTarget(0)!);
    if (v) {
      state.set(v.namespace, v);
    }
  } else {
    let targetNamespace: Namespace | undefined;
    const versionMap = new Map<EnumMember, Version>();

    for (const entry of versionRecord.values) {
      if (entry.kind !== "Tuple") {
        reportDiagnostic(context.program, { code: "versioned-dependency-tuple", target: entry });
        continue;
      }
      const [sourceMember, targetMember] = entry.values;

      if (sourceMember === undefined || sourceMember.kind !== "EnumMember") {
        reportDiagnostic(context.program, {
          code: "versioned-dependency-tuple-enum-member",
          target: sourceMember ?? entry,
        });
        continue;
      }
      if (targetMember === undefined || targetMember.kind !== "EnumMember") {
        reportDiagnostic(context.program, {
          code: "versioned-dependency-tuple-enum-member",
          target: targetMember ?? entry,
        });
        continue;
      }

      const targetVersion = checkIsVersion(program, targetMember, targetMember);
      if (!targetVersion) {
        continue;
      }
      if (targetNamespace === undefined) {
        targetNamespace = targetVersion.namespace;
      } else if (targetNamespace !== targetVersion.namespace) {
        reportDiagnostic(context.program, {
          code: "versioned-dependency-same-namespace",
          format: {
            namespace1: getNamespaceFullName(targetNamespace),
            namespace2: getNamespaceFullName(targetVersion.namespace),
          },
          target: targetMember,
        });
        return;
      }

      versionMap.set(sourceMember, targetVersion);
    }
    if (targetNamespace) {
      state.set(targetNamespace, versionMap);
    }
  }
}

export function getVersionDependencies(
  program: Program,
  namespace: Namespace
): Map<Namespace, Map<Version, Version> | Version> | undefined {
  const data = program.stateMap(versionDependencyKey).get(namespace);
  if (data === undefined) {
    return undefined;
  }
  const result = new Map();
  for (const [key, value] of data) {
    result.set(key, resolveVersionDependency(program, value));
  }
  return result;
}

function resolveVersionDependency(program: Program, data: Map<EnumMember, Version> | Version) {
  if (!(data instanceof Map)) {
    return data;
  }
  const mapping = new Map<Version, Version>();
  for (const [key, value] of data) {
    const sourceVersion = getVersionForEnumMember(program, key);
    if (sourceVersion !== undefined) {
      mapping.set(sourceVersion, value);
    }
  }
  return mapping;
}

export interface VersionResolution {
  /**
   * Version for the root namespace. `undefined` if not versioned.
   */
  rootVersion: Version | undefined;

  /**
   * Resolved version for all the referenced namespaces.
   */
  versions: Map<Namespace, Version>;
}

/**
 * Resolve the version to use for all namespace for each of the root namespace versions.
 * @param program
 * @param rootNs Root namespace.
 */
export function resolveVersions(program: Program, rootNs: Namespace): VersionResolution[] {
  const versions = getVersion(program, rootNs);
  const dependencies =
    getVersionDependencies(program, rootNs) ??
    new Map<Namespace, Map<Version, Version> | Version>();
  if (!versions) {
    if (dependencies.size === 0) {
      return [{ rootVersion: undefined, versions: new Map() }];
    } else {
      const map = new Map();
      for (const [dependencyNs, version] of dependencies) {
        if (version instanceof Map) {
          const rootNsName = getNamespaceFullName(rootNs);
          const dependencyNsName = getNamespaceFullName(dependencyNs);
          throw new Error(
            `Unexpected error: Namespace ${rootNsName} version dependency to ${dependencyNsName} should be a picked version.`
          );
        }
        map.set(dependencyNs, version);
      }
      return [{ rootVersion: undefined, versions: map }];
    }
  } else {
    return versions.getVersions().map((version) => {
      const resolution: VersionResolution = {
        rootVersion: version,
        versions: new Map<Namespace, Version>(),
      };
      resolution.versions.set(rootNs, version);

      for (const [dependencyNs, versionMap] of dependencies) {
        if (!(versionMap instanceof Map)) {
          const rootNsName = getNamespaceFullName(rootNs);
          const dependencyNsName = getNamespaceFullName(dependencyNs);
          throw new Error(
            `Unexpected error: Namespace ${rootNsName} version dependency to ${dependencyNsName} should be a mapping of version.`
          );
        }
        resolution.versions.set(dependencyNs, versionMap.get(version)!);
      }

      return resolution;
    });
  }
}

/**
 * Represent the set of projections used to project to that version.
 */
interface VersionProjections {
  version: string | undefined;
  projections: ProjectionApplication[];
}

/**
 * @internal
 */
export function indexVersions(program: Program, versions: Map<Namespace, Version>) {
  const versionKey = program.checker.createType<ObjectType>({
    kind: "Object",
    properties: {},
  } as any);
  program.stateMap(key).set(versionKey, versions);
  return versionKey;
}

function getVersionForNamespace(
  program: Program,
  versionKey: ObjectType,
  namespaceType: Namespace
) {
  return program.stateMap(key).get(versionKey)?.get(namespaceType);
}

const key = createStateSymbol("version-index");
export function buildVersionProjections(program: Program, rootNs: Namespace): VersionProjections[] {
  const resolutions = resolveVersions(program, rootNs);
  return resolutions.map((resolution) => {
    if (resolution.versions.size === 0) {
      return { version: undefined, projections: [] };
    } else {
      const versionKey = indexVersions(program, resolution.versions);
      return {
        version: resolution.rootVersion?.value,
        projections: [
          {
            projectionName: "v",
            arguments: [versionKey],
          },
        ],
      };
    }
  });
}

const versionCache = new WeakMap<Type, [Namespace, VersionMap] | []>();
function cacheVersion(key: Type, versions: [Namespace, VersionMap] | []) {
  versionCache.set(key, versions);
  return versions;
}

export function getVersionsForEnum(
  program: Program,
  version: EnumMember
): [Namespace, VersionMap] | [] {
  const namespace = version.enum.namespace;

  if (namespace === undefined) {
    return [];
  }
  const nsVersion = getVersion(program, namespace);

  if (nsVersion === undefined) {
    return [];
  }
  return [namespace, nsVersion];
}

export function getVersions(p: Program, t: Type): [Namespace, VersionMap] | [] {
  if (versionCache.has(t)) {
    return versionCache.get(t)!;
  }

  if (t.kind === "Namespace") {
    const nsVersion = getVersion(p, t);

    if (nsVersion !== undefined) {
      return cacheVersion(t, [t, nsVersion]);
    } else if (t.namespace) {
      return cacheVersion(t, getVersions(p, t.namespace));
    } else {
      return cacheVersion(t, [t, undefined!]);
    }
  } else if (
    t.kind === "Operation" ||
    t.kind === "Interface" ||
    t.kind === "Model" ||
    t.kind === "Union" ||
    t.kind === "Enum"
  ) {
    if (t.namespace) {
      return cacheVersion(t, getVersions(p, t.namespace) || []);
    } else if (t.kind === "Operation" && t.interface) {
      return cacheVersion(t, getVersions(p, t.interface) || []);
    } else {
      return cacheVersion(t, []);
    }
  } else if (t.kind === "ModelProperty") {
    if (t.sourceProperty) {
      return getVersions(p, t.sourceProperty);
    } else if (t.model) {
      return getVersions(p, t.model);
    } else {
      return cacheVersion(t, []);
    }
  } else if (t.kind === "EnumMember") {
    return cacheVersion(t, getVersions(p, t.enum) || []);
  } else if (t.kind === "UnionVariant") {
    return cacheVersion(t, getVersions(p, t.union) || []);
  } else {
    return cacheVersion(t, []);
  }
}

// these decorators take a `versionSource` parameter because not all types can walk up to
// the containing namespace. Model properties, for example.
export function addedAfter(p: Program, type: Type, version: ObjectType) {
  const appliesAt = appliesAtVersion(getAddedOn, p, type, version);
  return appliesAt === null ? false : !appliesAt;
}

export function removedOnOrBefore(p: Program, type: Type, version: ObjectType) {
  const appliesAt = appliesAtVersion(getRemovedOn, p, type, version);
  return appliesAt === null ? false : appliesAt;
}

export function renamedAfter(p: Program, type: Type, version: ObjectType) {
  const appliesAt = appliesAtVersion(getRenamedFromVersion, p, type, version);
  return appliesAt === null ? false : !appliesAt;
}

export function madeOptionalAfter(p: Program, type: Type, version: ObjectType) {
  const appliesAt = appliesAtVersion(getMadeOptionalOn, p, type, version);
  return appliesAt === null ? false : !appliesAt;
}

export function getVersionForEnumMember(program: Program, member: EnumMember): Version | undefined {
  const [, versions] = getVersionsForEnum(program, member);
  return versions?.getVersionForEnumMember(member);
}

/**
 * returns either null, which means unversioned, or true or false depending
 * on whether the change is active or not at that particular version
 */
function appliesAtVersion(
  getMetadataFn: (p: Program, t: Type) => Version | undefined,
  p: Program,
  type: Type,
  versionKey: ObjectType
): boolean | null {
  const [namespace] = getVersions(p, type);
  if (namespace === undefined) {
    return null;
  }
  const version = getVersionForNamespace(
    p,
    versionKey,
    (namespace.projectionBase as Namespace) ?? namespace
  );
  if (version === undefined) {
    return null;
  }

  const appliedOnVersion = getMetadataFn(p, type);
  if (appliedOnVersion === undefined) {
    return null;
  }
  const appliedOnVersionIndex = appliedOnVersion.index;
  if (appliedOnVersionIndex === -1) return null;

  const testVersionIndex = version.index;
  if (testVersionIndex === -1) return null;
  return testVersionIndex >= appliedOnVersionIndex;
}

export interface Version {
  name: string;
  value: string;
  namespace: Namespace;
  enumMember: EnumMember;
  index: number;
}
