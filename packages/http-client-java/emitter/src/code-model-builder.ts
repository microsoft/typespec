import {
  AnySchema,
  ApiVersion,
  ArraySchema,
  BinaryResponse,
  BinarySchema,
  BooleanSchema,
  ByteArraySchema,
  ChoiceValue,
  DateSchema,
  DateTimeSchema,
  DictionarySchema,
  Discriminator,
  GroupProperty,
  GroupSchema,
  HttpHeader,
  HttpParameter,
  ImplementationLocation,
  KeySecurityScheme,
  Language,
  License,
  Metadata,
  NumberSchema,
  OAuth2SecurityScheme,
  ObjectSchema,
  OperationGroup,
  Parameter,
  ParameterLocation,
  Property,
  Relations,
  Response,
  Schema,
  SchemaResponse,
  SchemaType,
  Security,
  SecurityScheme,
  SerializationStyle,
  StringSchema,
  TimeSchema,
  UnixTimeSchema,
  UriSchema,
  VirtualParameter,
} from "@autorest/codemodel";
import { KnownMediaType } from "@azure-tools/codegen";
import {
  SdkArrayType,
  SdkBodyModelPropertyType,
  SdkBodyParameter,
  SdkBuiltInType,
  SdkClientType,
  SdkConstantType,
  SdkContext,
  SdkDateTimeType,
  SdkDictionaryType,
  SdkDurationType,
  SdkEnumType,
  SdkEnumValueType,
  SdkHeaderParameter,
  SdkHttpErrorResponse,
  SdkHttpOperation,
  SdkHttpResponse,
  SdkLroPagingServiceMethod,
  SdkLroServiceMethod,
  SdkModelPropertyType,
  SdkModelType,
  SdkPathParameter,
  SdkQueryParameter,
  SdkServiceMethod,
  SdkType,
  SdkUnionType,
  createSdkContext,
  getAllModels,
  getHttpOperationParameter,
  isSdkBuiltInKind,
  isSdkIntKind,
} from "@azure-tools/typespec-client-generator-core";
import {
  EmitContext,
  Interface,
  Namespace,
  NoTarget,
  Operation,
  Program,
  Type,
  TypeNameOptions,
  Union,
  getDoc,
  getNamespaceFullName,
  getOverloadedOperation,
  getSummary,
  isArrayModelType,
  isRecordModelType,
  listServices,
} from "@typespec/compiler";
import {
  Authentication,
  HttpStatusCodeRange,
  HttpStatusCodesEntry,
  Visibility,
  getAuthentication,
} from "@typespec/http";
import { getSegment } from "@typespec/rest";
import { getAddedOnVersions } from "@typespec/versioning";
import { fail } from "assert";
import pkg from "lodash";
import {
  Client as CodeModelClient,
  EncodedSchema,
  PageableContinuationToken,
} from "./common/client.js";
import { CodeModel } from "./common/code-model.js";
import { LongRunningMetadata } from "./common/long-running-metadata.js";
import { Operation as CodeModelOperation, ConvenienceApi, Request } from "./common/operation.js";
import { ChoiceSchema, SealedChoiceSchema } from "./common/schemas/choice.js";
import { ConstantSchema, ConstantValue } from "./common/schemas/constant.js";
import { OrSchema } from "./common/schemas/relationship.js";
import { DurationSchema } from "./common/schemas/time.js";
import { SchemaContext, SchemaUsage } from "./common/schemas/usage.js";
import { createPollOperationDetailsSchema, getFileDetailsSchema } from "./external-schemas.js";
import { createDiagnostic, reportDiagnostic } from "./lib.js";
import { ClientContext } from "./models.js";
import {
  CONTENT_TYPE_KEY,
  ORIGIN_API_VERSION,
  SPECIAL_HEADER_NAMES,
  cloneOperationParameter,
  getServiceVersion,
  isKnownContentType,
  isLroNewPollingStrategy,
  operationIsJsonMergePatch,
  operationIsMultipart,
  operationIsMultipleContentTypes,
} from "./operation-utils.js";
import { DevOptions, EmitterOptions, LIB_NAME } from "./options.js";
import {
  BYTES_KNOWN_ENCODING,
  DATETIME_KNOWN_ENCODING,
  DURATION_KNOWN_ENCODING,
  ProcessingCache,
  getAccess,
  getDurationFormat,
  getNonNullSdkType,
  getPropertySerializedName,
  getUnionDescription,
  getUsage,
  modelIs,
  pushDistinct,
} from "./type-utils.js";
import {
  DiagnosticError,
  escapeJavaKeywords,
  getNamespace,
  isStableApiVersion,
  pascalCase,
  removeClientSuffix,
  stringArrayContainsIgnoreCase,
  trace,
} from "./utils.js";
const { isEqual } = pkg;

export interface EmitterOptionsDev {
  flavor?: string;

  // service
  namespace?: string;
  "service-name"?: string;
  "service-versions"?: string[]; // consider to remove

  // license
  license?: License;

  // sample and test
  "generate-samples"?: boolean;
  "generate-tests"?: boolean;

  // customization
  "partial-update"?: boolean;
  "models-subpackage"?: string;
  "custom-types"?: string;
  "custom-types-subpackage"?: string;
  "customization-class"?: string;

  // configure
  "skip-special-headers"?: string[];
  "enable-subclient"?: boolean;

  // not recommended to set
  "group-etag-headers"?: boolean;
  "enable-sync-stack"?: boolean;
  "stream-style-serialization"?: boolean;
  "use-object-for-unknown"?: boolean;
  polling?: any;

  // versioning
  "api-version"?: string;
  "advanced-versioning"?: boolean;
  "service-version-exclude-preview"?: boolean;

  // dev options
  "dev-options"?: DevOptions;

  // internal use for codegen
  "output-dir": string;
  arm?: boolean;
  "license-header"?: string;
}

type SdkHttpOperationParameterType = SdkHttpOperation["parameters"][number];

const AZURE_CORE_FOUNDATIONS_ERROR_ID = "Azure.Core.Foundations.Error";

export class CodeModelBuilder {
  private program: Program;
  private typeNameOptions: TypeNameOptions;
  private namespace: string;
  private baseJavaNamespace!: string;
  private legacyJavaNamespace!: boolean; // backward-compatible mode, that emitter ignores clientNamespace from TCGC
  private sdkContext!: SdkContext;
  private options: EmitterOptionsDev;
  private codeModel: CodeModel;
  private emitterContext: EmitContext<EmitterOptions>;
  private serviceNamespace: Namespace;

  private readonly javaNamespaceCache = new Map<string, string>();

  readonly schemaCache = new ProcessingCache((type: SdkType, name: string) =>
    this.processSchemaImpl(type, name),
  );

  // current apiVersion name to generate code
  private apiVersion: string | undefined;

  public constructor(program1: Program, context: EmitContext<EmitterOptions>) {
    this.options = context.options as EmitterOptionsDev;
    this.program = program1;
    this.emitterContext = context;

    if (this.options["skip-special-headers"]) {
      this.options["skip-special-headers"].forEach((it) =>
        SPECIAL_HEADER_NAMES.add(it.toLowerCase()),
      );
    }

    const service = listServices(this.program)[0];
    if (!service) {
      reportDiagnostic(this.program, {
        code: "no-service",
        target: NoTarget,
      });
    }
    this.serviceNamespace = service?.type ?? this.program.getGlobalNamespaceType();

    this.namespace = getNamespaceFullName(this.serviceNamespace) || "Client";

    const namespace1 = this.namespace;
    this.typeNameOptions = {
      // shorten type names by removing TypeSpec and service namespace
      namespaceFilter(ns) {
        const name = getNamespaceFullName(ns);
        return name !== "TypeSpec" && name !== namespace1;
      },
    };

    // init code model
    const title = this.options["service-name"] ?? this.serviceNamespace.name;

    const description = this.getDoc(this.serviceNamespace);
    this.codeModel = new CodeModel(title, false, {
      info: {
        description: description,
      },
      language: {
        default: {
          name: title,
          description: description,
          summary: this.getSummary(this.serviceNamespace),
          namespace: this.namespace,
        },
        java: {},
      },
    });
  }

  public async build(): Promise<CodeModel> {
    if (this.program.hasError()) {
      return this.codeModel;
    }

    this.sdkContext = await createSdkContext(this.emitterContext, LIB_NAME, {
      additionalDecorators: ["Azure\\.ClientGenerator\\.Core\\.@override"],
      versioning: { previewStringRegex: /$/ },
    }); // include all versions and do the filter by ourselves
    this.program.reportDiagnostics(this.sdkContext.diagnostics);

    // license
    if (this.sdkContext.sdkPackage.licenseInfo) {
      this.codeModel.info.license = new License(this.sdkContext.sdkPackage.licenseInfo.name, {
        url: this.sdkContext.sdkPackage.licenseInfo.link,
        extensions: {
          header: this.sdkContext.sdkPackage.licenseInfo.header,
          company: this.sdkContext.sdkPackage.licenseInfo.company,
        },
      });
    }

    // java namespace
    if (this.options.namespace) {
      // legacy mode, clientNamespace from TCGC will be ignored
      this.legacyJavaNamespace = true;
      this.baseJavaNamespace = this.options.namespace;
    } else {
      this.legacyJavaNamespace = false;
      // baseJavaNamespace is used for model from Azure.Core/Azure.ResourceManager but cannot be mapped to azure-core,
      // or some model (e.g. Options, FileDetails) that is created in this emitter.
      // otherwise, the clientNamespace from SdkType will be used.
      this.baseJavaNamespace = this.getBaseJavaNamespace();
    }
    this.codeModel.language.java!.namespace = this.baseJavaNamespace;

    // auth
    // TODO: it is not very likely, but different client could have different auth
    const auth = getAuthentication(this.program, this.serviceNamespace);
    if (auth) {
      this.processAuth(auth, this.serviceNamespace);
    }

    if (this.sdkContext.arm) {
      // ARM
      this.codeModel.arm = true;
      this.options["group-etag-headers"] = false;
    }

    this.processClients();

    this.processModels();

    this.processSchemaUsage();

    this.deduplicateSchemaName();

    return this.codeModel;
  }

  private processHostParameters(sdkPathParameters: SdkPathParameter[]): Parameter[] {
    const hostParameters: Parameter[] = [];
    let parameter;
    sdkPathParameters.forEach((arg) => {
      if (this.isApiVersionParameter(arg)) {
        parameter = this.createApiVersionParameter(arg.name, ParameterLocation.Uri);
      } else {
        const schema = this.processSchema(arg.type, arg.name);
        this.trackSchemaUsage(schema, {
          usage: [SchemaContext.Input, SchemaContext.Output, SchemaContext.Public],
        });
        parameter = new Parameter(arg.name, arg.doc ?? "", schema, {
          implementation: ImplementationLocation.Client,
          origin: "modelerfour:synthesized/host",
          required: true,
          protocol: {
            http: new HttpParameter(ParameterLocation.Uri),
          },
          language: {
            default: {
              serializedName: arg.serializedName,
            },
          },
          extensions: {
            "x-ms-skip-url-encoding": arg.allowReserved,
          },
          clientDefaultValue: arg.clientDefaultValue,
        });
      }
      hostParameters.push(this.codeModel.addGlobalParameter(parameter));
    });

    return hostParameters;
  }

  private processAuth(auth: Authentication, serviceNamespace: Namespace | Interface | Operation) {
    const securitySchemes: SecurityScheme[] = [];
    for (const option of auth.options) {
      for (const scheme of option.schemes) {
        switch (scheme.type) {
          case "oauth2":
            {
              if (this.isBranded()) {
                const oauth2Scheme = new OAuth2SecurityScheme({
                  scopes: [],
                });
                scheme.flows.forEach((it) =>
                  oauth2Scheme.scopes.push(...it.scopes.map((it) => it.value)),
                );
                (oauth2Scheme as any).flows = scheme.flows;
                securitySchemes.push(oauth2Scheme);
              } else {
                // there is no TokenCredential in clientcore, hence use Bearer Authentication directly
                reportDiagnostic(this.program, {
                  code: "auth-scheme-not-supported",
                  messageId: "oauth2Unbranded",
                  target: serviceNamespace,
                });

                const keyScheme = new KeySecurityScheme({
                  name: "authorization",
                });
                (keyScheme as any).prefix = "Bearer";
                securitySchemes.push(keyScheme);
              }
            }
            break;

          case "apiKey":
            {
              if (scheme.in === "header") {
                const keyScheme = new KeySecurityScheme({
                  name: scheme.name,
                });
                securitySchemes.push(keyScheme);
              } else {
                reportDiagnostic(this.program, {
                  code: "auth-scheme-not-supported",
                  messageId: "apiKeyLocation",
                  target: serviceNamespace,
                });
              }
            }
            break;

          case "http":
            {
              let schemeOrApiKeyPrefix: string = scheme.scheme;
              if (schemeOrApiKeyPrefix === "basic" || schemeOrApiKeyPrefix === "bearer") {
                // HTTP Authentication should use "Basic token" or "Bearer token"
                schemeOrApiKeyPrefix = pascalCase(schemeOrApiKeyPrefix);

                if (this.isBranded()) {
                  // Azure would not allow BasicAuth or BearerAuth
                  reportDiagnostic(this.program, {
                    code: "auth-scheme-not-supported",
                    messageId: "basicAuthBranded",
                    format: { scheme: scheme.scheme },
                    target: serviceNamespace,
                  });
                  continue;
                }
              }

              const keyScheme = new KeySecurityScheme({
                name: "authorization",
              });
              (keyScheme as any).prefix = schemeOrApiKeyPrefix; // TODO: modify KeySecurityScheme, after design stable
              securitySchemes.push(keyScheme);
            }
            break;
        }
      }
    }
    if (securitySchemes.length > 0) {
      this.codeModel.security = new Security(true, {
        schemes: securitySchemes,
      });
    }
  }

