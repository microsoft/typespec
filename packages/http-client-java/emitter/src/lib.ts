import { createTypeSpecLibrary, paramMessage } from "@typespec/compiler";
import { EmitterOptionsSchema, LIB_NAME } from "./options.js";

export const $lib = createTypeSpecLibrary({
  name: LIB_NAME,
  diagnostics: {
    // error
    "unknown-error": {
      severity: "error",
      messages: {
        default: paramMessage`An unknown error occurred. ${"errorMessage"}`,
      },
    },
    "generator-error": {
      severity: "error",
      messages: {
        default: paramMessage`${"errorMessage"}`,
      },
    },
    "invalid-java-sdk-dependency": {
      severity: "error",
      messages: {
        default:
          "Java Development Kit (JDK) is not found in PATH. Please install JDK 17 or above. Microsoft Build of OpenJDK can be downloaded from https://learn.microsoft.com/java/openjdk/download",
        jdkVersion: paramMessage`Java Development Kit (JDK) in PATH is version '${"javaVersion"}'. Please install JDK 17 or above. Microsoft Build of OpenJDK can be downloaded from https://learn.microsoft.com/java/openjdk/download`,
        maven:
          "Apache Maven is not found in PATH. Apache Maven can be downloaded from https://maven.apache.org/download.cgi",
      },
    },
    "multiple-server-not-supported": {
      severity: "error",
      messages: {
        default: "Multiple server on client is not supported.",
      },
    },
    "invalid-api-version": {
      severity: "error",
      messages: {
        default: paramMessage`Invalid api-version option: '${"apiVersion"}'. The value should be an api-version, 'latest', or 'all'.`,
      },
    },
    "unrecognized-type": {
      severity: "error",
      messages: {
        default: paramMessage`Unrecognized type, kind '${"typeKind"}'. Updating the version of the emitter may resolve this issue.`,
        unionType: paramMessage`Unrecognized type for Union, kind '${"typeKind"}'.`,
        multipartFormData: paramMessage`Unrecognized type for multipart form data, kind '${"typeKind"}'.`,
      },
    },
    "empty-name": {
      severity: "error",
      messages: {
        default: "Name from TCGC is empty.",
      },
    },

    // warning
    "generator-warning": {
      severity: "warning",
      messages: {
        default: paramMessage`${"warningMessage"}`,
      },
    },
    "no-service": {
      severity: "warning",
      messages: {
        default: "No service found in this TypeSpec. Client will not be generated.",
      },
    },
    "auth-scheme-not-supported": {
      severity: "warning",
      messages: {
        oauth2Unbranded:
          "OAuth2 auth scheme is not supported in unbranded. Client builder will fallback to use KeyCredential.",
        apiKeyLocation: "ApiKey auth is currently only supported for ApiKeyLocation.header.",
        basicAuthBranded: paramMessage`HTTP auth with '${"scheme"}' scheme is not supported for Azure. Azure service should use Oauth2Auth or ApiKeyAuth.`,
      },
    },
    "protocol-api-not-generated": {
      severity: "warning",
      messages: {
        multipartFormData: paramMessage`Operation '${"operationName"}' is of content-type 'multipart/form-data'. Protocol API is not usable and hence not generated.`,
      },
    },
    "convenience-api-not-generated": {
      severity: "warning",
      messages: {
        multipleContentType: paramMessage`Operation '${"operationName"}' can be invoked with multiple content-type. It is difficult to form a correct method signature for convenience API, and hence the convenience API is not generated.`,
        jsonMergePatch: paramMessage`Operation '${"operationName"}' is of content-type 'application/merge-patch+json'. Enable 'stream-style-serialization' in emitter options.`,
      },
    },
    "header-parameter-format-not-supported": {
      severity: "warning",
      messages: {
        default: paramMessage`Header parameter format '${"format"}' is not supported.`,
      },
    },
    "unknown-encode": {
      severity: "warning",
      messages: {
        default: paramMessage`Encode '${"encode"}' is not supported.`,
      },
    },
    "invalid-java-namespace": {
      severity: "warning",
      messages: {
        default: paramMessage`Namespace '${"namespace"}' contains reserved Java keywords, replaced it with '${"processedNamespace"}'.`,
      },
    },
  },
  emitter: {
    options: EmitterOptionsSchema,
  },
} as const);

export const { name: LibName, reportDiagnostic, createDiagnostic, getTracer } = $lib;
