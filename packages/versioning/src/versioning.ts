import {
  NamespaceType,
  NumericLiteralType,
  Program,
  ProjectionApplication,
  StringLiteralType,
  Type,
} from "@cadl-lang/compiler";
const addedOnKey = Symbol();
const removedOnKey = Symbol();
const versionsKey = Symbol();
const versionDependencyKey = Symbol();
const renamedFromKey = Symbol();
const madeOptionalKey = Symbol();

export function $added(p: Program, t: Type, v: StringLiteralType | NumericLiteralType) {
  p.stateMap(addedOnKey).set(t, v);
}
export function $removed(p: Program, t: Type, v: StringLiteralType | NumericLiteralType) {
  p.stateMap(removedOnKey).set(t, v);
}
export function $renamedFrom(
  p: Program,
  t: Type,
  v: StringLiteralType | NumericLiteralType,
  oldName: StringLiteralType
) {
  const record = { v: v, oldName: oldName };
  p.stateMap(renamedFromKey).set(t, record);
}

export function $madeOptional(p: Program, t: Type, v: string | boolean) {
  p.stateMap(madeOptionalKey).set(t, v);
}

export function getRenamedFromVersion(p: Program, t: Type) {
  return p.stateMap(renamedFromKey).get(t)?.v ?? -1;
}
export function getRenamedFromOldName(p: Program, t: Type) {
  return p.stateMap(renamedFromKey).get(t)?.oldName ?? "";
}
export function getAddedOn(p: Program, t: Type) {
  return p.stateMap(addedOnKey).get(t) ?? -1;
}
export function getRemovedOn(p: Program, t: Type) {
  return p.stateMap(removedOnKey).get(t) ?? Infinity;
}

export function getMadeOptionalOn(p: Program, t: Type) {
  return p.stateMap(madeOptionalKey).get(t) ?? -1;
}

export function $versioned(p: Program, t: Type, v: Type) {
  const versions = [];

  switch (v.kind) {
    case "String":
    case "Number":
      versions.push(v.value);
      break;
    case "Union":
      for (const variant of v.options) {
        if (variant.kind === "String" || variant.kind === "Number") {
          versions.push(variant.value);
        }
      }
      break;
  }

  p.stateMap(versionsKey).set(t, versions);
}

function getVersion(p: Program, t: Type) {
  return p.stateMap(versionsKey).get(t);
}

export function $versionedDependency(
  p: Program,
  referenceNamespace: Type,
  targetNamespace: Type,
  versionRecord: Type
) {
  if (referenceNamespace.kind !== "Namespace") {
    // TODO:
    throw new Error("must be added to NS");
  }
  if (targetNamespace.kind !== "Namespace") {
    // TODO:
    throw new Error("must be added to NS");
  }

  if (versionRecord.kind !== "Model") {
    throw new Error(
      "Versions must be an anonymous model mapping local versions to dependency versions"
    );
  }

  let state = p.stateMap(versionDependencyKey).get(referenceNamespace) as Map<
    NamespaceType,
    Map<string, string>
  >;

  if (!state) {
    state = new Map();
    p.stateMap(versionDependencyKey).set(referenceNamespace, state);
  }

  let versionMap = state.get(targetNamespace);
  if (!versionMap) {
    versionMap = new Map();
    state.set(targetNamespace, versionMap);
  }

  for (const [name, prop] of versionRecord.properties) {
    if (prop.type.kind !== "String") {
      throw new Error("must be string");
    }
    versionMap.set(name, prop.type.value);
  }
}

export function getVersionDependencies(
  p: Program,
  namespace: NamespaceType
): Map<NamespaceType, Map<string, string>> | undefined {
  return p.stateMap(versionDependencyKey).get(namespace);
}

interface VersionRecord {
  version: string | undefined;
  projections: ProjectionApplication[];
}

export function getVersionRecords(program: Program, rootNs: NamespaceType): VersionRecord[] {
  const versions = getVersions(program, rootNs);
  if (!versions) {
    return [{ version: undefined, projections: [] }];
  }
  const records: VersionRecord[] = [];
  const dependencies = getVersionDependencies(program, rootNs) ?? new Map();
  for (const version of versions) {
    // TODO: find versioned dependencies
    const projections = [{ scope: rootNs, projectionName: "v", arguments: [version] }];

    for (const [dependencyNs, versionMap] of dependencies) {
      if (!versionMap.has(version)) continue;
      projections.push({
        scope: dependencyNs,
        projectionName: "v",
        arguments: [versionMap.get(version!)],
      });
    }

    records.push({ version: version, projections });
  }

  return records;
}

export function getVersions(p: Program, t: Type): string[] {
  if (t.kind === "Namespace") {
    const nsVersion = getVersion(p, t);

    if (nsVersion !== undefined) {
      return nsVersion;
    } else if (t.namespace) {
      return getVersions(p, t.namespace);
    } else {
      return [];
    }
  } else if (
    t.kind === "Operation" ||
    t.kind === "Interface" ||
    t.kind === "Model" ||
    t.kind === "Union" ||
    t.kind === "Enum"
  ) {
    if (t.namespace) {
      return getVersions(p, t.namespace!) || [];
    } else if (t.kind === "Operation" && t.interface) {
      return getVersions(p, t.interface) || [];
    } else {
      return [];
    }
  } else {
    return [];
  }
}

// these decorators take a `versionSource` parameter because not all types can walk up to
// the containing namespace. Model properties, for example.
export function addedAfter(p: Program, type: Type, version: string, versionSource?: Type) {
  const appliesAt = appliesAtVersion(getAddedOn, p, type, version, versionSource);
  return appliesAt === null ? false : !appliesAt;
}

export function removedOnOrBefore(p: Program, type: Type, version: string, versionSource?: Type) {
  const appliesAt = appliesAtVersion(getRemovedOn, p, type, version, versionSource);
  return appliesAt === null ? false : appliesAt;
}

export function renamedAfter(p: Program, type: Type, version: string, versionSource?: Type) {
  const appliesAt = appliesAtVersion(getRenamedFromVersion, p, type, version, versionSource);
  return appliesAt === null ? false : !appliesAt;
}

export function madeOptionalAfter(p: Program, type: Type, version: string, versionSource?: Type) {
  const appliesAt = appliesAtVersion(getMadeOptionalOn, p, type, version, versionSource);
  return appliesAt === null ? false : !appliesAt;
}

/**
 * returns either null, which means unversioned, or true or false dependnig
 * on whether the change is active or not at that particular version
 */
function appliesAtVersion(
  getMetadataFn: (p: Program, t: Type) => string,
  p: Program,
  type: Type,
  version: string,
  versionSource?: Type
) {
  if (typeof version !== "string") {
    throw new TypeError("version must be a string");
  }

  const versions = getVersions(p, versionSource ?? type);
  if (!versions || versions.length === 0) {
    return null;
  }
  const appliedOnVersion = getMetadataFn(p, type);
  const appliedOnVersionIndex = versions.indexOf(appliedOnVersion);
  if (appliedOnVersionIndex === -1) return null;
  const testVersionIndex = versions.indexOf(version);
  if (testVersionIndex === -1) return null;

  return testVersionIndex >= appliedOnVersionIndex;
}

export function versionCompare(p: Program, versionSource: Type, v1: string, v2: string): number {
  const versions = getVersions(p, versionSource);
  if (!versions || versions.length === 0) {
    return 0;
  }
  const v1Index = versions.indexOf(v1);
  if (v1Index === -1) return 0;
  const v2Index = versions.indexOf(v2);
  if (v2Index === -1) return 0;

  return v1Index - v2Index;
}