  private isBranded(): boolean {
    return this.options["flavor"]?.toLocaleLowerCase() === "azure";
  }

  private processModels() {
    const processedSdkModels: Set<SdkModelType | SdkEnumType> = new Set();

    // cache resolved value of access/usage for the namespace
    // the value can be set as undefined
    // it resolves the value from that namespace and its parent namespaces
    const accessCache: Map<Namespace, string | undefined> = new Map();
    const usageCache: Map<Namespace, SchemaContext[] | undefined> = new Map();

    const sdkModels: (SdkModelType | SdkEnumType)[] = getAllModels(this.sdkContext);

    // process sdk models
    for (const model of sdkModels) {
      if (!processedSdkModels.has(model)) {
        const access = getAccess(model.__raw, accessCache);
        if (access === "public") {
          const schema = this.processSchema(model, "");

          this.trackSchemaUsage(schema, {
            usage: [SchemaContext.Public],
          });
        } else if (access === "internal") {
          const schema = this.processSchema(model, model.name);

          this.trackSchemaUsage(schema, {
            usage: [SchemaContext.Internal],
          });
        }

        const usage = getUsage(model.__raw, usageCache);
        if (usage) {
          const schema = this.processSchema(model, "");

          this.trackSchemaUsage(schema, {
            usage: usage,
          });
        }

        processedSdkModels.add(model);
      }
    }
  }

  private processSchemaUsage() {
    this.codeModel.schemas.objects?.forEach((it) => this.propagateSchemaUsage(it));

    // post process for schema usage
    this.codeModel.schemas.objects?.forEach((it) => this.resolveSchemaUsage(it));
    this.codeModel.schemas.groups?.forEach((it) => this.resolveSchemaUsage(it));
    this.codeModel.schemas.choices?.forEach((it) => this.resolveSchemaUsage(it));
    this.codeModel.schemas.sealedChoices?.forEach((it) => this.resolveSchemaUsage(it));
    this.codeModel.schemas.ors?.forEach((it) => this.resolveSchemaUsage(it));
    this.codeModel.schemas.constants?.forEach((it) => this.resolveSchemaUsage(it));
  }

  private deduplicateSchemaName() {
    // deduplicate model name
    const nameCount = new Map<string, number>();
    const deduplicateName = (schema: Schema) => {
      const name = schema.language.default.name;
      if (
        name &&
        // skip models under "com.azure.core." in java, or "Azure." in typespec, if branded
        !(
          this.isBranded() &&
          (schema.language.java?.namespace?.startsWith("com.azure.core.") ||
            schema.language.default?.namespace?.startsWith("Azure."))
        )
      ) {
        if (!nameCount.has(name)) {
          nameCount.set(name, 1);
        } else {
          const count = nameCount.get(name)!;
          nameCount.set(name, count + 1);
          schema.language.default.name = name + count;
        }
      }
    };
    this.codeModel.schemas.objects?.forEach((it) => deduplicateName(it));
    this.codeModel.schemas.groups?.forEach((it) => deduplicateName(it)); // it may contain RequestConditions under "com.azure.core."
    this.codeModel.schemas.choices?.forEach((it) => deduplicateName(it));
    this.codeModel.schemas.sealedChoices?.forEach((it) => deduplicateName(it));
    this.codeModel.schemas.ors?.forEach((it) => deduplicateName(it));
    this.codeModel.schemas.constants?.forEach((it) => deduplicateName(it));
  }

  private resolveSchemaUsage(schema: Schema) {
    if (
      schema instanceof ObjectSchema ||
      schema instanceof GroupSchema ||
      schema instanceof ChoiceSchema ||
      schema instanceof SealedChoiceSchema ||
      schema instanceof OrSchema ||
      schema instanceof ConstantSchema
    ) {
      const schemaUsage: SchemaContext[] | undefined = schema.usage;

      // Public override Internal
      if (schemaUsage?.includes(SchemaContext.Public)) {
        const index = schemaUsage.indexOf(SchemaContext.Internal);
        if (index >= 0) {
          schemaUsage.splice(index, 1);
        }
      }

      // Internal on PublicSpread, but Public takes precedence
      if (schemaUsage?.includes(SchemaContext.PublicSpread)) {
        // remove PublicSpread as it now served its purpose
        schemaUsage.splice(schemaUsage.indexOf(SchemaContext.PublicSpread), 1);

        // Public would override PublicSpread, hence do nothing if this schema is Public
        if (!schemaUsage?.includes(SchemaContext.Public)) {
          // set the model as Internal, so that it is not exposed to user
          if (!schemaUsage.includes(SchemaContext.Internal)) {
            schemaUsage.push(SchemaContext.Internal);
          }
        }
      }
    }
  }

  private processClients() {
    // preprocess group-etag-headers
    this.options["group-etag-headers"] = this.options["group-etag-headers"] ?? true;

    const sdkPackage = this.sdkContext.sdkPackage;
    for (const client of sdkPackage.clients) {
      this.processClient(client);
    }
  }

  private processClient(client: SdkClientType<SdkHttpOperation>): CodeModelClient {
    let clientName = client.name;
    let javaNamespace = this.getJavaNamespace(client);
    const clientFullName = client.name;
    const clientNameSegments = clientFullName.split(".");
    if (clientNameSegments.length > 1) {
      clientName = clientNameSegments.at(-1)!;
      const clientSubNamespace = clientNameSegments.slice(0, -1).join(".").toLowerCase();
      javaNamespace = javaNamespace + "." + clientSubNamespace;
    }

    const codeModelClient = new CodeModelClient(clientName, client.doc ?? "", {
      summary: client.summary,
      language: {
        default: {
          namespace: this.namespace,
        },
        java: {
          namespace: javaNamespace,
        },
      },

      // at present, use global security definition
      security: this.codeModel.security,
    });
    codeModelClient.language.default.crossLanguageDefinitionId = client.crossLanguageDefinitionId;

    // versioning
    const versions = client.apiVersions;
    if (versions && versions.length > 0) {
      if (!this.sdkContext.apiVersion || ["all", "latest"].includes(this.sdkContext.apiVersion)) {
        this.apiVersion = versions[versions.length - 1];
      } else {
        this.apiVersion = versions.find((it: string) => it === this.sdkContext.apiVersion);
        if (!this.apiVersion) {
          reportDiagnostic(this.program, {
            code: "invalid-api-version",
            format: { apiVersion: this.sdkContext.apiVersion },
            target: NoTarget,
          });
        }
      }

      codeModelClient.apiVersions = [];
      for (const version of this.getFilteredApiVersions(
        this.apiVersion,
        versions,
        this.options["service-version-exclude-preview"],
      )) {
        const apiVersion = new ApiVersion();
        apiVersion.version = version;
        codeModelClient.apiVersions.push(apiVersion);
      }
    }

    // client initialization
    let baseUri = "{endpoint}";
    let hostParameters: Parameter[] = [];
    client.clientInitialization.parameters.forEach((initializationProperty) => {
      if (initializationProperty.kind === "endpoint") {
        let sdkPathParameters: SdkPathParameter[] = [];
        if (initializationProperty.type.kind === "union") {
          if (initializationProperty.type.variantTypes.length === 2) {
            // only get the sdkPathParameters from the endpoint whose serverUrl is not {"endpoint"}
            for (const endpointType of initializationProperty.type.variantTypes) {
              if (endpointType.kind === "endpoint" && endpointType.serverUrl !== "{endpoint}") {
                sdkPathParameters = endpointType.templateArguments;
                baseUri = endpointType.serverUrl;
              }
            }
          } else if (initializationProperty.type.variantTypes.length > 2) {
            reportDiagnostic(this.program, {
              code: "multiple-server-not-supported",
              target: initializationProperty.type.__raw ?? NoTarget,
            });
          }
        } else if (initializationProperty.type.kind === "endpoint") {
          sdkPathParameters = initializationProperty.type.templateArguments;
          baseUri = initializationProperty.type.serverUrl;
        }

        hostParameters = this.processHostParameters(sdkPathParameters);
        codeModelClient.addGlobalParameters(hostParameters);
      }
    });

    const clientContext = new ClientContext(
      baseUri,
      hostParameters,
      codeModelClient.globalParameters!,
      codeModelClient.apiVersions,
    );

    const enableSubclient: boolean = Boolean(this.options["enable-subclient"]);

    // preprocess operation groups and operations
    // operations without operation group
    const serviceMethodsWithoutSubClient = client.methods;
    let codeModelGroup = new OperationGroup("");
    codeModelGroup.language.default.crossLanguageDefinitionId = client.crossLanguageDefinitionId;
    for (const serviceMethod of serviceMethodsWithoutSubClient) {
      if (!this.needToSkipProcessingOperation(serviceMethod.__raw, clientContext)) {
        codeModelGroup.addOperation(this.processOperation(serviceMethod, clientContext, ""));
      }
    }
    if (codeModelGroup.operations?.length > 0 || enableSubclient) {
      codeModelClient.operationGroups.push(codeModelGroup);
    }

    const subClients = this.listSubClientsUnderClient(client, !enableSubclient);
    if (enableSubclient) {
      // subclient, no operation group
      for (const subClient of subClients) {
        const codeModelSubclient = this.processClient(subClient);
        codeModelClient.addSubClient(codeModelSubclient);
      }
    } else {
      // operations under operation groups
      for (const subClient of subClients) {
        const serviceMethods = subClient.methods;
        // operation group with no operation is skipped
        if (serviceMethods.length > 0) {
          codeModelGroup = new OperationGroup(subClient.name);
          codeModelGroup.language.default.crossLanguageDefinitionId =
            subClient.crossLanguageDefinitionId;
          for (const serviceMethod of serviceMethods) {
            if (!this.needToSkipProcessingOperation(serviceMethod.__raw, clientContext)) {
              codeModelGroup.addOperation(
                this.processOperation(serviceMethod, clientContext, subClient.name),
              );
            }
          }
          codeModelClient.operationGroups.push(codeModelGroup);
        }
      }
    }

    this.codeModel.clients.push(codeModelClient);

    // postprocess for ServiceVersion
    let apiVersionSameForAllClients = true;
    let sharedApiVersions = undefined;
    for (const client of this.codeModel.clients) {
      const apiVersions = client.apiVersions;
      if (!apiVersions) {
        // client does not have apiVersions
        apiVersionSameForAllClients = false;
      } else if (!sharedApiVersions) {
        // first client, set it to sharedApiVersions
        sharedApiVersions = apiVersions;
      } else {
        apiVersionSameForAllClients = isEqual(sharedApiVersions, apiVersions);
      }
      if (!apiVersionSameForAllClients) {
        break;
      }
    }
    if (apiVersionSameForAllClients) {
      const serviceVersion = getServiceVersion(this.codeModel);
      for (const client of this.codeModel.clients) {
        client.serviceVersion = serviceVersion;
      }
    } else {
      for (const client of this.codeModel.clients) {
        const apiVersions = client.apiVersions;
        if (apiVersions) {
          client.serviceVersion = getServiceVersion(client);
        }
      }
    }

    return codeModelClient;
  }

  private listSubClientsUnderClient(
    client: SdkClientType<SdkHttpOperation>,
    includeNestedSubClients: boolean,
  ): SdkClientType<SdkHttpOperation>[] {
    const isRootClient = !client.parent;
    const subClients: SdkClientType<SdkHttpOperation>[] = [];
    if (client.children) {
      for (const subClient of client.children) {
        if (!isRootClient) {
          // if it is not root client, append the parent client's name
          subClient.name =
            removeClientSuffix(client.name) + removeClientSuffix(pascalCase(subClient.name));
        }
        subClients.push(subClient);
        if (includeNestedSubClients) {
          for (const operationGroup of this.listSubClientsUnderClient(
            subClient,
            includeNestedSubClients,
          )) {
            subClients.push(operationGroup);
          }
        }
      }
    }
    return subClients;
  }

  /**
   * Filter api-versions for "ServiceVersion".
   * TODO(xiaofei) pending TCGC design: https://github.com/Azure/typespec-azure/issues/965
   *
   * @param pinnedApiVersion the api-version to use as filter base
   * @param versions api-versions to filter
   * @returns filtered api-versions
   */
  private getFilteredApiVersions(
    pinnedApiVersion: string | undefined,
    versions: string[],
    excludePreview: boolean = false,
  ): string[] {
    if (!pinnedApiVersion) {
      return versions;
    }
    return versions
      .slice(0, versions.indexOf(pinnedApiVersion) + 1)
      .filter(
        (version) =>
          !excludePreview || !isStableApiVersion(pinnedApiVersion) || isStableApiVersion(version),
      );
  }

