import type { EnumMember, Namespace } from "@typespec/compiler";

export interface Version {
  name: string;
  value: string;
  namespace: Namespace;
  enumMember: EnumMember;
  index: number;
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
