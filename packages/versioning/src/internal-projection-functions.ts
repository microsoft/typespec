import type { ObjectType, Program, Type } from "@typespec/compiler";
import {
  getMadeOptionalOn,
  getMadeRequiredOn,
  getRenamedFrom,
  getReturnTypeChangedFrom,
  getTypeChangedFrom,
} from "./decorators.js";
import { VersioningStateKeys } from "./lib.js";
import { TimelineMoment, VersioningTimeline } from "./versioning-timeline.js";
import { Availability, getAvailabilityMapInTimeline } from "./versioning.js";

export const namespace = "TypeSpec.Versioning";

function getVersioningState(
  program: Program,
  versionKey: ObjectType,
): {
  timeline: VersioningTimeline;
  projectingMoment: TimelineMoment;
} {
  return program.stateMap(VersioningStateKeys.versionIndex).get(versionKey);
}

/**
 * @returns get old name if applicable.
 */
export function getNameAtVersion(p: Program, t: Type, versionKey: ObjectType): string {
  const versioningState = getVersioningState(p, versionKey);

  const allValues = getRenamedFrom(p, t);
  if (!allValues) return "";

  for (const val of allValues) {
    if (versioningState.timeline.isBefore(versioningState.projectingMoment, val.version)) {
      return val.oldName;
    }
  }
  return "";
}

/**
 * @returns get old type if applicable.
 */
export function getTypeBeforeVersion(
  p: Program,
  t: Type,
  versionKey: ObjectType,
): Type | undefined {
  const versioningState = getVersioningState(p, versionKey);

  const map = getTypeChangedFrom(p, t);
  if (!map) return undefined;

  for (const [changedAtVersion, oldType] of map) {
    if (versioningState.timeline.isBefore(versioningState.projectingMoment, changedAtVersion)) {
      return oldType;
    }
  }
  return undefined;
}

/**
 * @returns get old type if applicable.
 */
export function getReturnTypeBeforeVersion(p: Program, t: Type, versionKey: ObjectType): any {
  const versioningState = getVersioningState(p, versionKey);

  const map = getReturnTypeChangedFrom(p, t);
  if (!map) return "";

  for (const [changedAtVersion, val] of map) {
    if (versioningState.timeline.isBefore(versioningState.projectingMoment, changedAtVersion)) {
      return val;
    }
  }
  return "";
}

export function madeOptionalAfter(program: Program, type: Type, versionKey: ObjectType): boolean {
  const versioningState = getVersioningState(program, versionKey);

  const madeOptionalAtVersion = getMadeOptionalOn(program, type);
  if (madeOptionalAtVersion === undefined) {
    return false;
  }
  return versioningState.timeline.isBefore(versioningState.projectingMoment, madeOptionalAtVersion);
}

export function madeRequiredAfter(program: Program, type: Type, versionKey: ObjectType): boolean {
  const versioningState = getVersioningState(program, versionKey);

  const madeRequiredAtVersion = getMadeRequiredOn(program, type);
  if (madeRequiredAtVersion === undefined) {
    return false;
  }

  return versioningState.timeline.isBefore(versioningState.projectingMoment, madeRequiredAtVersion);
}

export function existsAtVersion(p: Program, type: Type, versionKey: ObjectType): boolean {
  const versioningState = getVersioningState(p, versionKey);
  // if unversioned then everything exists

  const availability = getAvailabilityMapInTimeline(p, type, versioningState.timeline);
  if (!availability) return true;
  const isAvail = availability.get(versioningState.projectingMoment)!;
  return isAvail === Availability.Added || isAvail === Availability.Available;
}

export function hasDifferentNameAtVersion(p: Program, type: Type, version: ObjectType): boolean {
  return getNameAtVersion(p, type, version) !== "";
}

export function hasDifferentTypeAtVersion(p: Program, type: Type, version: ObjectType): boolean {
  return getTypeBeforeVersion(p, type, version) !== undefined;
}

export function hasDifferentReturnTypeAtVersion(
  p: Program,
  type: Type,
  version: ObjectType,
): boolean {
  return getReturnTypeBeforeVersion(p, type, version) !== "";
}