  private needToSkipProcessingOperation(
    operation: Operation | undefined,
    clientContext: ClientContext,
  ): boolean {
    // don't generate protocol and convenience method for overloaded operations
    // issue link: https://github.com/Azure/autorest.java/issues/1958#issuecomment-1562558219 we will support generate overload methods for non-union type in future (TODO issue: https://github.com/Azure/autorest.java/issues/2160)
    if (operation === undefined) {
      return true;
    }
    if (getOverloadedOperation(this.program, operation)) {
      this.trace(
        `Operation '${operation.name}' is temporary skipped, as it is an overloaded operation`,
      );
      return true;
    }
    return false;
  }

  /**
   * Whether we support advanced versioning in non-breaking fashion.
   */
  private supportsAdvancedVersioning(): boolean {
    return Boolean(this.options["advanced-versioning"]);
  }

  private getOperationExample(
    sdkMethod: SdkServiceMethod<SdkHttpOperation>,
  ): Record<string, any> | undefined {
    const httpOperationExamples = sdkMethod.operation.examples;
    if (httpOperationExamples && httpOperationExamples.length > 0) {
      const operationExamples: Record<string, any> = {};
      for (const example of httpOperationExamples) {
        const operationExample = example.rawExample;

        // example.filePath is relative path from sdkContext.examplesDir
        // this is not a URL format (file:// or https://)
        operationExample["x-ms-original-file"] = example.filePath;

        operationExamples[
          operationExample.title ?? operationExample.operationId ?? sdkMethod.name
        ] = operationExample;
      }
      return operationExamples;
    } else {
      return undefined;
    }
  }

  private processOperation(
    sdkMethod: SdkServiceMethod<SdkHttpOperation>,
    clientContext: ClientContext,
    groupName: string,
  ): CodeModelOperation {
    const operationName = sdkMethod.name;
    const httpOperation = sdkMethod.operation;
    const operationId = groupName ? `${groupName}_${operationName}` : `${operationName}`;

    const operationExamples = this.getOperationExample(sdkMethod);

    const codeModelOperation = new CodeModelOperation(operationName, sdkMethod.doc ?? "", {
      operationId: operationId,
      summary: sdkMethod.summary,
      extensions: {
        "x-ms-examples": operationExamples,
      },
    });

    codeModelOperation.language.default.crossLanguageDefinitionId =
      sdkMethod.crossLanguageDefinitionId;
    codeModelOperation.internalApi = sdkMethod.access === "internal";

    const convenienceApiName = this.getConvenienceApiName(sdkMethod);
    let generateConvenienceApi: boolean = sdkMethod.generateConvenient;
    let generateProtocolApi: boolean = sdkMethod.generateProtocol;

    let diagnostic = undefined;
    if (generateConvenienceApi) {
      // check if the convenience API need to be disabled for some special cases
      if (operationIsMultipart(httpOperation)) {
        // do not generate protocol method for multipart/form-data, as it be very hard for user to prepare the request body as BinaryData
        generateProtocolApi = false;
        diagnostic = createDiagnostic({
          code: "protocol-api-not-generated",
          messageId: "multipartFormData",
          format: { operationName: operationName },
          target: sdkMethod.__raw ?? NoTarget,
        });
        this.program.reportDiagnostic(diagnostic);
      } else if (operationIsMultipleContentTypes(httpOperation)) {
        // and multiple content types
        // issue link: https://github.com/Azure/autorest.java/issues/1958#issuecomment-1562558219
        generateConvenienceApi = false;
        diagnostic = createDiagnostic({
          code: "convenience-api-not-generated",
          messageId: "multipleContentType",
          format: { operationName: operationName },
          target: sdkMethod.__raw ?? NoTarget,
        });
        this.program.reportDiagnostic(diagnostic);
      } else if (
        operationIsJsonMergePatch(httpOperation) &&
        this.options["stream-style-serialization"] === false
      ) {
        // do not generate convenient method for json merge patch operation if stream-style-serialization is not enabled
        generateConvenienceApi = false;
        diagnostic = createDiagnostic({
          code: "convenience-api-not-generated",
          messageId: "jsonMergePatch",
          format: { operationName: operationName },
          target: sdkMethod.__raw ?? NoTarget,
        });
        this.program.reportDiagnostic(diagnostic);
      }
    }
    if (generateConvenienceApi && convenienceApiName) {
      codeModelOperation.convenienceApi = new ConvenienceApi(convenienceApiName);
    }
    if (diagnostic) {
      codeModelOperation.language.java = new Language();
      codeModelOperation.language.java.comment = diagnostic.message;
    }

    // check for generating protocol api or not
    codeModelOperation.generateProtocolApi = generateProtocolApi && !codeModelOperation.internalApi;

    codeModelOperation.addRequest(
      new Request({
        protocol: {
          http: {
            path: httpOperation.path,
            method: httpOperation.verb,
            uri: clientContext.baseUri,
          },
        },
      }),
    );

    // host
    clientContext.hostParameters.forEach((it) => codeModelOperation.addParameter(it));
    // path/query/header parameters
    for (const param of httpOperation.parameters) {
      if (param.kind === "cookie") {
        // ignore cookie parameter
        continue;
      }

      // if it's paged operation with request body, skip content-type header added by TCGC, as next link call should not have content type header
      if (
        (sdkMethod.kind === "paging" || sdkMethod.kind === "lropaging") &&
        httpOperation.bodyParam &&
        param.kind === "header"
      ) {
        if (param.serializedName.toLocaleLowerCase() === CONTENT_TYPE_KEY) {
          continue;
        }
      }
      // if the request body is optional, skip content-type header added by TCGC
      // TODO: add optional content type to code-model, and support optional content-type from codegen, https://github.com/Azure/autorest.java/issues/2930
      if (httpOperation.bodyParam && httpOperation.bodyParam.optional) {
        if (param.serializedName.toLocaleLowerCase() === CONTENT_TYPE_KEY) {
          continue;
        }
      }
      this.processParameter(codeModelOperation, param, clientContext);
    }

    // body
    let bodyParameterFlattened = false;
    if (httpOperation.bodyParam && httpOperation.__raw && httpOperation.bodyParam.type.__raw) {
      bodyParameterFlattened = this.processParameterBody(
        codeModelOperation,
        sdkMethod,
        httpOperation.bodyParam,
      );
    }

    if (generateConvenienceApi) {
      this.processParameterGrouping(codeModelOperation, sdkMethod, bodyParameterFlattened);
    }

    // lro metadata
    let lroMetadata = new LongRunningMetadata(false);
    if (sdkMethod.kind === "lro" || sdkMethod.kind === "lropaging") {
      lroMetadata = this.processLroMetadata(codeModelOperation, sdkMethod);
    }

    // responses
    for (const response of sdkMethod.operation.responses) {
      this.processResponse(
        codeModelOperation,
        response.statusCodes,
        response,
        lroMetadata.longRunning,
        false,
      );
    }

    // exception
    for (const response of sdkMethod.operation.exceptions) {
      this.processResponse(
        codeModelOperation,
        response.statusCodes,
        response,
        lroMetadata.longRunning,
        true,
      );
    }

    // check for paged
    this.processRouteForPaged(codeModelOperation, sdkMethod);

    // check for long-running operation
    this.processRouteForLongRunning(codeModelOperation, lroMetadata);

    return codeModelOperation;
  }

  private processRouteForPaged(
    op: CodeModelOperation,
    sdkMethod: SdkServiceMethod<SdkHttpOperation>,
  ) {
    if (sdkMethod.kind !== "paging" && sdkMethod.kind !== "lropaging") {
      return;
    }
    // TCGC should already verified that there is 1 response, and response body is a model
    const responses = sdkMethod.operation.responses;
    if (responses.length === 0) {
      return;
    }
    const response = responses[0];
    const bodyType = response.type;
    if (!bodyType || bodyType.kind !== "model") {
      return;
    }

    op.responses?.forEach((r) => {
      if (r instanceof SchemaResponse) {
        this.trackSchemaUsage(r.schema, { usage: [SchemaContext.Paged] });
      }
    });

    function getLastPropertySegment(
      segments: SdkModelPropertyType[] | undefined,
    ): SdkBodyModelPropertyType | undefined {
      if (segments) {
        const lastSegment = segments[segments.length - 1];
        if (lastSegment.kind === "property") {
          return lastSegment;
        }
      }
      return undefined;
    }
    function getLastSegment(
      segments: SdkModelPropertyType[] | undefined,
    ): SdkModelPropertyType | undefined {
      if (segments) {
        return segments[segments.length - 1];
      }
      return undefined;
    }
    function getLastSegmentSerializedName(
      segments: SdkModelPropertyType[] | undefined,
    ): string | undefined {
      const lastSegment = getLastPropertySegment(segments);
      return lastSegment ? getPropertySerializedName(lastSegment) : undefined;
    }

    // TODO: in future the property could be nested, so that the "itemSegments" or "nextLinkSegments" would contain more than 1 element
    // item/result
    // "itemsSegments" should exist for "paging"/"lropaging"
    const itemSerializedName = getLastSegmentSerializedName(sdkMethod.response.resultSegments);
    // nextLink
    const nextLinkSerializedName = getLastSegmentSerializedName(
      sdkMethod.pagingMetadata.nextLinkSegments,
    );

    // continuationToken
    let continuationTokenParameter: Parameter | undefined;
    let continuationTokenResponseProperty: Property[] | undefined;
    let continuationTokenResponseHeader: HttpHeader | undefined;
    if (!this.isBranded()) {
      const continuationTokenParameterSegment = getLastSegment(
        sdkMethod.pagingMetadata.continuationTokenParameterSegments,
      );
      const continuationTokenResponseSegment = getLastSegment(
        sdkMethod.pagingMetadata.continuationTokenResponseSegments,
      );
      if (continuationTokenParameterSegment && op.parameters) {
        // for now, continuationToken is either request query or header parameter
        const parameter = getHttpOperationParameter(sdkMethod, continuationTokenParameterSegment);
        if (parameter) {
          for (const param of op.parameters) {
            if (param.protocol.http?.in === parameter.kind) {
              if (
                parameter.kind === "header" &&
                param.language.default.serializedName.toLowerCase() ===
                  parameter.serializedName.toLowerCase()
              ) {
                continuationTokenParameter = param;
                break;
              } else if (
                parameter.kind === "query" &&
                param.language.default.serializedName === parameter.serializedName
              ) {
                continuationTokenParameter = param;
                break;
              }
            }
          }
        }
      }
      if (continuationTokenResponseSegment && op.responses) {
        if (continuationTokenResponseSegment?.kind === "responseheader") {
          // continuationToken is response header
          for (const response of op.responses) {
            if (response instanceof SchemaResponse && response.protocol.http) {
              for (const header of response.protocol.http.headers) {
                if (
                  header.header.toLowerCase() ===
                  continuationTokenResponseSegment.serializedName.toLowerCase()
                ) {
                  continuationTokenResponseHeader = header;
                  break;
                }
              }
            }
            if (continuationTokenResponseHeader) {
              break;
            }
          }
        } else if (continuationTokenResponseSegment?.kind === "property") {
          // continuationToken is response body property
          // TODO: the property could be nested
          for (const response of op.responses) {
            if (
              response instanceof SchemaResponse &&
              response.schema instanceof ObjectSchema &&
              response.schema.properties
            ) {
              for (const property of response.schema.properties) {
                if (
                  property.serializedName ===
                  getPropertySerializedName(continuationTokenResponseSegment)
                ) {
                  continuationTokenResponseProperty = [property];
                  break;
                }
              }
            }
            if (continuationTokenResponseProperty) {
              break;
            }
          }
        }
      }
    }

    op.extensions = op.extensions ?? {};
    op.extensions["x-ms-pageable"] = {
      itemName: itemSerializedName,
      nextLinkName: nextLinkSerializedName,
      continuationToken: continuationTokenParameter
        ? new PageableContinuationToken(
            continuationTokenParameter,
            continuationTokenResponseProperty,
            continuationTokenResponseHeader,
          )
        : undefined,
    };
  }

