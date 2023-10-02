import { createTypeSpecLibrary, paramMessage } from "@typespec/compiler";

const libDef = {
  name: "@typespec/versioning",
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
    "version-duplicate": {
      severity: "error",
      messages: {
        default: paramMessage`Multiple versions from '${"name"}' resolve to the same value. Version enums must resolve to unique values.`,
      },
    },
    "using-versioned-library": {
      severity: "error",
      messages: {
        default: paramMessage`Namespace '${"sourceNs"}' is referencing types from versioned namespace '${"targetNs"}' but didn't specify which versions with @useDependency.`,
      },
    },
    "invalid-renamed-from-value": {
      severity: "error",
      messages: {
        default: "@renamedFrom.oldName cannot be empty string.",
      },
    },
    "no-service-fixed-version": {
      severity: "error",
      messages: {
        default: paramMessage`Namespace '${"name"}' cannot specify a fixed service version with @service({version: ${"version"}}) while using @versioned. Remove the version argument from @service.`,
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
        versionedDependencyRemovedBefore: paramMessage`'${"sourceName"}' is referencing type '${"targetName"}' removed in version '${"targetAddedOn"}' but version used is ${"dependencyVersion"}.`,
        doesNotExist: paramMessage`'${"sourceName"}' is referencing type '${"targetName"}' which does not exist in version '${"version"}'.`,
      },
    },
    "incompatible-versioned-namespace-use-dependency": {
      severity: "error",
      messages: {
        default:
          "The useDependency decorator can only be used on a Namespace if the namespace is unversioned. For versioned namespaces, put the useDependency decorator on the version enum members.",
      },
    },
    "made-optional-not-optional": {
      severity: "error",
      messages: {
        default: paramMessage`Property '${"name"}' marked with @madeOptional but is required. Should be '${"name"}?'`,
      },
    },
    "renamed-duplicate-property": {
      severity: "error",
      messages: {
        default: paramMessage`Property '${"name"}' marked with '@renamedFrom' conflicts with existing property in version ${"version"}.`,
      },
    },
  },
} as const;
export const { reportDiagnostic, createStateSymbol } = createTypeSpecLibrary(libDef);
