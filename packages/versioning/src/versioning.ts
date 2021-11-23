import { NumericLiteralType, Program, StringLiteralType, Type } from "@cadl-lang/compiler";
const addedOnKey = Symbol();
const removedOnKey = Symbol();
const versionsKey = Symbol();
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

export function getVersions(p: Program, t: Type): (string | number)[] {
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
    } else {
      return [];
    }
  } else {
    return [];
  }
}

// these decorators take a `versionSource` parameter because not all types can walk up to
// the containing namespace. Model properties, for example.
export function addedAfter(p: Program, type: Type, version: string | number, versionSource?: Type) {
  const appliesAt = appliesAtVersion(getAddedOn, p, type, version, versionSource);
  return appliesAt === null ? false : !appliesAt;
}

export function removedOnOrBefore(
  p: Program,
  type: Type,
  version: string | number,
  versionSource?: Type
) {
  const appliesAt = appliesAtVersion(getRemovedOn, p, type, version, versionSource);
  return appliesAt === null ? false : appliesAt;
}

export function renamedAfter(
  p: Program,
  type: Type,
  version: string | number,
  versionSource?: Type
) {
  const appliesAt = appliesAtVersion(getRenamedFromVersion, p, type, version, versionSource);
  return appliesAt === null ? false : !appliesAt;
}

export function madeOptionalAfter(
  p: Program,
  type: Type,
  version: string | number,
  versionSource?: Type
) {
  const appliesAt = appliesAtVersion(getMadeOptionalOn, p, type, version, versionSource);
  return appliesAt === null ? false : !appliesAt;
}

/**
 * returns either null, which means unversioned, or true or false dependnig
 * on whether the change is active or not at that particular version
 */
function appliesAtVersion(
  getMetadataFn: (p: Program, t: Type) => string | number,
  p: Program,
  type: Type,
  version: string | number,
  versionSource?: Type
) {
  if (typeof version !== "string" && typeof version !== "number") {
    throw new TypeError("version must be a string or number");
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