  private processLroMetadata(
    op: CodeModelOperation,
    sdkMethod: SdkLroServiceMethod<SdkHttpOperation> | SdkLroPagingServiceMethod<SdkHttpOperation>,
  ): LongRunningMetadata {
    const trackConvenienceApi: boolean = Boolean(op.convenienceApi);

    const lroMetadata = sdkMethod.lroMetadata;
    if (lroMetadata && lroMetadata.pollingStep) {
      let pollingSchema = undefined;
      let finalSchema = undefined;

      let pollingStrategy: Metadata | undefined = undefined;
      let finalResultPropertySerializedName: string | undefined = undefined;

      const verb = sdkMethod.operation.verb;
      const useNewPollStrategy = isLroNewPollingStrategy(sdkMethod.operation, lroMetadata);
      if (useNewPollStrategy) {
        // use OperationLocationPollingStrategy
        pollingStrategy = new Metadata({
          language: {
            java: {
              name: "OperationLocationPollingStrategy",
              namespace: this.baseJavaNamespace + ".implementation",
            },
          },
        });
      }

      // pollingSchema
      if (
        lroMetadata.pollingStep.responseBody &&
        modelIs(lroMetadata.pollingStep.responseBody, "OperationStatus", "Azure.Core.Foundations")
      ) {
        pollingSchema = this.pollResultSchema;
      } else {
        const pollType = lroMetadata.pollingStep.responseBody;
        if (pollType) {
          pollingSchema = this.processSchema(pollType, "pollResult");
        }
      }

      // finalSchema
      if (
        verb !== "delete" &&
        lroMetadata.finalResponse &&
        lroMetadata.finalResponse.result &&
        lroMetadata.finalResponse.envelopeResult
      ) {
        const finalResult = useNewPollStrategy
          ? lroMetadata.finalResponse.result
          : lroMetadata.finalResponse.envelopeResult;
        finalSchema = this.processSchema(finalResult, "finalResult");

        if (
          useNewPollStrategy &&
          lroMetadata.finalStep &&
          lroMetadata.finalStep.kind === "pollingSuccessProperty" &&
          lroMetadata.finalResponse.resultSegments
        ) {
          // TODO: in future the property could be nested, so that the "resultSegments" would contain more than 1 element
          const lastSegment =
            lroMetadata.finalResponse.resultSegments[
              lroMetadata.finalResponse.resultSegments.length - 1
            ];
          if (lastSegment.kind === "property") {
            finalResultPropertySerializedName = getPropertySerializedName(lastSegment);
          }
        }
      }

      // track usage
      if (pollingSchema) {
        this.trackSchemaUsage(pollingSchema, { usage: [SchemaContext.Output] });
        if (trackConvenienceApi) {
          this.trackSchemaUsage(pollingSchema, {
            usage: [op.internalApi ? SchemaContext.Internal : SchemaContext.Public],
          });
        }
      }
      if (finalSchema) {
        this.trackSchemaUsage(finalSchema, { usage: [SchemaContext.Output] });
        if (trackConvenienceApi) {
          this.trackSchemaUsage(finalSchema, {
            usage: [op.internalApi ? SchemaContext.Internal : SchemaContext.Public],
          });
        }
      }

      op.lroMetadata = new LongRunningMetadata(
        true,
        pollingSchema,
        finalSchema,
        pollingStrategy,
        finalResultPropertySerializedName,
      );
      return op.lroMetadata;
    }

    return new LongRunningMetadata(false);
  }

  private processRouteForLongRunning(op: CodeModelOperation, lroMetadata: LongRunningMetadata) {
    if (lroMetadata.longRunning) {
      op.extensions = op.extensions ?? {};
      op.extensions["x-ms-long-running-operation"] = true;
      return;
    }
  }

  private processParameter(
    op: CodeModelOperation,
    param: SdkHttpOperationParameterType,
    clientContext: ClientContext,
  ) {
    if (clientContext.apiVersions && this.isApiVersionParameter(param) && param.kind !== "cookie") {
      // pre-condition for "isApiVersion": the client supports ApiVersions
      if (this.isArm()) {
        // Currently we assume ARM tsp only have one client and one api-version.
        // TODO: How will service define mixed api-versions(like those in Compute RP)?
        const apiVersion = this.apiVersion;
        if (!this._armApiVersionParameter) {
          this._armApiVersionParameter = this.createApiVersionParameter(
            "api-version",
            param.kind === "query" ? ParameterLocation.Query : ParameterLocation.Path,
            apiVersion,
          );
          clientContext.addGlobalParameter(this._armApiVersionParameter);
        }
        op.addParameter(this._armApiVersionParameter);
      } else {
        const parameter = this.getApiVersionParameter(param);
        op.addParameter(parameter);
        clientContext.addGlobalParameter(parameter);
      }
    } else if (param.kind === "path" && param.onClient && this.isSubscriptionId(param)) {
      const parameter = this.subscriptionIdParameter(param);
      op.addParameter(parameter);
      clientContext.addGlobalParameter(parameter);
    } else if (
      param.kind === "header" &&
      SPECIAL_HEADER_NAMES.has(param.serializedName.toLowerCase())
    ) {
      // special headers
      op.specialHeaders = op.specialHeaders ?? [];
      if (!stringArrayContainsIgnoreCase(op.specialHeaders, param.serializedName)) {
        op.specialHeaders.push(param.serializedName);
      }
    } else {
      // schema
      const sdkType = getNonNullSdkType(param.type);
      const schema = this.processSchema(sdkType, param.name);

      let extensions: { [id: string]: any } | undefined = undefined;
      if (param.kind === "path") {
        if (param.allowReserved) {
          extensions = extensions ?? {};
          extensions["x-ms-skip-url-encoding"] = true;
        }
      }
      // TODO: deprecate this logic of string/url for x-ms-skip-url-encoding
      if (
        (param.kind === "query" || param.kind === "path") &&
        isSdkBuiltInKind(sdkType.kind) &&
        schema instanceof UriSchema
      ) {
        extensions = extensions ?? {};
        extensions["x-ms-skip-url-encoding"] = true;
      }

      if (this.supportsAdvancedVersioning() && param.__raw) {
        // versioning
        const addedOn = getAddedOnVersions(this.program, param.__raw);
        if (addedOn) {
          extensions = extensions ?? {};
          extensions["x-ms-versioning-added"] = clientContext.getAddedVersions(addedOn);
        }
      }

      // format if array
      let style = undefined;
      let explode = undefined;
      if (sdkType.kind === "array") {
        if (param.kind === "query") {
          const format = param.collectionFormat;
          switch (format) {
            case "csv":
            case "simple":
              style = SerializationStyle.Simple;
              break;

            case "ssv":
              style = SerializationStyle.SpaceDelimited;
              break;

            case "tsv":
              style = SerializationStyle.TabDelimited;
              break;

            case "pipes":
              style = SerializationStyle.PipeDelimited;
              break;

            case "multi":
            case "form":
              style = SerializationStyle.Form;
              explode = true;
              break;
          }

          if (param.explode && !param.collectionFormat) {
            style = SerializationStyle.Form;
            explode = true;
          }
        } else if (param.kind === "header") {
          const format = param.collectionFormat;
          switch (format) {
            case "csv":
              style = SerializationStyle.Simple;
              break;

            default:
              if (format) {
                reportDiagnostic(this.program, {
                  code: "header-parameter-format-not-supported",
                  format: { format: format },
                  target: param.__raw ?? NoTarget,
                });
              }
              break;
          }
        }
      }

      const parameterOnClient = param.onClient;

      const nullable = param.type.kind === "nullable";
      const parameter = new Parameter(param.name, param.doc ?? "", schema, {
        summary: param.summary,
        implementation: parameterOnClient
          ? ImplementationLocation.Client
          : ImplementationLocation.Method,
        required: !param.optional,
        nullable: nullable,
        protocol: {
          http: new HttpParameter(param.kind, {
            style: style,
            explode: explode,
          }),
        },
        language: {
          default: {
            serializedName: param.serializedName, // it uses param.name previously, but better to use param.serializedName directly
          },
        },
        extensions: extensions,
      });
      op.addParameter(parameter);

      if (parameterOnClient) {
        clientContext.addGlobalParameter(parameter);
      }

      this.trackSchemaUsage(schema, { usage: [SchemaContext.Input] });

      if (op.convenienceApi) {
        this.trackSchemaUsage(schema, {
          usage: [op.internalApi ? SchemaContext.Internal : SchemaContext.Public],
        });
      }
    }
  }

  private processParameterGrouping(
    op: CodeModelOperation,
    sdkMethod: SdkServiceMethod<SdkHttpOperation>,
    bodyParameterFlattened: boolean,
  ) {
    const httpOperation = sdkMethod.operation;
    const methodSignatureOverridden = sdkMethod.decorators.some(
      (it) => it.name === "Azure.ClientGenerator.Core.@override",
    );

    if (methodSignatureOverridden) {
      // limit the effect of "SdkServiceMethod"
      // only process it and its parameters, when the "@override" is defined on the operation
      this.processSdkMethodOverride(op, sdkMethod);
    } else if (bodyParameterFlattened) {
      // only do this, if no explicit method override via "@override"
      this.checkGroupingAfterBodyParameterFlatten(op);
    }

    // group ETag header parameters, if exists
    if (this.options["group-etag-headers"]) {
      // the etag headers would be re-grouped, if they are already processed by override
      // this may not be the expected behavior
      this.processEtagHeaderParameters(op, httpOperation);
    }
  }

  private processSdkMethodOverride(
    op: CodeModelOperation,
    sdkMethod: SdkServiceMethod<SdkHttpOperation>,
  ) {
    // method be called, only if "op.convenienceApi"
    let request = op.convenienceApi?.requests?.[0];
    let requestParameters: Parameter[];
    if (request) {
      requestParameters = request.parameters!;
    } else {
      op.convenienceApi!.requests = [];
      request = new Request({
        protocol: op.requests![0].protocol,
      });
      op.convenienceApi!.requests.push(request);

      requestParameters = op.parameters!;
    }
    request.parameters = [];
    request.signatureParameters = [];

    function findOperationParameter(
      parameter: SdkHttpOperationParameterType | SdkBodyParameter | SdkBodyModelPropertyType,
    ): Parameter | undefined {
      let opParameter;
      // ignore constant parameter, usually the "accept" and "content-type" header
      if (parameter.type.kind !== "constant") {
        if (parameter.kind === "body") {
          // there should be only 1 body parameter
          opParameter = requestParameters.find((it) => it.protocol.http?.in === "body");
        } else if (parameter.kind === "property") {
          // body property
          // if body property appears on method signature, it should already be flattened, hence the check on VirtualParameter
          opParameter = requestParameters.find(
            (it) =>
              it instanceof VirtualParameter &&
              it.language.default.serializedName === getPropertySerializedName(parameter),
          );
        } else {
          // query, path, header
          opParameter = requestParameters.find(
            (it) =>
              it.protocol.http?.in === parameter.kind &&
              it.language.default.serializedName === parameter.serializedName,
          );
        }
      }
      return opParameter;
    }

    for (const sdkMethodParameter of sdkMethod.parameters) {
      let httpOperationParameter = getHttpOperationParameter(sdkMethod, sdkMethodParameter);
      if (httpOperationParameter) {
        const opParameter = findOperationParameter(httpOperationParameter);
        if (opParameter) {
          request.signatureParameters.push(opParameter);
          request.parameters.push(opParameter);
        }
      } else {
        // sdkMethodParameter is a grouping parameter
        if (sdkMethodParameter.type.kind === "model") {
          const opParameters = [];
          for (const property of sdkMethodParameter.type.properties) {
            httpOperationParameter = getHttpOperationParameter(sdkMethod, property);
            if (httpOperationParameter) {
              const opParameter = findOperationParameter(httpOperationParameter);
              if (opParameter) {
                if (opParameter instanceof VirtualParameter) {
                  opParameters.push(opParameter);
                } else {
                  opParameters.push(opParameter);
                }
              }
            }
          }
          // group schema
          const groupSchema = this.processGroupSchema(
            sdkMethodParameter.type,
            opParameters,
            sdkMethodParameter.type.name,
          );
          this.trackSchemaUsage(groupSchema, { usage: [SchemaContext.Input] });
          if (op.convenienceApi) {
            this.trackSchemaUsage(groupSchema, {
              usage: [op.internalApi ? SchemaContext.Internal : SchemaContext.Public],
            });
          }

          // group parameter
          const groupParameter = new Parameter(
            sdkMethodParameter.name,
            sdkMethodParameter.doc ?? "",
            groupSchema,
            {
              summary: sdkMethodParameter.summary,
              implementation: ImplementationLocation.Method,
              required: !sdkMethodParameter.optional,
              nullable: false,
            },
          );
          request.signatureParameters.push(groupParameter);
          request.parameters.push(...opParameters);
          request.parameters.push(groupParameter);

          opParameters.forEach((it) => {
            it.groupedBy = groupParameter;
          });
        }
      }
    }
  }

  private processGroupSchema(
    type: SdkModelType | undefined,
    parameters: Parameter[],
    name: string,
    description: string | undefined = undefined,
  ): GroupSchema {
    // the "GroupSchema" is simliar to "ObjectSchema", but the process is different

    if (type && this.schemaCache.has(type)) {
      return this.schemaCache.get(type) as GroupSchema;
    }

    // option bag schema
    const optionBagSchema = this.codeModel.schemas.add(
      new GroupSchema(name, type?.doc ?? description ?? "", {
        summary: type?.summary,
        language: {
          default: {
            namespace: type ? getNamespace(type.__raw) : this.namespace,
          },
          java: {
            namespace: this.getJavaNamespace(type),
          },
        },
      }),
    );
    parameters.forEach((it) => {
      optionBagSchema.add(
        new GroupProperty(it.language.default.name, it.language.default.description, it.schema, {
          originalParameter: [it],
          summary: it.summary,
          required: it.required,
          nullable: it.nullable,
          readOnly: false,
          serializedName: it.language.default.serializedName,
        }),
      );
    });

    if (type) {
      // on cache: the GroupProperty actually has a reference to "originalParameter" (though on same type, the parameter should be identical)
      this.schemaCache.set(type, optionBagSchema);
    }
    return optionBagSchema;
  }

