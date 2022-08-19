import { createCadlLibrary, paramMessage } from "@cadl-lang/compiler";

const libDef = {
  name: "@cadl-lang/versioning",
  diagnostics: {
    "versioned-dependency-tuple": {
      severity: "error",
      messages: {
        default: `Versioned dependency mapping must be a tuple [SourceVersion, TargetVersion].`,
      },
    },
    "versioned-dependency-tuple-enum-member": {
      severity: "error",
      messages: {
        default: `Versioned dependency mapping must be between enum members.`,
      },
    },
    "versioned-dependency-same-namespace": {
      severity: "error",
      messages: {
        default: `Versioned dependency mapping must all point to the same namespace but 2 versions have different namespaces '${"namespace1"}' and '${"namespace2"}'.`,
      },
    },
    "versioned-dependency-record-not-mapping": {
      severity: "error",
      messages: {
        default: paramMessage`The versionedDependency decorator must provide a model mapping local versions to dependency '${"dependency"}' versions`,
      },
    },
    "versioned-dependency-not-picked": {
      severity: "error",
      messages: {
        default: paramMessage`The versionedDependency decorator must provide a version of the dependency '${"dependency"}'.`,
      },
    },
    "version-not-found": {
      severity: "error",
      messages: {
        default: paramMessage`The provided version '${"version"}' from '${"enumName"}' is not declared as a version enum. Use '@versioned(${"enumName"})' on the containing namespace.`,
      },
    },
    "using-versioned-library": {
      severity: "error",
      messages: {
        default: paramMessage`Namespace '${"sourceNs"}' is referencing types from versioned namespace '${"targetNs"}' but didn't specify which versions with @versionedDependency.`,
      },
    },
    "incompatible-versioned-reference": {
      severity: "error",
      messages: {
        default: paramMessage`'${"sourceName"}' is referencing versioned type '${"targetName"}' but is not versioned itself.`,
        addedAfter: paramMessage`'${"sourceName"}' was added on version '${"sourceAddedOn"}' but referencing type '${"targetName"}' added in version '${"targetAddedOn"}'.`,
        dependentAddedAfter: paramMessage`'${"sourceName"}' was added on version '${"sourceAddedOn"}' but contains type '${"targetName"}' added in version '${"targetAddedOn"}'.`,
        removedBefore: paramMessage`'${"sourceName"}' was removed on version '${"sourceRemovedOn"}' but referencing type '${"targetName"}' removed in version '${"targetRemovedOn"}'.`,
        dependentRemovedBefore: paramMessage`'${"sourceName"}' was removed on version '${"sourceRemovedOn"}' but contains type '${"targetName"}' removed in version '${"targetRemovedOn"}'.`,
        versionedDependencyAddedAfter: paramMessage`'${"sourceName"}' is referencing type '${"targetName"}' added in version '${"targetAddedOn"}' but version used is ${"dependencyVersion"}.`,
        versionedDependencyRemovedBefore: paramMessage`'${"sourceName"}' is referencing type '${"targetName"}' added in version '${"targetAddedOn"}' but version used is ${"dependencyVersion"}.`,
      },
    },
  },
} as const;
export const { reportDiagnostic, createStateSymbol } = createCadlLibrary(libDef);
