import { createTypeSpecLibrary, JSONSchemaType, paramMessage } from "@typespec/compiler";

export interface DevOptions {
  "generate-code-model"?: boolean;
  debug?: boolean;
  loglevel?: "off" | "debug" | "info" | "warn" | "error";
  "java-temp-dir"?: string; // working directory for java codegen, e.g. transformed code-model file
}

export interface EmitterOptions {
  namespace?: string;
  "package-dir"?: string;

  flavor?: string;

  "service-name"?: string;
  "service-versions"?: string[];

  "skip-special-headers"?: string[];

  "generate-samples"?: boolean;
  "generate-tests"?: boolean;

  "enable-sync-stack"?: boolean;
  "stream-style-serialization"?: boolean;
  "use-object-for-unknown"?: boolean;

  "partial-update"?: boolean;
  "models-subpackage"?: string;
  "custom-types"?: string;
  "custom-types-subpackage"?: string;
  "customization-class"?: string;
  polling?: any;

  "group-etag-headers"?: boolean;

  "enable-subclient"?: boolean;

  "advanced-versioning"?: boolean;
  "api-version"?: string;
  "service-version-exclude-preview"?: boolean;

  "dev-options"?: DevOptions;
}

const EmitterOptionsSchema: JSONSchemaType<EmitterOptions> = {
  type: "object",
  additionalProperties: true,
  properties: {
    namespace: { type: "string", nullable: true },
    "package-dir": { type: "string", nullable: true },

    flavor: { type: "string", nullable: true },

    // service
    "service-name": { type: "string", nullable: true },
    "service-versions": { type: "array", items: { type: "string" }, nullable: true },

    // header
    "skip-special-headers": { type: "array", items: { type: "string" }, nullable: true },

    // sample and test
    "generate-samples": { type: "boolean", nullable: true, default: true },
    "generate-tests": { type: "boolean", nullable: true, default: true },

    "enable-sync-stack": { type: "boolean", nullable: true, default: true },
    "stream-style-serialization": { type: "boolean", nullable: true, default: true },
    "use-object-for-unknown": { type: "boolean", nullable: true, default: false },

    // customization
    "partial-update": { type: "boolean", nullable: true, default: false },
    "models-subpackage": { type: "string", nullable: true },
    "custom-types": { type: "string", nullable: true },
    "custom-types-subpackage": { type: "string", nullable: true },
    "customization-class": { type: "string", nullable: true },
    polling: { type: "object", additionalProperties: true, nullable: true },

    "group-etag-headers": { type: "boolean", nullable: true },

    "enable-subclient": { type: "boolean", nullable: true, default: false },

    "advanced-versioning": { type: "boolean", nullable: true, default: false },
    "api-version": { type: "string", nullable: true },
    "service-version-exclude-preview": { type: "boolean", nullable: true, default: false },

    "dev-options": { type: "object", additionalProperties: true, nullable: true },
  },
  required: [],
};

export const $lib = createTypeSpecLibrary({
  name: "@typespec/http-client-java",
  diagnostics: {
    // error
    "unknown-error": {
      severity: "error",
      messages: {
        default: paramMessage`An unknown error occurred. '${"errorMessage"}'`,
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

    // warning
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
  },
  emitter: {
    options: EmitterOptionsSchema as JSONSchemaType<EmitterOptions>,
  },
} as const);

export const { name: LibName, reportDiagnostic, createDiagnostic, getTracer } = $lib;