  private checkGroupingAfterBodyParameterFlatten(op: CodeModelOperation) {
    // method be called, only if "op.convenienceApi" is defined
    // method signature of the convenience API after body parameter flatten
    const request = op.convenienceApi?.requests?.[0];

    if (
      request &&
      request.signatureParameters &&
      request.parameters &&
      request.signatureParameters.length > 6
    ) {
      // create an option bag
      const name = op.language.default.name + "Options";
      const optionBagSchema = this.processGroupSchema(
        undefined,
        request.parameters,
        name,
        `Options for ${op.language.default.name} API`,
      );
      this.trackSchemaUsage(optionBagSchema, { usage: [SchemaContext.Input] });
      if (op.convenienceApi) {
        this.trackSchemaUsage(optionBagSchema, {
          usage: [op.internalApi ? SchemaContext.Internal : SchemaContext.Public],
        });
      }

      // option bag parameter
      const optionBagParameter = new Parameter(
        "options",
        optionBagSchema.language.default.description,
        optionBagSchema,
        {
          implementation: ImplementationLocation.Method,
          required: true,
          nullable: false,
        },
      );

      request.signatureParameters = [optionBagParameter];
      request.parameters.forEach((it) => (it.groupedBy = optionBagParameter));
      request.parameters.push(optionBagParameter);
    }
  }

  private processEtagHeaderParameters(op: CodeModelOperation, httpOperation: SdkHttpOperation) {
    if (op.convenienceApi && op.parameters && op.signatureParameters) {
      const etagHeadersNames = new Set<string>([
        "if-match",
        "if-none-match",
        "if-unmodified-since",
        "if-modified-since",
      ]);

      // collect etag headers in parameters
      const etagHeaders: string[] = [];
      if (op.parameters) {
        for (const parameter of op.parameters) {
          if (
            parameter.language.default.serializedName &&
            etagHeadersNames.has(parameter.language.default.serializedName.toLowerCase())
          ) {
            etagHeaders.push(parameter.language.default.serializedName);
          }
        }
      }

      let groupToRequestConditions = false;
      let groupToMatchConditions = false;

      if (etagHeaders.length === 4) {
        // all 4 headers available, use RequestConditions
        groupToRequestConditions = true;
      } else if (etagHeaders.length === 2) {
        const etagHeadersLowerCase = etagHeaders.map((it) => it.toLowerCase());
        if (
          etagHeadersLowerCase.includes("if-match") &&
          etagHeadersLowerCase.includes("if-none-match")
        ) {
          // only 2 headers available, use MatchConditions
          groupToMatchConditions = true;
        }
      }

      if (groupToRequestConditions || groupToMatchConditions) {
        // method be called, only if "op.convenienceApi"
        let request = op.convenienceApi?.requests?.[0];
        let requestParameters: Parameter[];
        let requestSignatureParameters: Parameter[];
        if (request) {
          requestParameters = request.parameters!;
          requestSignatureParameters = request.signatureParameters!;
        } else {
          op.convenienceApi!.requests = [];
          request = new Request({
            protocol: op.requests![0].protocol,
          });
          op.convenienceApi!.requests.push(request);

          requestParameters = op.parameters!;
          requestSignatureParameters = op.signatureParameters!;
        }
        request.parameters = [];
        request.signatureParameters = [];

        for (const parameter of requestParameters) {
          // copy all parameters to request
          request.parameters.push(parameter);

          // copy signatureParameters, but exclude etag headers (as they won't be in method signature)
          if (
            requestSignatureParameters.includes(parameter) &&
            !(
              parameter.language.default.serializedName &&
              etagHeaders.includes(parameter.language.default.serializedName)
            )
          ) {
            request.signatureParameters.push(parameter);
          }
        }

        const schemaName = groupToRequestConditions ? "RequestConditions" : "MatchConditions";
        const schemaDescription = groupToRequestConditions
          ? "Specifies HTTP options for conditional requests based on modification time."
          : "Specifies HTTP options for conditional requests.";

        // group schema
        const requestConditionsSchema = this.codeModel.schemas.add(
          new GroupSchema(schemaName, schemaDescription, {
            language: {
              default: {
                namespace: this.namespace,
              },
              java: {
                namespace: "com.azure.core.http",
              },
            },
          }),
        );

        // parameter (optional) of the group schema
        const requestConditionsParameter = new Parameter(
          schemaName,
          requestConditionsSchema.language.default.description,
          requestConditionsSchema,
          {
            implementation: ImplementationLocation.Method,
            required: false,
            nullable: true,
          },
        );

        this.trackSchemaUsage(requestConditionsSchema, { usage: [SchemaContext.Input] });
        if (op.convenienceApi) {
          this.trackSchemaUsage(requestConditionsSchema, {
            usage: [op.internalApi ? SchemaContext.Internal : SchemaContext.Public],
          });
        }

        // update group schema for properties
        for (const parameter of request.parameters) {
          if (
            parameter.language.default.serializedName &&
            etagHeaders.includes(parameter.language.default.serializedName)
          ) {
            if (parameter.groupedBy) {
              // remove etag header from its original groupBy schema
              if (
                parameter.groupedBy.schema instanceof GroupSchema &&
                parameter.groupedBy.schema.properties
              ) {
                parameter.groupedBy.schema.properties =
                  parameter.groupedBy.schema.properties.filter(
                    (p) => p.serializedName !== parameter.language.default.serializedName,
                  );
              }
            }

            // add it to RequestConditions or MatchConditions
            parameter.groupedBy = requestConditionsParameter;

            requestConditionsSchema.add(
              // name is serializedName, as it must be same as that in RequestConditions class
              new GroupProperty(
                parameter.language.default.serializedName,
                parameter.language.default.description,
                parameter.schema,
                {
                  originalParameter: [parameter],
                  summary: parameter.summary,
                  required: false,
                  nullable: true,
                  readOnly: false,
                  serializedName: parameter.language.default.serializedName,
                },
              ),
            );
          }
        }

        // put RequestConditions/MatchConditions as last parameter/signatureParameters
        request.parameters.push(requestConditionsParameter);
        request.signatureParameters.push(requestConditionsParameter);
      }
    }
  }

  private processParameterBody(
    op: CodeModelOperation,
    sdkMethod: SdkServiceMethod<SdkHttpOperation>,
    sdkBody: SdkBodyParameter,
  ): boolean {
    let bodyParameterFlattened = false;

    const sdkHttpOperation = sdkMethod.operation;
    // set contentTypes to mediaTypes
    op.requests![0].protocol.http!.mediaTypes = sdkBody.contentTypes;

    const unknownRequestBody =
      op.requests![0].protocol.http!.mediaTypes &&
      op.requests![0].protocol.http!.mediaTypes.length > 0 &&
      !isKnownContentType(op.requests![0].protocol.http!.mediaTypes);

    const sdkType: SdkType = sdkBody.type;

    let schema: Schema;
    if (unknownRequestBody && sdkType.kind === "bytes") {
      // if it's unknown request body, handle binary request body
      schema = this.processBinarySchema(sdkType);
    } else {
      schema = this.processSchema(getNonNullSdkType(sdkType), sdkBody.name);
    }

    const parameterName = sdkBody.name;
    const parameter = new Parameter(parameterName, sdkBody.doc ?? "", schema, {
      summary: sdkBody.summary,
      implementation: ImplementationLocation.Method,
      required: !sdkBody.optional,
      protocol: {
        http: new HttpParameter(ParameterLocation.Body),
      },
    });
    op.addParameter(parameter);

    const jsonMergePatch = operationIsJsonMergePatch(sdkHttpOperation);

    const schemaIsPublicBeforeProcess =
      schema instanceof ObjectSchema &&
      (schema as SchemaUsage).usage?.includes(SchemaContext.Public);

    this.trackSchemaUsage(schema, { usage: [SchemaContext.Input] });

    if (op.convenienceApi) {
      // model/schema does not need to be Public or Internal, if it is not to be used in convenience API
      this.trackSchemaUsage(schema, {
        usage: [op.internalApi ? SchemaContext.Internal : SchemaContext.Public],
      });
    }

    if (jsonMergePatch) {
      this.trackSchemaUsage(schema, { usage: [SchemaContext.JsonMergePatch] });
    }
    if (op.convenienceApi && operationIsMultipart(sdkHttpOperation)) {
      this.trackSchemaUsage(schema, { serializationFormats: [KnownMediaType.Multipart] });
    }

    if (op.convenienceApi) {
      /**
       * Explicit body parameter @body or @bodyRoot would result to the existence of rawHttpOperation.parameters.body.property
       * Implicit body parameter would result to rawHttpOperation.parameters.body.property be undefined
       * see https://typespec.io/docs/libraries/http/cheat-sheet#data-types
       */
      /**
       * In TCGC, the condition is 'sdkType.kind === "model" && sdkBody.type !== sdkBody.correspondingMethodParams[0]?.type'.
       * Basically, it means that the model of the SDK method parameters (typically, more than 1) be different from the model of this single HTTP body parameter.
       */
      const bodyParameterFlatten =
        !this.isArm() &&
        schema instanceof ObjectSchema &&
        sdkType.kind === "model" &&
        sdkBody.type !== sdkBody.correspondingMethodParams[0]?.type;

      if (schema instanceof ObjectSchema && bodyParameterFlatten) {
        // flatten body parameter
        const parameters = sdkHttpOperation.parameters;
        const bodyParameter = sdkHttpOperation.bodyParam;

        if (!parameter.language.default.name) {
          // name the parameter for documentation
          parameter.language.default.name = "request";
        }

        if (jsonMergePatch) {
          // skip model flatten, if "application/merge-patch+json"
          if (sdkType.isGeneratedName) {
            schema.language.default.name = pascalCase(op.language.default.name) + "PatchRequest";
          }
          return bodyParameterFlattened;
        }

        // flatten body parameter
        bodyParameterFlattened = true;

        const schemaUsage = (schema as SchemaUsage).usage;
        if (!schemaIsPublicBeforeProcess && schemaUsage?.includes(SchemaContext.Public)) {
          // Public added in this op, change it to PublicSpread
          // This means that if this op would originally add Public to this schema, it adds PublicSpread instead
          schemaUsage?.splice(schemaUsage?.indexOf(SchemaContext.Public), 1);
          this.trackSchemaUsage(schema, { usage: [SchemaContext.PublicSpread] });
        }

        op.convenienceApi.requests = [];
        const request = new Request({
          protocol: op.requests![0].protocol,
        });
        request.parameters = [];
        op.convenienceApi.requests.push(request);

        // header/query/path params
        for (const opParameter of parameters) {
          this.addParameterOrBodyPropertyToCodeModelRequest(
            opParameter,
            op,
            request,
            schema,
            parameter,
          );
        }
        // body param
        if (bodyParameter) {
          if (bodyParameter.type.kind === "model") {
            for (const bodyProperty of bodyParameter.type.properties) {
              if (bodyProperty.kind === "property") {
                this.addParameterOrBodyPropertyToCodeModelRequest(
                  bodyProperty,
                  op,
                  request,
                  schema,
                  parameter,
                );
              }
            }
          }
        }
        request.signatureParameters = request.parameters;
      }
    }
    return bodyParameterFlattened;
  }

  private addParameterOrBodyPropertyToCodeModelRequest(
    opParameter: SdkHttpOperationParameterType | SdkBodyModelPropertyType,
    op: CodeModelOperation,
    request: Request,
    schema: ObjectSchema,
    originalParameter: Parameter,
  ) {
    const serializedName =
      opParameter.kind === "property"
        ? getPropertySerializedName(opParameter)
        : opParameter.serializedName;
    let existParameter: Parameter | undefined;
    if (opParameter.kind !== "property") {
      // not body property
      // header/query/path, same location and same serializedName
      existParameter = op.parameters?.find(
        (it) =>
          it.protocol.http?.in === opParameter.kind &&
          it.language.default.serializedName === serializedName,
      );
    }
    request.parameters = request.parameters ?? [];
    if (existParameter) {
      // parameter
      if (
        existParameter.implementation === ImplementationLocation.Method &&
        (existParameter.origin?.startsWith("modelerfour:synthesized/") ?? true) &&
        !(existParameter.schema instanceof ConstantSchema)
      ) {
        request.parameters.push(cloneOperationParameter(existParameter));
      }
    } else {
      // property from anonymous model
      const existBodyProperty = schema.properties?.find(
        (it) => it.serializedName === serializedName,
      );
      if (
        existBodyProperty &&
        !existBodyProperty.readOnly &&
        !(existBodyProperty.schema instanceof ConstantSchema)
      ) {
        request.parameters.push(
          new VirtualParameter(
            existBodyProperty.language.default.name,
            existBodyProperty.language.default.description,
            existBodyProperty.schema,
            {
              originalParameter: originalParameter,
              targetProperty: existBodyProperty,
              language: {
                default: {
                  serializedName: existBodyProperty.serializedName,
                },
              },
              summary: existBodyProperty.summary,
              implementation: ImplementationLocation.Method,
              required: existBodyProperty.required,
              nullable: existBodyProperty.nullable,
            },
          ),
        );
      }
    }
  }

