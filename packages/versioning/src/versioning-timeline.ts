import { compilerAssert, Namespace, Program } from "@typespec/compiler";
import { getVersions, Version } from "./versioning.js";

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
  #versionIndex: Map<Version, number>;

  constructor(program: Program, resolutions: Map<Namespace, Version>[]) {
    const indexedVersions = new Set<Version>();
    const namespaces = new Set<Namespace>();
    const timeline = resolutions.map((x) => new TimelineMoment(x));
    for (const resolution of resolutions) {
      for (const [namespace, version] of resolution.entries()) {
        indexedVersions.add(version);
        namespaces.add(namespace);
      }
    }

    for (const namespace of namespaces) {
      const [, versions] = getVersions(program, namespace);
      if (versions === undefined) {
        continue;
      }

      for (const version of versions.getVersions()) {
        if (!indexedVersions.has(version)) {
          indexedVersions.add(version);

          timeline.push(new TimelineMoment(new Map([[version.namespace, version]])));
        }
      }
    }

    // Order the timeline

    for (const namespace of namespaces) {
      timeline.sort((a, b) => {
        const aVersion = a.getVersion(namespace);
        const bVersion = b.getVersion(namespace);

        return aVersion === undefined || bVersion === undefined
          ? 0
          : aVersion.index - bVersion.index;
      });
    }
    this.#timeline = timeline;
    this.#namespaces = [...namespaces];

    this.#versionIndex = new Map();
    for (const [index, moment] of timeline.entries()) {
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
    return this.#timeline[index];
  }

  /**
   * Return index in the timeline that this version points to
   */
  getIndex(version: Version): number {
    const index = this.#versionIndex.get(version);
    compilerAssert(
      index !== undefined,
      `Version "${version?.name}" from ${version.namespace.name}  should have been resolved`
    );
    return index;
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
  #versionMap: Map<Namespace, Version>;

  public constructor(versionMap: Map<Namespace, Version>) {
    this.#versionMap = versionMap;
  }

  getVersion(namespace: Namespace): Version | undefined {
    return this.#versionMap.get(namespace);
  }

  versions(): IterableIterator<Version> {
    return this.#versionMap.values();
  }
}
