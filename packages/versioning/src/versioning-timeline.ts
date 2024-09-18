import { compilerAssert, getTypeName, type Namespace, type Program } from "@typespec/compiler";
import type { Version } from "./types.js";
import { getVersions } from "./versioning.js";

/**
 * Represent a timeline of all the version involved in the versioning of a namespace
 *
 * @example
 * Given the following namespaces with their versions
 * ```
 * Library:
 *  l1
 *  l2
 *  l3
 *  l4
 *
 * Service:
 *  v1  -> (using) l1
 *  v2  -> (using) l3
 *  v3  -> (using) l3
 * ```
 *
 * This would be the data passed to the constructor
 * ```ts
 * new VersioningTimeline(program, [
 *   new Map([[serviceNs, v1], [libraryNs, l1]]),
 *   new Map([[serviceNs, v2], [libraryNs, l3]]),
 *   new Map([[serviceNs, v3], [libraryNs, l3]]),
 * ])
 * ```
 *
 * The following timeline is going to be represented
 *
 * | Service | Library |
 * |---------|---------|
 * |   v1    |   l1    |
 * |         |   l2    |
 * |   v2    |   l3    |
 * |   v3    |   l3    |
 * |         |   l4    |
 */
export class VersioningTimeline {
  #namespaces: Namespace[];
  #timeline: TimelineMoment[];
  #momentIndex: Map<TimelineMoment, number>;
  #versionIndex: Map<Version, number>;

  constructor(program: Program, resolutions: Map<Namespace, Version>[]) {
    const indexedVersions = new Set<Version>();
    const namespaces = new Set<Namespace>();
    const timeline = (this.#timeline = resolutions.map((x) => new TimelineMoment(x)));
    for (const resolution of resolutions) {
      for (const [namespace, version] of resolution.entries()) {
        indexedVersions.add(version);
        namespaces.add(namespace);
      }
    }
    this.#namespaces = [...namespaces];

    function findIndexToInsert(version: Version): number {
      for (const [index, moment] of timeline.entries()) {
        const versionAtMoment = moment.getVersion(version.namespace);
        if (versionAtMoment && version.index < versionAtMoment.index) {
          return index;
        }
      }
      return -1;
    }

    for (const namespace of namespaces) {
      const [, versions] = getVersions(program, namespace);
      if (versions === undefined) {
        continue;
      }

      for (const version of versions.getVersions()) {
        if (!indexedVersions.has(version)) {
          indexedVersions.add(version);
          const index = findIndexToInsert(version);
          const newMoment = new TimelineMoment(new Map([[version.namespace, version]]));
          if (index === -1) {
            timeline.push(newMoment);
          } else {
            timeline.splice(index, 0, newMoment);
          }
        }
      }
    }

    this.#versionIndex = new Map();
    this.#momentIndex = new Map();
    for (const [index, moment] of timeline.entries()) {
      this.#momentIndex.set(moment, index);

      for (const version of moment.versions()) {
        if (!this.#versionIndex.has(version)) {
          this.#versionIndex.set(version, index);
        }
      }
    }
  }

  prettySerialize() {
    const hSep = "-".repeat(this.#namespaces.length * 13 + 1);
    const content = this.#timeline
      .map((moment) => {
        return (
          "| " +
          this.#namespaces
            .map((x) => (moment.getVersion(x)?.name ?? "").padEnd(10, " "))
            .join(" | ") +
          " |"
        );
      })
      .join(`\n${hSep}\n`);
    return ["", hSep, content, hSep].join("\n");
  }

  get(version: Version): TimelineMoment {
    const index = this.getIndex(version);
    if (index === -1) {
      if (version instanceof TimelineMoment) {
        compilerAssert(false, `Timeline moment "${version?.name}" should have been resolved`);
      } else {
        compilerAssert(
          false,
          `Version "${version?.name}" from ${getTypeName(
            version.namespace,
          )} should have been resolved. ${this.prettySerialize()}`,
        );
      }
    }
    return this.#timeline[index];
  }

  /**
   * Return index in the timeline that this version points to
   * Returns -1 if version is not found.
   */
  getIndex(version: Version | TimelineMoment): number {
    const index =
      version instanceof TimelineMoment
        ? this.#momentIndex.get(version)
        : this.#versionIndex.get(version);
    if (index === undefined) {
      return -1;
    }
    return index;
  }

  /**
   * Return true if {@link isBefore} is before {@link base}
   * @param isBefore
   * @param base
   */
  isBefore(isBefore: Version | TimelineMoment, base: Version | TimelineMoment): boolean {
    const isBeforeIndex = this.getIndex(isBefore);
    const baseIndex = this.getIndex(base);
    return isBeforeIndex < baseIndex;
  }

  first(): TimelineMoment {
    return this.#timeline[0];
  }

  [Symbol.iterator](): IterableIterator<TimelineMoment> {
    return this.#timeline[Symbol.iterator]();
  }
  entries(): IterableIterator<[number, TimelineMoment]> {
    return this.#timeline.entries();
  }
}

export class TimelineMoment {
  readonly name: string;
  #versionMap: Map<Namespace, Version>;

  public constructor(versionMap: Map<Namespace, Version>) {
    this.#versionMap = versionMap;
    this.name = versionMap.values().next().value?.name ?? "";
  }

  getVersion(namespace: Namespace): Version | undefined {
    return this.#versionMap.get(namespace);
  }

  versions(): IterableIterator<Version> {
    return this.#versionMap.values();
  }
}