  private processResponse(
    op: CodeModelOperation,
    statusCode: number | HttpStatusCodeRange | "*",
    sdkResponse: SdkHttpResponse | SdkHttpErrorResponse,
    longRunning: boolean,
    isErrorResponse: boolean,
  ) {
    // TODO: what to do if more than 1 response?
    // It happens when the response type is Union, on one status code.
    // let response: Response;
    let headers: Array<HttpHeader> | undefined = undefined;

    // headers
    headers = [];
    if (sdkResponse.headers) {
      for (const header of sdkResponse.headers) {
        const schema = this.processSchema(header.type, header.serializedName);
        headers.push(
          new HttpHeader(header.serializedName, schema, {
            language: {
              default: {
                name: header.serializedName,
                description: header.summary ?? header.doc,
              },
            },
          }),
        );
      }
    }

    const bodyType: SdkType | undefined = sdkResponse.type;
    let trackConvenienceApi: boolean = Boolean(op.convenienceApi);

    const unknownResponseBody =
      sdkResponse.contentTypes &&
      sdkResponse.contentTypes.length > 0 &&
      !isKnownContentType(sdkResponse.contentTypes);

    let response: Response;
    if (unknownResponseBody && bodyType && bodyType.kind === "bytes") {
      // binary
      response = new BinaryResponse({
        protocol: {
          http: {
            statusCodes: this.getStatusCodes(statusCode),
            headers: headers,
            mediaTypes: sdkResponse.contentTypes,
            knownMediaType: KnownMediaType.Binary,
          },
        },
        language: {
          default: {
            name: op.language.default.name + "Response",
            description: sdkResponse.description,
          },
        },
      });
    } else if (bodyType) {
      // schema (usually JSON)
      let schema: Schema | undefined = undefined;
      if (longRunning) {
        // LRO uses the LroMetadata for poll/final result, not the response of activation request
        trackConvenienceApi = false;
      }
      if (!schema) {
        schema = this.processSchema(bodyType, op.language.default.name + "Response");
      }
      response = new SchemaResponse(schema, {
        protocol: {
          http: {
            statusCodes: this.getStatusCodes(statusCode),
            headers: headers,
            mediaTypes: sdkResponse.contentTypes,
          },
        },
        language: {
          default: {
            name: op.language.default.name + "Response",
            description: sdkResponse.description,
          },
        },
      });
    } else {
      // not binary nor schema, usually NoContent
      response = new Response({
        protocol: {
          http: {
            statusCodes: this.getStatusCodes(statusCode),
            headers: headers,
          },
        },
        language: {
          default: {
            name: op.language.default.name + "Response",
            description: sdkResponse.description,
          },
        },
      });
    }

    if (isErrorResponse) {
      op.addException(response);

      if (response instanceof SchemaResponse) {
        this.trackSchemaUsage(response.schema, { usage: [SchemaContext.Exception] });

        if (trackConvenienceApi && !this.isBranded()) {
          this.trackSchemaUsage(response.schema, {
            usage: [op.internalApi ? SchemaContext.Internal : SchemaContext.Public],
          });
        }
      }
    } else {
      op.addResponse(response);

      if (response instanceof SchemaResponse) {
        this.trackSchemaUsage(response.schema, { usage: [SchemaContext.Output] });

        if (trackConvenienceApi) {
          this.trackSchemaUsage(response.schema, {
            usage: [op.internalApi ? SchemaContext.Internal : SchemaContext.Public],
          });
        }
      }
    }
  }

  private getStatusCodes(statusCodes: HttpStatusCodesEntry): string[] {
    if (statusCodes === "*") {
      return ["default"];
    } else if (typeof statusCodes === "number") {
      return [statusCodes.toString()];
    } else {
      // HttpStatusCodeRange
      // azure-core does not support "status code range", hence here we expand the range to array of status codes
      return Array(statusCodes.end - statusCodes.start + 1)
        .fill(statusCodes.start)
        .map((it, index) => it + index)
        .map((it) => it.toString());
    }
  }

  private processSchema(type: SdkType, nameHint: string): Schema {
    return this.schemaCache.process(type, nameHint) || fail("Unable to process schema.");
  }

  private processSchemaImpl(type: SdkType, nameHint: string): Schema {
    if (isSdkBuiltInKind(type.kind)) {
      return this.processBuiltInType(type as SdkBuiltInType, nameHint);
    } else {
      switch (type.kind) {
        case "enum":
          return this.processChoiceSchema(type, type.name);

        case "enumvalue":
          return this.processConstantSchemaFromEnumValue(type, nameHint);

        case "union":
          return this.processUnionSchema(type, type.name);

        case "model":
          return this.processObjectSchema(type, type.name);

        case "dict":
          return this.processDictionarySchema(type, nameHint);

        case "array":
          return this.processArraySchema(type, nameHint);

        case "duration":
          if (DURATION_KNOWN_ENCODING.includes(type.encode)) {
            return this.processDurationSchema(type, nameHint, getDurationFormat(type));
          } else {
            reportDiagnostic(this.program, {
              code: "unknown-encode",
              format: { encode: type.encode },
              target: type.__raw ?? NoTarget,
            });
            return this.processBuiltInType(type.wireType, nameHint);
          }

        case "constant":
          return this.processConstantSchema(type, nameHint);

        case "utcDateTime":
        case "offsetDateTime":
          if (DATETIME_KNOWN_ENCODING.includes(type.encode)) {
            if (type.encode === "unixTimestamp") {
              return this.processUnixTimeSchema(type, nameHint);
            } else {
              return this.processDateTimeSchema(type, nameHint, type.encode === "rfc7231");
            }
          } else {
            reportDiagnostic(this.program, {
              code: "unknown-encode",
              format: { encode: type.encode },
              target: type.__raw ?? NoTarget,
            });
            return this.processBuiltInType(type.wireType, nameHint);
          }
      }
    }
    const diagnostic = createDiagnostic({
      code: "unrecognized-type",
      format: { typeKind: type.kind },
      target: type.__raw ?? NoTarget,
    });
    throw new DiagnosticError(diagnostic);
  }

  private processBuiltInType(type: SdkBuiltInType, nameHint: string): Schema {
    nameHint = nameHint || type.kind;

    if (isSdkIntKind(type.kind)) {
      const integerSize = type.kind === "safeint" || type.kind.includes("int64") ? 64 : 32;
      return this.processIntegerSchema(type, nameHint, integerSize);
    } else {
      switch (type.kind) {
        case "unknown":
          return this.processAnySchema();

        case "string":
          return this.processStringSchema(type, nameHint);

        case "float":
        case "float32":
        case "float64":
          return this.processNumberSchema(type, nameHint);

        case "decimal":
        case "decimal128":
          return this.processDecimalSchema(type, nameHint);

        case "bytes":
          if (!type.encode || BYTES_KNOWN_ENCODING.includes(type.encode)) {
            return this.processByteArraySchema(type, nameHint);
          } else {
            reportDiagnostic(this.program, {
              code: "unknown-encode",
              format: { encode: type.encode },
              target: type.__raw ?? NoTarget,
            });
            return this.processStringSchema(type, nameHint);
          }

        case "boolean":
          return this.processBooleanSchema(type, nameHint);

        case "plainTime":
          return this.processTimeSchema(type, nameHint);

        case "plainDate":
          return this.processDateSchema(type, nameHint);

        case "url":
          return this.processUrlSchema(type, nameHint);
      }
    }
  }

  private processAnySchema(): AnySchema {
    return this.anySchema;
  }

  private processStringSchema(type: SdkBuiltInType, name: string): StringSchema {
    return this.codeModel.schemas.add(
      new StringSchema(name, type.doc ?? "", {
        summary: type.summary,
      }),
    );
  }

  private processByteArraySchema(type: SdkBuiltInType, name: string): ByteArraySchema {
    const base64Encoded: boolean = type.encode === "base64url";
    return this.codeModel.schemas.add(
      new ByteArraySchema(name, type.doc ?? "", {
        summary: type.summary,
        format: base64Encoded ? "base64url" : "byte",
      }),
    );
  }

  private processIntegerSchema(
    type: SdkBuiltInType,
    name: string,
    precision: number,
  ): NumberSchema {
    const schema = new NumberSchema(name, type.doc ?? "", SchemaType.Integer, precision, {
      summary: type.summary,
    });
    if (type.encode === "string") {
      (schema as EncodedSchema).encode = type.encode;
    }
    return this.codeModel.schemas.add(schema);
  }

  private processNumberSchema(type: SdkBuiltInType, name: string): NumberSchema {
    return this.codeModel.schemas.add(
      new NumberSchema(name, type.doc ?? "", SchemaType.Number, 64, {
        summary: type.summary,
      }),
    );
  }

  private processDecimalSchema(type: SdkBuiltInType, name: string): NumberSchema {
    // "Infinity" maps to "BigDecimal" in Java
    return this.codeModel.schemas.add(
      new NumberSchema(name, type.doc ?? "", SchemaType.Number, Infinity, {
        summary: type.summary,
      }),
    );
  }

  private processBooleanSchema(type: SdkBuiltInType, name: string): BooleanSchema {
    return this.codeModel.schemas.add(
      new BooleanSchema(name, type.doc ?? "", {
        summary: type.summary,
      }),
    );
  }

  private processArraySchema(type: SdkArrayType, name: string): ArraySchema {
    let nullableItems = false;
    let elementType = type.valueType;
    if (elementType.kind === "nullable") {
      nullableItems = true;
      elementType = elementType.type;
    }

    const elementSchema = this.processSchema(elementType, name);
    return this.codeModel.schemas.add(
      new ArraySchema(name, type.doc ?? "", elementSchema, {
        summary: type.summary,
        nullableItems: nullableItems,
      }),
    );
  }

  private processDictionarySchema(type: SdkDictionaryType, name: string): DictionarySchema {
    const dictSchema = new DictionarySchema<any>(name, type.doc ?? "", null, {
      summary: type.summary,
    });

    // cache this now before we accidentally recurse on this type.
    if (!this.schemaCache.has(type)) {
      this.schemaCache.set(type, dictSchema);
    }

    let nullableItems = false;
    let elementType = type.valueType;
    if (elementType.kind === "nullable") {
      nullableItems = true;
      elementType = elementType.type;
    }
    const elementSchema = this.processSchema(elementType, name);
    dictSchema.elementType = elementSchema;

    dictSchema.nullableItems = nullableItems;

    return this.codeModel.schemas.add(dictSchema);
  }

  private processChoiceSchema(
    type: SdkEnumType,
    name: string,
  ): ChoiceSchema | SealedChoiceSchema | ConstantSchema {
    const rawEnumType = type.__raw;
    const namespace = getNamespace(rawEnumType);
    const valueType = this.processSchema(type.valueType, type.valueType.kind);

    const choices: ChoiceValue[] = [];
    type.values.forEach((it: SdkEnumValueType) =>
      choices.push(new ChoiceValue(it.name, it.doc ?? "", it.value ?? it.name)),
    );

    const schemaType = type.isFixed ? SealedChoiceSchema : ChoiceSchema;

    const schema = new schemaType(type.name ?? name, type.doc ?? "", {
      summary: type.summary,
      choiceType: valueType as any,
      choices: choices,
      language: {
        default: {
          namespace: namespace,
        },
        java: {
          namespace: this.getJavaNamespace(type),
        },
      },
    });
    schema.language.default.crossLanguageDefinitionId = type.crossLanguageDefinitionId;
    return this.codeModel.schemas.add(schema);
  }

  private processConstantSchema(type: SdkConstantType, name: string): ConstantSchema {
    const valueType = this.processSchema(type.valueType, type.valueType.kind);

    return this.codeModel.schemas.add(
      new ConstantSchema(type.name ?? name, type.doc ?? "", {
        summary: type.summary,
        valueType: valueType,
        value: new ConstantValue(type.value),
      }),
    );
  }

  private processConstantSchemaFromEnumValue(type: SdkEnumValueType, name: string): ConstantSchema {
    const valueType = this.processSchema(type.enumType, type.enumType.name);

    return this.codeModel.schemas.add(
      new ConstantSchema(type.name ?? name, type.doc ?? "", {
        summary: type.summary,
        valueType: valueType,
        value: new ConstantValue(type.value ?? type.name),
      }),
    );
  }

  private processUnixTimeSchema(type: SdkDateTimeType, name: string): UnixTimeSchema {
    return this.codeModel.schemas.add(
      new UnixTimeSchema(name, type.doc ?? "", {
        summary: type.summary,
      }),
    );
  }

  private processDateTimeSchema(
    type: SdkDateTimeType,
    name: string,
    rfc1123: boolean,
  ): DateTimeSchema {
    return this.codeModel.schemas.add(
      new DateTimeSchema(name, type.doc ?? "", {
        summary: type.summary,
        format: rfc1123 ? "date-time-rfc1123" : "date-time",
      }),
    );
  }

  private processDateSchema(type: SdkBuiltInType, name: string): DateSchema {
    return this.codeModel.schemas.add(
      new DateSchema(name, type.doc ?? "", {
        summary: type.summary,
      }),
    );
  }

  private processTimeSchema(type: SdkBuiltInType, name: string): TimeSchema {
    return this.codeModel.schemas.add(
      new TimeSchema(name, type.doc ?? "", {
        summary: type.summary,
      }),
    );
  }

  private processDurationSchema(
    type: SdkDurationType,
    name: string,
    format: DurationSchema["format"] = "duration-rfc3339",
  ): DurationSchema {
    return this.codeModel.schemas.add(
      new DurationSchema(name, type.doc ?? "", {
        summary: type.summary,
        format: format,
      }),
    );
  }

  private processUrlSchema(type: SdkBuiltInType, name: string): UriSchema {
    return this.codeModel.schemas.add(
      new UriSchema(name, type.doc ?? "", {
        summary: type.summary,
      }),
    );
  }

