import { createCadlLibrary, paramMessage } from "@cadl-lang/compiler";

const libDef = {
  name: "@cadl-lang/versioning",
  diagnostics: {
    "version-must-be-string": {
      severity: "error",
      messages: {
        default: `Versions must be strings`,
      },
    },
    "version-not-found": {
      severity: "error",
      messages: {
        default: paramMessage`The provided version ${"version"} wasn't declared on any parent namespaces.`,
      },
    },
    "versioned-not-on-namespace": {
      severity: "error",
      messages: {
        default: `The versioned decorator must be applied to a namespace`,
      },
    },
    "versioned-dependency-record-not-model": {
      severity: "error",
      messages: {
        default: paramMessage`The versionedDependency decorator must provide a model mapping local versions to dependency '${"dependency"}' versions`,
      },
    },
    "versioned-dependency-not-string": {
      severity: "error",
      messages: {
        default: paramMessage`The versionedDependency decorator must provide a version of the dependency '${"dependency"}'.`,
      },
    },
    "using-versioned-library": {
      severity: "error",
      messages: {
        default: paramMessage`Namespace '${"sourceNs"}' is referencing types from versioned namespace '${"targetNs"}' but didn't specify which versions with @versionedDependency.`,
      },
    },
  },
} as const;
export const { reportDiagnostic } = createCadlLibrary(libDef);