  private processObjectSchema(type: SdkModelType, name: string): ObjectSchema {
    const rawModelType = type.__raw;
    if (!name && !type.name) {
      reportDiagnostic(this.program, {
        code: "empty-name",
        target: rawModelType ?? NoTarget,
      });
    }
    const namespace = getNamespace(rawModelType);
    const objectSchema = new ObjectSchema(type.name ?? name, type.doc ?? "", {
      summary: type.summary,
      language: {
        default: {
          namespace: namespace,
        },
        java: {
          namespace: this.getJavaNamespace(type),
        },
      },
    });
    objectSchema.language.default.crossLanguageDefinitionId = type.crossLanguageDefinitionId;
    this.codeModel.schemas.add(objectSchema);

    // cache this now before we accidentally recurse on this type.
    if (!this.schemaCache.has(type)) {
      this.schemaCache.set(type, objectSchema);
    }

    // discriminator
    if (type.discriminatedSubtypes && type.discriminatorProperty) {
      objectSchema.discriminator = new Discriminator(
        this.processModelProperty(type.discriminatorProperty),
      );
      for (const discriminatorValue in type.discriminatedSubtypes) {
        const subType = type.discriminatedSubtypes[discriminatorValue];
        this.processSchema(subType, subType.name);
      }
    }

    // type is a subtype
    if (type.baseModel) {
      if (
        this.isBranded() &&
        type.baseModel.crossLanguageDefinitionId === AZURE_CORE_FOUNDATIONS_ERROR_ID
      ) {
        // com.azure.core.models.ResponseError class is final, we cannot extend it
        // therefore, copy all properties from "Error" to this class
        const parentSchema = this.processSchema(type.baseModel, type.baseModel.name);
        if (parentSchema instanceof ObjectSchema) {
          parentSchema.properties?.forEach((p) => {
            objectSchema.addProperty(p);
            // improve the casing for Java
            if (p.serializedName === "innererror") {
              p.language.default.name = "innerError";
              if (p.schema instanceof ObjectSchema) {
                p.schema.properties?.forEach((innerErrorProperty) => {
                  if (innerErrorProperty.serializedName === "innererror") {
                    innerErrorProperty.language.default.name = "innerError";
                  }
                });
              }
            }
          });
        }
      } else {
        const parentSchema = this.processSchema(type.baseModel, type.baseModel.name);
        objectSchema.parents = new Relations();
        objectSchema.parents.immediate.push(parentSchema);

        if (parentSchema instanceof ObjectSchema) {
          pushDistinct(objectSchema.parents.all, parentSchema);

          parentSchema.children = parentSchema.children || new Relations();
          pushDistinct(parentSchema.children.immediate, objectSchema);
          pushDistinct(parentSchema.children.all, objectSchema);

          if (parentSchema.parents) {
            pushDistinct(objectSchema.parents.all, ...parentSchema.parents.all);

            parentSchema.parents.all.forEach((it) => {
              if (it instanceof ObjectSchema && it.children) {
                pushDistinct(it.children.all, objectSchema);
              }
            });
          }
        }
        objectSchema.discriminatorValue = type.discriminatorValue;
      }
    }
    if (type.additionalProperties) {
      // model has additional property
      const sdkDictType: SdkDictionaryType = {
        kind: "dict",
        keyType: {
          kind: "string",
          encode: "string",
          decorators: [],
          name: "string",
          crossLanguageDefinitionId: type.crossLanguageDefinitionId,
        },
        doc: type.doc,
        valueType: type.additionalProperties,
        decorators: [],
      };
      const parentSchema = this.processSchema(sdkDictType, "Record");
      objectSchema.parents = objectSchema.parents ?? new Relations();
      objectSchema.parents.immediate.push(parentSchema);
      pushDistinct(objectSchema.parents.all, parentSchema);
      objectSchema.discriminatorValue = type.discriminatorValue;
    }

    // properties
    for (const prop of type.properties) {
      if (prop.kind === "property" && !prop.discriminator) {
        objectSchema.addProperty(this.processModelProperty(prop));
      }
    }

    return objectSchema;
  }

  private processModelProperty(prop: SdkModelPropertyType): Property {
    let nullable = false;
    let nonNullType = prop.type;
    if (nonNullType.kind === "nullable") {
      nullable = true;
      nonNullType = nonNullType.type;
    }
    let schema;

    let extensions: Record<string, any> | undefined = undefined;
    if (this.isSecret(prop)) {
      extensions = extensions ?? {};
      extensions["x-ms-secret"] = true;
      // if the property does not return in response, it had to be nullable
      nullable = true;
    }
    if (prop.kind === "property" && prop.flatten) {
      extensions = extensions ?? {};
      extensions["x-ms-client-flatten"] = true;
    }
    const mutability = this.getMutability(prop);
    if (mutability) {
      extensions = extensions ?? {};
      extensions["x-ms-mutability"] = mutability;
    }

    if (prop.kind === "property" && prop.serializationOptions.multipart) {
      if (prop.serializationOptions.multipart?.isFilePart) {
        schema = this.processMultipartFormDataFilePropertySchema(prop);
      } else if (
        prop.type.kind === "model" &&
        prop.type.properties.some((it) => it.kind === "body")
      ) {
        // TODO: this is HttpPart of non-File. TCGC should help handle this.
        schema = this.processSchema(
          prop.type.properties.find((it) => it.kind === "body")!.type,
          "",
        );
      } else {
        schema = this.processSchema(nonNullType, "");
      }
    } else {
      schema = this.processSchema(nonNullType, "");
    }

    return new Property(prop.name, prop.doc ?? "", schema, {
      summary: prop.summary,
      required: !prop.optional,
      nullable: nullable,
      readOnly: this.isReadOnly(prop),
      serializedName: prop.kind === "property" ? getPropertySerializedName(prop) : undefined,
      extensions: extensions,
    });
  }

  private processUnionSchema(type: SdkUnionType, name: string): Schema {
    if (!(type.__raw && type.__raw.kind === "Union")) {
      reportDiagnostic(this.program, {
        code: "unrecognized-type",
        messageId: "unionType",
        format: { typeKind: type.kind },
        target: type.__raw ?? NoTarget,
      });
    }
    const rawUnionType: Union = type.__raw as Union;
    const namespace = getNamespace(rawUnionType);
    const baseName = type.name ?? pascalCase(name) + "Model";
    this.trace(
      `Convert TypeSpec Union '${getUnionDescription(rawUnionType, this.typeNameOptions)}' to Class '${baseName}'`,
    );
    const unionSchema = new OrSchema(baseName + "Base", type.doc ?? "", {
      summary: type.summary,
    });
    unionSchema.anyOf = [];
    type.variantTypes.forEach((it) => {
      const variantName = this.getUnionVariantName(it.__raw, { depth: 0 });
      const modelName = variantName + baseName;
      const propertyName = "value";

      // these ObjectSchema is not added to codeModel.schemas
      const objectSchema = new ObjectSchema(modelName, it.doc ?? "", {
        summary: it.summary,
        language: {
          default: {
            namespace: namespace,
          },
          java: {
            namespace: this.getJavaNamespace(),
          },
        },
      });

      const variantSchema = this.processSchema(it, variantName);
      objectSchema.addProperty(
        new Property(propertyName, type.doc ?? "", variantSchema, {
          summary: type.summary,
          required: true,
          readOnly: false,
        }),
      );
      unionSchema.anyOf.push(objectSchema);
    });
    return this.codeModel.schemas.add(unionSchema);
  }

  private processBinarySchema(type: SdkBuiltInType): BinarySchema {
    return this.codeModel.schemas.add(
      new BinarySchema(type.doc ?? "", {
        summary: type.summary,
      }),
    );
  }

  private getUnionVariantName(type: Type | undefined, option: any): string {
    if (type === undefined) {
      this.trace("Union variant type is undefined.");
      return "UnionVariant";
    }
    switch (type.kind) {
      case "Scalar": {
        const scalarName = type.name;
        let name = type.name;
        if (
          scalarName.startsWith("int") ||
          scalarName.startsWith("uint") ||
          scalarName === "safeint"
        ) {
          name = scalarName === "safeint" || scalarName.includes("int64") ? "Long" : "Integer";
        } else if (scalarName.startsWith("float")) {
          name = "Double";
        } else if (scalarName === "bytes") {
          name = "ByteArray";
        } else if (scalarName === "utcDateTime" || scalarName === "offsetDateTime") {
          name = "Time";
        }
        return pascalCase(name);
      }
      case "Enum":
        return pascalCase(type.name);
      case "Model":
        if (isArrayModelType(this.program, type)) {
          ++option.depth;
          if (option.depth === 1) {
            return this.getUnionVariantName(type.indexer.value, option) + "List";
          } else {
            return "ListOf" + this.getUnionVariantName(type.indexer.value, option);
          }
        } else if (isRecordModelType(this.program, type)) {
          ++option.depth;
          if (option.depth === 1) {
            return this.getUnionVariantName(type.indexer.value, option) + "Map";
          } else {
            return "MapOf" + this.getUnionVariantName(type.indexer.value, option);
          }
        } else {
          return pascalCase(type.name);
        }
      case "String":
        return pascalCase(type.value);
      case "Number":
        return pascalCase(type.valueAsString);
      case "Boolean":
        return pascalCase(type.value ? "True" : "False");
      case "Union":
        return type.name ?? "Union";
      case "UnionVariant":
        return (typeof type.name === "string" ? type.name : undefined) ?? "UnionVariant";
      default:
        this.trace(`Unrecognized type for union variable: '${type.kind}'.`);
        return "UnionVariant";
    }
  }

  private processMultipartFormDataFilePropertySchema(property: SdkBodyModelPropertyType): Schema {
    const processSchemaFunc = (type: SdkType) => this.processSchema(type, "");
    const processNamespaceFunc = (type: SdkBuiltInType | SdkModelType) => {
      const namespace =
        type.kind === "model" ? (getNamespace(type.__raw) ?? this.namespace) : this.namespace;
      const javaNamespace =
        type.kind === "model" ? this.getJavaNamespace(type) : this.getJavaNamespace();
      return { namespace, javaNamespace };
    };

    if (property.type.kind === "bytes" || property.type.kind === "model") {
      const namespaceTuple = processNamespaceFunc(property.type);
      return getFileDetailsSchema(
        property,
        namespaceTuple.namespace,
        namespaceTuple.javaNamespace,
        this.codeModel.schemas,
        this.binarySchema,
        this.stringSchema,
        processSchemaFunc,
      );
    } else if (
      property.type.kind === "array" &&
      (property.type.valueType.kind === "bytes" || property.type.valueType.kind === "model")
    ) {
      const namespaceTuple = processNamespaceFunc(property.type.valueType);
      return new ArraySchema(
        property.name,
        property.doc ?? "",
        getFileDetailsSchema(
          property,
          namespaceTuple.namespace,
          namespaceTuple.javaNamespace,
          this.codeModel.schemas,
          this.binarySchema,
          this.stringSchema,
          processSchemaFunc,
        ),
        {
          summary: property.summary,
        },
      );
    } else {
      const diagnostic = createDiagnostic({
        code: "unrecognized-type",
        messageId: "multipartFormData",
        format: { typeKind: property.type.kind },
        target: property.type.__raw ?? NoTarget,
      });
      throw new DiagnosticError(diagnostic);
    }
  }

  private getDoc(target: Type | undefined): string {
    return target ? getDoc(this.program, target) || "" : "";
  }

  private getSummary(target: Type | undefined): string | undefined {
    return target ? getSummary(this.program, target) : undefined;
  }

  private isReadOnly(target: SdkModelPropertyType): boolean {
    const segment = target.__raw ? getSegment(this.program, target.__raw) !== undefined : false;
    if (segment) {
      return true;
    } else {
      const visibility = target.kind === "property" ? target.visibility : undefined;
      if (visibility) {
        return (
          !visibility.includes(Visibility.All) &&
          !visibility.includes(Visibility.Create) &&
          !visibility.includes(Visibility.Update) &&
          !visibility.includes(Visibility.Delete) &&
          !visibility.includes(Visibility.Query)
        );
      } else {
        return false;
      }
    }
  }

  private isSecret(target: SdkModelPropertyType): boolean {
    if (target.kind === "property" && target.visibility) {
      return !target.visibility.includes(Visibility.Read);
    } else {
      return false;
    }
  }

  private getMutability(target: SdkModelPropertyType): string[] | undefined {
    if (target.kind === "property" && target.visibility) {
      const mutability: string[] = [];
      if (target.visibility.includes(Visibility.Create)) {
        mutability.push("create");
      }
      if (target.visibility.includes(Visibility.Update)) {
        mutability.push("update");
      }
      if (target.visibility.includes(Visibility.Read)) {
        mutability.push("read");
      }
      if (mutability.length === 3) {
        // if all 3 (supported) mutability values are present, there is no need to set the x-ms-mutability
        return undefined;
      } else {
        return mutability;
      }
    } else {
      return undefined;
    }
  }

  private getConvenienceApiName(sdkMethod: SdkServiceMethod<SdkHttpOperation>): string | undefined {
    // check @convenienceAPI
    if (sdkMethod.generateConvenient) {
      return sdkMethod.name;
    } else {
      return undefined;
    }
  }

  private getBaseJavaNamespace(): string {
    // hack, just find the shortest clientNamespace among all clients
    // hopefully it is the root namespace of the SDK
    let baseJavaNamespace: string | undefined = undefined;
    this.sdkContext.sdkPackage.clients
      .map((it) => it.namespace)
      .forEach((it) => {
        if (baseJavaNamespace === undefined || baseJavaNamespace.length > it.length) {
          baseJavaNamespace = it;
        }
      });
    // fallback if there is no client
    if (!baseJavaNamespace) {
      baseJavaNamespace = this.namespace;
    }
    return this.escapeJavaNamespace(baseJavaNamespace.toLowerCase());
  }

  private getJavaNamespace(
    type:
      | SdkModelType
      | SdkEnumType
      | SdkUnionType
      | SdkClientType<SdkHttpOperation>
      | undefined = undefined,
  ): string | undefined {
    // clientNamespace from TCGC
    const clientNamespace: string | undefined = type?.namespace;

    if (type) {
      const crossLanguageDefinitionId = type.crossLanguageDefinitionId;
      if (this.isBranded()) {
        // special handling for namespace of model that cannot be mapped to azure-core
        if (crossLanguageDefinitionId === "TypeSpec.Http.File") {
          // TypeSpec.Http.File
          return this.baseJavaNamespace;
        } else if (crossLanguageDefinitionId === "Azure.Core.Foundations.OperationState") {
          // Azure.Core.OperationState
          return this.baseJavaNamespace;
        } else if (
          crossLanguageDefinitionId === "Azure.Core.ResourceOperationStatus" ||
          crossLanguageDefinitionId === "Azure.Core.Foundations.OperationStatus"
        ) {
          // Azure.Core.ResourceOperationStatus<>
          // Azure.Core.Foundations.OperationStatus<>
          // usually this model will not be generated, but javadoc of protocol method requires it be in SDK namespace
          return this.baseJavaNamespace;
        } else if (crossLanguageDefinitionId === "Azure.Core.Foundations.InnerError") {
          // Azure.Core.Foundations.InnerError
          // this model could be generated, if a model extends Error
          return this.baseJavaNamespace;
        } else if (type.crossLanguageDefinitionId.startsWith("Azure.ResourceManager.")) {
          // models in Azure.ResourceManager
          return this.baseJavaNamespace;
        }
      } else {
        // special handling for namespace of model in TypeSpec
        if (crossLanguageDefinitionId === "TypeSpec.Http.File") {
          // TypeSpec.Http.File
          return this.baseJavaNamespace;
        } else if (crossLanguageDefinitionId.startsWith("TypeSpec.Rest.Resource.")) {
          // models in TypeSpec.Rest.Resource
          return this.baseJavaNamespace;
        }
      }
    }

    if (this.legacyJavaNamespace || !clientNamespace) {
      return this.baseJavaNamespace;
    } else {
      return this.escapeJavaNamespace(clientNamespace.toLowerCase());
    }
  }

  private escapeJavaNamespace(namespace: string): string {
    if (this.javaNamespaceCache.has(namespace)) {
      return this.javaNamespaceCache.get(namespace)!;
    } else {
      const processedJavaNamespace = namespace
        .split(".")
        .map((segment) => escapeJavaKeywords(segment, "namespace"))
        .join(".");
      if (processedJavaNamespace !== namespace) {
        reportDiagnostic(this.program, {
          code: "invalid-java-namespace",
          format: { namespace: namespace, processedNamespace: processedJavaNamespace },
          target: NoTarget,
        });
      }
      this.javaNamespaceCache.set(namespace, processedJavaNamespace);
      return processedJavaNamespace;
    }
  }

  private trace(msg: string) {
    trace(this.program, msg);
  }

  private _stringSchema?: StringSchema;
  get stringSchema(): StringSchema {
    return (
      this._stringSchema ||
      (this._stringSchema = this.codeModel.schemas.add(new StringSchema("string", "simple string")))
    );
  }

  private _integerSchema?: NumberSchema;
  get integerSchema(): NumberSchema {
    return (
      this._integerSchema ||
      (this._integerSchema = this.codeModel.schemas.add(
        new NumberSchema("integer", "simple integer", SchemaType.Integer, 64),
      ))
    );
  }

  private _doubleSchema?: NumberSchema;
  get doubleSchema(): NumberSchema {
    return (
      this._doubleSchema ||
      (this._doubleSchema = this.codeModel.schemas.add(
        new NumberSchema("double", "simple float", SchemaType.Number, 64),
      ))
    );
  }

  private _booleanSchema?: BooleanSchema;
  get booleanSchema(): BooleanSchema {
    return (
      this._booleanSchema ||
      (this._booleanSchema = this.codeModel.schemas.add(
        new BooleanSchema("boolean", "simple boolean"),
      ))
    );
  }

  private _anySchema?: AnySchema;
  get anySchema(): AnySchema {
    return (
      this._anySchema ?? (this._anySchema = this.codeModel.schemas.add(new AnySchema("Anything")))
    );
  }

  private _binarySchema?: BinarySchema;
  get binarySchema(): BinarySchema {
    return (
      this._binarySchema ||
      (this._binarySchema = this.codeModel.schemas.add(new BinarySchema("simple binary")))
    );
  }

  private _pollResultSchema?: ObjectSchema;
  get pollResultSchema(): ObjectSchema {
    return (
      this._pollResultSchema ??
      (this._pollResultSchema = createPollOperationDetailsSchema(
        this.codeModel.schemas,
        this.stringSchema,
      ))
    );
  }

  private createApiVersionParameter(
    serializedName: string,
    parameterLocation: ParameterLocation,
    value = "",
  ): Parameter {
    return new Parameter(
      serializedName,
      "Version parameter",
      this.codeModel.schemas.add(
        new ConstantSchema(serializedName, "API Version", {
          valueType: this.stringSchema,
          value: new ConstantValue(value),
        }),
      ),
      {
        implementation: ImplementationLocation.Client,
        origin: ORIGIN_API_VERSION,
        required: true,
        protocol: {
          http: new HttpParameter(parameterLocation),
        },
        language: {
          default: {
            serializedName: serializedName,
          },
        },
      },
    );
  }

  private isApiVersionParameter(param: SdkHttpOperationParameterType): boolean {
    return param.isApiVersionParam;
  }

  private _apiVersionParameter?: Parameter;
  private _apiVersionParameterInPath?: Parameter;
  private _apiVersionParameterInHeader?: Parameter;
  private _armApiVersionParameter?: Parameter;

  private getApiVersionParameter(
    param: SdkQueryParameter | SdkPathParameter | SdkHeaderParameter,
  ): Parameter {
    // apiVersionParameter is cached by param.kind
    // we didn't expect Azure service have more than 1 type of api-version, and certainly not more than 1 of each kind.
    if (param.kind === "query") {
      return (
        this._apiVersionParameter ||
        (this._apiVersionParameter = this.createApiVersionParameter(
          param.serializedName,
          ParameterLocation.Query,
        ))
      );
    } else if (param.kind === "path") {
      return (
        this._apiVersionParameterInPath ||
        (this._apiVersionParameterInPath = this.createApiVersionParameter(
          param.serializedName,
          ParameterLocation.Path,
        ))
      );
    } else {
      // param.kind === "header"
      return (
        this._apiVersionParameterInHeader ||
        (this._apiVersionParameterInHeader = this.createApiVersionParameter(
          param.serializedName,
          ParameterLocation.Header,
        ))
      );
    }
  }

  private isSubscriptionId(param: SdkPathParameter): boolean {
    return "subscriptionId".toLocaleLowerCase() === param.serializedName.toLocaleLowerCase();
  }

  private subscriptionIdParameter(parameter: SdkPathParameter): Parameter {
    if (!this._subscriptionParameter) {
      const description = parameter.doc;
      this._subscriptionParameter = new Parameter(
        "subscriptionId",
        description ? description : "The ID of the target subscription.",
        this.stringSchema,
        {
          implementation: ImplementationLocation.Client,
          required: true,
          protocol: {
            http: new HttpParameter(ParameterLocation.Path),
          },
          language: {
            default: {
              serializedName: "subscriptionId",
            },
          },
        },
      );
    }
    return this._subscriptionParameter;
  }

  private _subscriptionParameter?: Parameter;

  private propagateSchemaUsage(schema: Schema): void {
    const processedSchemas = new Set<Schema>();

    const innerApplySchemaUsage = (schema: Schema, schemaUsage: SchemaUsage) => {
      this.trackSchemaUsage(schema, schemaUsage);
      innerPropagateSchemaUsage(schema, schemaUsage);
    };

    const innerPropagateSchemaUsage = (schema: Schema, schemaUsage: SchemaUsage) => {
      if (processedSchemas.has(schema)) {
        return;
      }

      processedSchemas.add(schema);
      if (schema instanceof ObjectSchema || schema instanceof GroupSchema) {
        let skipPropergateProperties = false;
        if (
          this.isBranded() &&
          schema.language.default.crossLanguageDefinitionId === AZURE_CORE_FOUNDATIONS_ERROR_ID
        ) {
          // a temporary hack to avoid propergate usage for Azure.Core.Foundations.Error
          // the reason is that the InnerError within cannot be mapped to azure-core ResponseInnerError, as that class is not public
          // so generator had to generate the class, if used outside of Azure.Core.Foundations.Error (e.g., when a model extends Error)
          skipPropergateProperties = true;
        }

        if (schemaUsage.usage || schemaUsage.serializationFormats) {
          if (!skipPropergateProperties) {
            schema.properties?.forEach((p) => {
              if (p.readOnly && schemaUsage.usage?.includes(SchemaContext.Input)) {
                const schemaUsageWithoutInput = {
                  usage: schemaUsage.usage.filter((it) => it !== SchemaContext.Input),
                  serializationFormats: schemaUsage.serializationFormats,
                };
                innerApplySchemaUsage(p.schema, schemaUsageWithoutInput);
              } else {
                innerApplySchemaUsage(p.schema, schemaUsage);
              }
            });
          }

          if (schema instanceof ObjectSchema) {
            schema.parents?.all?.forEach((p) => innerApplySchemaUsage(p, schemaUsage));
            schema.parents?.immediate?.forEach((p) => innerApplySchemaUsage(p, schemaUsage));

            if (schema.discriminator) {
              // propagate access/usage to immediate children, if the schema is a discriminated model
              // if the schema is not a discriminated model, its children likely not valid for the mode/API
              // TODO: it does not handle the case that concrete model (kind: "type1") for the discriminated model have depth larger than 1 (e.g. kind: "type1" | "type2" in middle)
              schema.children?.immediate?.forEach((c) => innerApplySchemaUsage(c, schemaUsage));
            }

            if (schema.discriminator?.property?.schema) {
              innerApplySchemaUsage(schema.discriminator?.property?.schema, schemaUsage);
            }
          }
        }
      } else if (schema instanceof DictionarySchema) {
        innerApplySchemaUsage(schema.elementType, schemaUsage);
      } else if (schema instanceof ArraySchema) {
        innerApplySchemaUsage(schema.elementType, schemaUsage);
      } else if (schema instanceof OrSchema) {
        schema.anyOf?.forEach((it) => innerApplySchemaUsage(it, schemaUsage));
      } else if (schema instanceof ConstantSchema) {
        innerApplySchemaUsage(schema.valueType, schemaUsage);
      }
    };

    // Exclude context that not to be propagated
    const updatedSchemaUsage = (schema as SchemaUsage).usage?.filter(
      (it) => it !== SchemaContext.Paged && it !== SchemaContext.PublicSpread,
    );
    const indexSpread = (schema as SchemaUsage).usage?.indexOf(SchemaContext.PublicSpread);
    if (
      updatedSchemaUsage &&
      indexSpread &&
      indexSpread >= 0 &&
      !(schema as SchemaUsage).usage?.includes(SchemaContext.Public)
    ) {
      // Propagate Public, if schema is PublicSpread
      updatedSchemaUsage.push(SchemaContext.Public);
    }
    const schemaUsage = {
      usage: updatedSchemaUsage,
      serializationFormats: (schema as SchemaUsage).serializationFormats?.filter(
        (it) => it !== KnownMediaType.Multipart,
      ),
    };
    // Propagate the usage of the initial schema itself
    innerPropagateSchemaUsage(schema, schemaUsage);
  }

  private trackSchemaUsage(schema: Schema, schemaUsage: SchemaUsage): void {
    if (
      schema instanceof ObjectSchema ||
      schema instanceof GroupSchema ||
      schema instanceof ChoiceSchema ||
      schema instanceof SealedChoiceSchema ||
      schema instanceof OrSchema ||
      schema instanceof ConstantSchema
    ) {
      if (schemaUsage.usage) {
        pushDistinct((schema.usage = schema.usage || []), ...schemaUsage.usage);
      }
      if (schemaUsage.serializationFormats) {
        pushDistinct(
          (schema.serializationFormats = schema.serializationFormats || []),
          ...schemaUsage.serializationFormats,
        );
      }
    } else if (schema instanceof DictionarySchema) {
      this.trackSchemaUsage(schema.elementType, schemaUsage);
    } else if (schema instanceof ArraySchema) {
      this.trackSchemaUsage(schema.elementType, schemaUsage);
    }
  }

  private isArm(): boolean {
    return Boolean(this.codeModel.arm);
  }
}
