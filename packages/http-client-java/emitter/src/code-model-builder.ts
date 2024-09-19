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
  SdkHttpOperation,
  SdkHttpResponse,
  SdkLroPagingServiceMethod,
  SdkLroServiceMethod,
  SdkMethod,
  SdkModelPropertyType,
  SdkModelType,
  SdkPathParameter,
  SdkQueryParameter,
  SdkServiceMethod,
  SdkType,
  SdkUnionType,
  createSdkContext,
  getAllModels,
  getClientType,
  getWireName,
  isApiVersion,
  isSdkBuiltInKind,
  isSdkIntKind,
} from "@azure-tools/typespec-client-generator-core";
import {
  EmitContext,
  Interface,
  Model,
  ModelProperty,
  Namespace,
  Operation,
  Program,
  Type,
  TypeNameOptions,
  Union,
  getDoc,
  getEffectiveModelType,
  getNamespaceFullName,
  getOverloadedOperation,
  getSummary,
  getVisibility,
  isArrayModelType,
  isRecordModelType,
  listServices,
} from "@typespec/compiler";
import {
  Authentication,
  HttpOperation,
  HttpStatusCodeRange,
  HttpStatusCodesEntry,
  Visibility,
  getAuthentication,
  getHeaderFieldName,
  getPathParamName,
  getQueryParamName,
  isHeader,
  isPathParam,
  isQueryParam,
} from "@typespec/http";
import { getSegment } from "@typespec/rest";
import { getAddedOnVersions } from "@typespec/versioning";
import { fail } from "assert";
import pkg from "lodash";
import {
  Client as CodeModelClient,
  CrossLanguageDefinition,
  EncodedSchema,
} from "./common/client.js";
import { CodeModel } from "./common/code-model.js";
import { LongRunningMetadata } from "./common/long-running-metadata.js";
import { Operation as CodeModelOperation, ConvenienceApi, Request } from "./common/operation.js";
import { ChoiceSchema, SealedChoiceSchema } from "./common/schemas/choice.js";
import { ConstantSchema, ConstantValue } from "./common/schemas/constant.js";
import { OrSchema } from "./common/schemas/relationship.js";
import { DurationSchema } from "./common/schemas/time.js";
import { SchemaContext, SchemaUsage } from "./common/schemas/usage.js";
import { EmitterOptions } from "./emitter.js";
import { createPollOperationDetailsSchema, getFileDetailsSchema } from "./external-schemas.js";
import { ClientContext } from "./models.js";
import {
  CONTENT_TYPE_KEY,
  ORIGIN_API_VERSION,
  SPECIAL_HEADER_NAMES,
  cloneOperationParameter,
  getServiceVersion,
  isKnownContentType,
  isLroNewPollingStrategy,
  isPayloadProperty,
  operationIsJsonMergePatch,
  operationIsMultipart,
  operationIsMultipleContentTypes,
} from "./operation-utils.js";
import {
  ProcessingCache,
  getAccess,
  getDurationFormat,
  getNonNullSdkType,
  getUnionDescription,
  getUsage,
  isStable,
  modelIs,
  pushDistinct,
} from "./type-utils.js";
import {
  getNamespace,
  logWarning,
  pascalCase,
  removeClientSuffix,
  stringArrayContainsIgnoreCase,
  trace,
} from "./utils.js";
const { isEqual } = pkg;

export class CodeModelBuilder {
  private program: Program;
  private typeNameOptions: TypeNameOptions;
  private namespace: string;
  private sdkContext!: SdkContext;
  private options: EmitterOptions;
  private codeModel: CodeModel;
  private emitterContext: EmitContext<EmitterOptions>;
  private serviceNamespace: Namespace | Interface | Operation;

  private loggingEnabled: boolean = false;

  readonly schemaCache = new ProcessingCache((type: SdkType, name: string) =>
    this.processSchemaImpl(type, name),
  );
  readonly typeUnionRefCache = new Map<Type, Union | null | undefined>(); // Union means it ref a Union type, null means it does not ref any Union, undefined means type visited but not completed

  // current apiVersion name to generate code
  private apiVersion: string | undefined;

  public constructor(program1: Program, context: EmitContext<EmitterOptions>) {
    this.options = context.options;
    this.program = program1;
    this.emitterContext = context;
    if (this.options["dev-options"]?.loglevel) {
      this.loggingEnabled = true;
    }

    if (this.options["skip-special-headers"]) {
      this.options["skip-special-headers"].forEach((it) =>
        SPECIAL_HEADER_NAMES.add(it.toLowerCase()),
      );
    }

    const service = listServices(this.program)[0];
    if (!service) {
      throw Error("TypeSpec for HTTP must define a service.");
    }
    this.serviceNamespace = service.type;

    this.namespace = getNamespaceFullName(this.serviceNamespace) || "Azure.Client";
    // java namespace
    const javaNamespace = this.getJavaNamespace(this.namespace);

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
        java: {
          namespace: javaNamespace,
        },
      },
    });
  }

  public async build(): Promise<CodeModel> {
    this.sdkContext = await createSdkContext(this.emitterContext, "@typespec/http-client-java", {
      versioning: { previewStringRegex: /$/ },
    }); // include all versions and do the filter by ourselves

    // auth
    // TODO: it is not very likely, but different client could have different auth
    const auth = getAuthentication(this.program, this.serviceNamespace);
    if (auth) {
      this.processAuth(auth);
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
      if (arg.isApiVersionParam) {
        parameter = this.createApiVersionParameter(arg.name, ParameterLocation.Uri);
      } else {
        const schema = this.processSchema(arg.type, arg.name);
        this.trackSchemaUsage(schema, {
          usage: [SchemaContext.Input, SchemaContext.Output /*SchemaContext.Public*/],
        });
        parameter = new Parameter(arg.name, arg.description ?? "", schema, {
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
          // TODO: deprecate this logic of string/url for x-ms-skip-url-encoding
          extensions: {
            "x-ms-skip-url-encoding": schema instanceof UriSchema,
          },
          clientDefaultValue: arg.clientDefaultValue,
        });
      }
      hostParameters.push(this.codeModel.addGlobalParameter(parameter));
    });

    return hostParameters;
  }

  private processAuth(auth: Authentication) {
    const securitySchemes: SecurityScheme[] = [];
    for (const option of auth.options) {
      for (const scheme of option.schemes) {
        switch (scheme.type) {
          case "oauth2":
            {
              const oauth2Scheme = new OAuth2SecurityScheme({
                scopes: [],
              });
              scheme.flows.forEach((it) =>
                oauth2Scheme.scopes.push(...it.scopes.map((it) => it.value)),
              );
              securitySchemes.push(oauth2Scheme);
            }
            break;

          case "apiKey":
            {
              const keyScheme = new KeySecurityScheme({
                name: scheme.name,
              });
              securitySchemes.push(keyScheme);
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
                  this.logWarning(`${scheme.scheme} auth method is currently not supported.`);
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
    return !this.options["flavor"] || this.options["flavor"].toLocaleLowerCase() === "azure";
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
      // skip models under "com.azure.core."
      if (name && !schema.language.java?.namespace?.startsWith("com.azure.core.")) {
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
      let clientName = client.name;
      let javaNamespace = this.getJavaNamespace(this.namespace);
      const clientFullName = client.name;
      const clientNameSegments = clientFullName.split(".");
      if (clientNameSegments.length > 1) {
        clientName = clientNameSegments.at(-1)!;
        const clientSubNamespace = clientNameSegments.slice(0, -1).join(".");
        javaNamespace = this.getJavaNamespace(this.namespace + "." + clientSubNamespace);
      }

      const codeModelClient = new CodeModelClient(clientName, client.details ?? "", {
        summary: client.description,
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
      codeModelClient.crossLanguageDefinitionId = client.crossLanguageDefinitionId;

      // versioning
      const versions = client.apiVersions;
      if (versions && versions.length > 0) {
        if (!this.sdkContext.apiVersion || ["all", "latest"].includes(this.sdkContext.apiVersion)) {
          this.apiVersion = versions[versions.length - 1];
        } else {
          this.apiVersion = versions.find((it: string) => it === this.sdkContext.apiVersion);
          if (!this.apiVersion) {
            throw new Error("Unrecognized api-version: " + this.sdkContext.apiVersion);
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
      client.initialization.properties.forEach((initializationProperty) => {
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
              throw new Error("Multiple server url defined for one client is not supported yet.");
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

      // preprocess operation groups and operations
      // operations without operation group
      const serviceMethodsWithoutSubClient = this.listServiceMethodsUnderClient(client);
      let codeModelGroup = new OperationGroup("");
      for (const serviceMethod of serviceMethodsWithoutSubClient) {
        if (!this.needToSkipProcessingOperation(serviceMethod.__raw, clientContext)) {
          codeModelGroup.addOperation(this.processOperation(serviceMethod, clientContext, ""));
        }
      }
      if (codeModelGroup.operations?.length > 0) {
        codeModelClient.operationGroups.push(codeModelGroup);
      }

      // operations under operation groups
      const subClients = this.listSubClientsUnderClient(client, true, true);
      for (const subClient of subClients) {
        const serviceMethods = this.listServiceMethodsUnderClient(subClient);
        // operation group with no operation is skipped
        if (serviceMethods.length > 0) {
          codeModelGroup = new OperationGroup(subClient.name);
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
    }
  }

  private listSubClientsUnderClient(
    client: SdkClientType<SdkHttpOperation>,
    includeNestedOperationGroups: boolean,
    isRootClient: boolean,
  ): SdkClientType<SdkHttpOperation>[] {
    const operationGroups: SdkClientType<SdkHttpOperation>[] = [];
    for (const method of client.methods) {
      if (method.kind === "clientaccessor") {
        const subClient = method.response;
        if (!isRootClient) {
          // if it is not root client, append the parent client's name
          subClient.name =
            removeClientSuffix(client.name) + removeClientSuffix(pascalCase(subClient.name));
        }
        operationGroups.push(subClient);
        if (includeNestedOperationGroups) {
          for (const operationGroup of this.listSubClientsUnderClient(
            subClient,
            includeNestedOperationGroups,
            false,
          )) {
            operationGroups.push(operationGroup);
          }
        }
      }
    }
    return operationGroups;
  }

  private listServiceMethodsUnderClient(
    client: SdkClientType<SdkHttpOperation>,
  ): SdkServiceMethod<SdkHttpOperation>[] {
    const methods: SdkServiceMethod<SdkHttpOperation>[] = [];
    for (const method of client.methods) {
      if (method.kind !== "clientaccessor") {
        methods.push(method);
      }
    }
    return methods;
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
      .filter((version) => !excludePreview || !isStable(pinnedApiVersion) || isStable(version));
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
    const operationGroup = this.codeModel.getOperationGroup(groupName);

    const operationExamples = this.getOperationExample(sdkMethod);

    const codeModelOperation = new CodeModelOperation(operationName, sdkMethod.details ?? "", {
      operationId: operationId,
      summary: sdkMethod.description,
      extensions: {
        "x-ms-examples": operationExamples,
      },
    });

    (codeModelOperation as CrossLanguageDefinition).crossLanguageDefinitionId =
      sdkMethod.crossLanguageDefintionId;
    codeModelOperation.internalApi = sdkMethod.access === "internal";

    const convenienceApiName = this.getConvenienceApiName(sdkMethod);
    let generateConvenienceApi: boolean = sdkMethod.generateConvenient;
    let generateProtocolApi: boolean = sdkMethod.generateProtocol;

    let apiComment: string | undefined = undefined;
    if (generateConvenienceApi) {
      // check if the convenience API need to be disabled for some special cases
      if (operationIsMultipart(httpOperation)) {
        // do not generate protocol method for multipart/form-data, as it be very hard for user to prepare the request body as BinaryData
        generateProtocolApi = false;
        apiComment = `Protocol API requires serialization of parts with content-disposition and data, as operation '${operationName}' is 'multipart/form-data'`;
        this.logWarning(apiComment);
      } else if (operationIsMultipleContentTypes(httpOperation)) {
        // and multiple content types
        // issue link: https://github.com/Azure/autorest.java/issues/1958#issuecomment-1562558219
        generateConvenienceApi = false;
        apiComment = `Convenience API is not generated, as operation '${operationName}' is multiple content-type`;
        this.logWarning(apiComment);
      } else if (
        operationIsJsonMergePatch(httpOperation) &&
        this.options["stream-style-serialization"] === false
      ) {
        // do not generate convenient method for json merge patch operation if stream-style-serialization is not enabled
        generateConvenienceApi = false;
        apiComment = `Convenience API is not generated, as operation '${operationName}' is 'application/merge-patch+json' and stream-style-serialization is not enabled`;
        this.logWarning(apiComment);
      }
    }
    if (generateConvenienceApi && convenienceApiName) {
      codeModelOperation.convenienceApi = new ConvenienceApi(convenienceApiName);
    }
    if (apiComment) {
      codeModelOperation.language.java = new Language();
      codeModelOperation.language.java.comment = apiComment;
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
    if (httpOperation.bodyParam && httpOperation.__raw && httpOperation.bodyParam.type.__raw) {
      this.processParameterBody(
        codeModelOperation,
        httpOperation.__raw,
        httpOperation,
        httpOperation.bodyParam,
      );
    }

    // group ETag header parameters, if exists
    if (this.options["group-etag-headers"]) {
      this.processEtagHeaderParameters(codeModelOperation, sdkMethod.operation);
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
    this.processRouteForPaged(codeModelOperation, sdkMethod.operation.responses, sdkMethod);

    // check for long-running operation
    this.processRouteForLongRunning(codeModelOperation, lroMetadata);

    operationGroup.addOperation(codeModelOperation);

    return codeModelOperation;
  }

  private processRouteForPaged(
    op: CodeModelOperation,
    responses: SdkHttpResponse[],
    sdkMethod: SdkMethod<SdkHttpOperation>,
  ) {
    if (sdkMethod.kind === "paging" || sdkMethod.kind === "lropaging") {
      for (const response of responses) {
        const bodyType = response.type;
        if (bodyType && bodyType.kind === "model") {
          const itemName = sdkMethod.response.resultPath;
          const nextLinkName = sdkMethod.nextLinkPath;
          if (itemName && nextLinkName) {
            op.extensions = op.extensions ?? {};
            op.extensions["x-ms-pageable"] = {
              itemName: itemName,
              nextLinkName: nextLinkName,
            };

            op.responses?.forEach((r) => {
              if (r instanceof SchemaResponse) {
                this.trackSchemaUsage(r.schema, { usage: [SchemaContext.Paged] });
              }
            });
            break;
          }
        }
      }
    }
  }

  private processLroMetadata(
    op: CodeModelOperation,
    sdkMethod: SdkLroServiceMethod<SdkHttpOperation> | SdkLroPagingServiceMethod<SdkHttpOperation>,
  ): LongRunningMetadata {
    const trackConvenienceApi: boolean = Boolean(op.convenienceApi);

    const lroMetadata = sdkMethod.__raw_lro_metadata;
    // needs lroMetadata.statusMonitorStep, as getLroMetadata would return for @pollingOperation operation
    if (lroMetadata && lroMetadata.pollingInfo && lroMetadata.statusMonitorStep) {
      let pollingSchema = undefined;
      let finalSchema = undefined;

      let pollingStrategy: Metadata | undefined = undefined;
      let finalResultPropertySerializedName: string | undefined = undefined;

      const verb = sdkMethod.operation.verb;
      const useNewPollStrategy = isLroNewPollingStrategy(sdkMethod.operation.__raw, lroMetadata);
      if (useNewPollStrategy) {
        // use OperationLocationPollingStrategy
        pollingStrategy = new Metadata({
          language: {
            java: {
              name: "OperationLocationPollingStrategy",
              namespace: this.getJavaNamespace(this.namespace) + ".implementation",
            },
          },
        });
      }

      // pollingSchema
      if (
        modelIs(lroMetadata.pollingInfo.responseModel, "OperationStatus", "Azure.Core.Foundations")
      ) {
        pollingSchema = this.pollResultSchema;
      } else {
        const pollType = this.findResponseBody(lroMetadata.pollingInfo.responseModel);
        const sdkType = getClientType(this.sdkContext, pollType);
        pollingSchema = this.processSchema(sdkType, "pollResult");
      }

      // finalSchema
      if (
        verb !== "delete" &&
        lroMetadata.finalResult &&
        lroMetadata.finalEnvelopeResult &&
        lroMetadata.finalResult !== "void" &&
        lroMetadata.finalEnvelopeResult !== "void"
      ) {
        const finalResult = useNewPollStrategy
          ? lroMetadata.finalResult
          : lroMetadata.finalEnvelopeResult;
        const finalType = this.findResponseBody(finalResult);
        const sdkType = getClientType(this.sdkContext, finalType);
        finalSchema = this.processSchema(sdkType, "finalResult");

        if (
          useNewPollStrategy &&
          lroMetadata.finalStep &&
          lroMetadata.finalStep.kind === "pollingSuccessProperty" &&
          lroMetadata.finalStep.target
        ) {
          // final result is the value in lroMetadata.finalStep.target
          finalResultPropertySerializedName = this.getSerializedName(lroMetadata.finalStep.target);
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

  private _armApiVersionParameter?: Parameter;

  private processParameter(
    op: CodeModelOperation,
    param: SdkQueryParameter | SdkPathParameter | SdkHeaderParameter,
    clientContext: ClientContext,
  ) {
    if (clientContext.apiVersions && isApiVersion(this.sdkContext, param)) {
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
        const parameter =
          param.kind === "query" ? this.apiVersionParameter : this.apiVersionParameterInPath;
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
                this.logWarning(`Unrecognized header parameter format: '${format}'.`);
              }
              break;
          }
        }
      }

      // TODO: use param.onClient after TCGC fix
      const parameterOnClient =
        !isApiVersion(this.sdkContext, param) &&
        param.correspondingMethodParams &&
        param.correspondingMethodParams.length > 0 &&
        param.correspondingMethodParams[0].onClient;

      const nullable = param.type.kind === "nullable";
      const parameter = new Parameter(param.name, param.details ?? "", schema, {
        summary: param.description,
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
        op.convenienceApi.requests = [];
        const request = new Request({
          protocol: op.requests![0].protocol,
        });
        request.parameters = [];
        request.signatureParameters = [];
        op.convenienceApi.requests.push(request);

        for (const parameter of op.parameters) {
          // copy all parameters to request
          const clonedParameter = cloneOperationParameter(parameter);
          request.parameters.push(clonedParameter);

          // copy signatureParameters, but exclude etag headers (as they won't be in method signature)
          if (
            op.signatureParameters.includes(parameter) &&
            !(
              parameter.language.default.serializedName &&
              etagHeaders.includes(parameter.language.default.serializedName)
            )
          ) {
            request.signatureParameters.push(clonedParameter);
          }
        }

        const namespace = getNamespace(httpOperation.__raw.operation); // TODO: SdkHttpOperation does not have namespace
        const schemaName = groupToRequestConditions ? "RequestConditions" : "MatchConditions";
        const schemaDescription = groupToRequestConditions
          ? "Specifies HTTP options for conditional requests based on modification time."
          : "Specifies HTTP options for conditional requests.";

        // group schema
        const requestConditionsSchema = this.codeModel.schemas.add(
          new GroupSchema(schemaName, schemaDescription, {
            language: {
              default: {
                namespace: namespace,
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
    rawHttpOperation: HttpOperation,
    sdkHttpOperation: SdkHttpOperation,
    sdkBody: SdkBodyParameter,
  ) {
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
    const parameter = new Parameter(parameterName, sdkBody.description ?? "", schema, {
      summary: sdkBody.details,
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
      // Explicit body parameter @body or @bodyRoot would result to the existence of rawHttpOperation.parameters.body.property
      // Implicit body parameter would result to rawHttpOperation.parameters.body.property be undefined
      // see https://typespec.io/docs/libraries/http/cheat-sheet#data-types
      const bodyParameterFlatten =
        schema instanceof ObjectSchema &&
        sdkType.kind === "model" &&
        !rawHttpOperation.parameters.body?.property &&
        !this.isArm();

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
          return;
        }

        const schemaUsage = (schema as SchemaUsage).usage;
        if (!schemaIsPublicBeforeProcess && schemaUsage?.includes(SchemaContext.Public)) {
          // Public added in this op, change it to PublicSpread
          // This means that if this op would originally add Public to this schema, it adds PublicSpread instead
          schemaUsage?.splice(schemaUsage?.indexOf(SchemaContext.Public), 1);
          this.trackSchemaUsage(schema, { usage: [SchemaContext.PublicSpread] });
        }

        if (op.convenienceApi && op.parameters) {
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

          if (request.signatureParameters.length > 6) {
            // create an option bag
            const name = op.language.default.name + "Options";
            const namespace = getNamespace(rawHttpOperation.operation);
            // option bag schema
            const optionBagSchema = this.codeModel.schemas.add(
              new GroupSchema(name, `Options for ${op.language.default.name} API`, {
                language: {
                  default: {
                    namespace: namespace,
                  },
                  java: {
                    namespace: this.getJavaNamespace(namespace),
                  },
                },
              }),
            );
            request.parameters.forEach((it) => {
              optionBagSchema.add(
                new GroupProperty(
                  it.language.default.name,
                  it.language.default.description,
                  it.schema,
                  {
                    originalParameter: [it],
                    summary: it.summary,
                    required: it.required,
                    nullable: it.nullable,
                    readOnly: false,
                    serializedName: it.language.default.serializedName,
                  },
                ),
              );
            });

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
      }
    }
  }

  private addParameterOrBodyPropertyToCodeModelRequest(
    opParameter:
      | SdkPathParameter
      | SdkHeaderParameter
      | SdkQueryParameter
      | SdkBodyModelPropertyType,
    op: CodeModelOperation,
    request: Request,
    schema: ObjectSchema,
    originalParameter: Parameter,
  ) {
    const serializedName = opParameter.serializedName;
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

  private findResponseBody(bodyType: Type): Type {
    // find a type that possibly without http metadata like @statusCode
    return this.getEffectiveSchemaType(bodyType);
  }

  private processResponse(
    op: CodeModelOperation,
    statusCode: number | HttpStatusCodeRange | "*",
    sdkResponse: SdkHttpResponse,
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
                description: header.description ?? header.details,
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
          return this.processDurationSchema(type, nameHint, getDurationFormat(type));

        case "constant":
          return this.processConstantSchema(type, nameHint);

        case "utcDateTime":
        case "offsetDateTime":
          if (type.encode === "unixTimestamp") {
            return this.processUnixTimeSchema(type, nameHint);
          } else {
            return this.processDateTimeSchema(type, nameHint, type.encode === "rfc7231");
          }
      }
    }
    throw new Error(`Unrecognized type: '${type.kind}'.`);
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
          return this.processByteArraySchema(type, nameHint);

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
      new StringSchema(name, type.details ?? "", {
        summary: type.description,
      }),
    );
  }

  private processByteArraySchema(type: SdkBuiltInType, name: string): ByteArraySchema {
    const base64Encoded: boolean = type.encode === "base64url";
    return this.codeModel.schemas.add(
      new ByteArraySchema(name, type.details ?? "", {
        summary: type.description,
        format: base64Encoded ? "base64url" : "byte",
      }),
    );
  }

  private processIntegerSchema(
    type: SdkBuiltInType,
    name: string,
    precision: number,
  ): NumberSchema {
    const schema = new NumberSchema(name, type.details ?? "", SchemaType.Integer, precision, {
      summary: type.description,
    });
    if (type.encode === "string") {
      (schema as EncodedSchema).encode = type.encode;
    }
    return this.codeModel.schemas.add(schema);
  }

  private processNumberSchema(type: SdkBuiltInType, name: string): NumberSchema {
    return this.codeModel.schemas.add(
      new NumberSchema(name, type.details ?? "", SchemaType.Number, 64, {
        summary: type.description,
      }),
    );
  }

  private processDecimalSchema(type: SdkBuiltInType, name: string): NumberSchema {
    // "Infinity" maps to "BigDecimal" in Java
    return this.codeModel.schemas.add(
      new NumberSchema(name, type.details ?? "", SchemaType.Number, Infinity, {
        summary: type.description,
      }),
    );
  }

  private processBooleanSchema(type: SdkBuiltInType, name: string): BooleanSchema {
    return this.codeModel.schemas.add(
      new BooleanSchema(name, type.details ?? "", {
        summary: type.description,
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
      new ArraySchema(name, type.details ?? "", elementSchema, {
        summary: type.description,
        nullableItems: nullableItems,
      }),
    );
  }

  private processDictionarySchema(type: SdkDictionaryType, name: string): DictionarySchema {
    const dictSchema = new DictionarySchema<any>(name, type.details ?? "", null, {
      summary: type.description,
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
      choices.push(new ChoiceValue(it.name, it.description ?? "", it.value ?? it.name)),
    );

    const schemaType = type.isFixed ? SealedChoiceSchema : ChoiceSchema;

    const schema = new schemaType(type.name ?? name, type.details ?? "", {
      summary: type.description,
      choiceType: valueType as any,
      choices: choices,
      language: {
        default: {
          namespace: namespace,
        },
        java: {
          namespace: this.getJavaNamespace(namespace),
        },
      },
    });
    schema.crossLanguageDefinitionId = type.crossLanguageDefinitionId;
    return this.codeModel.schemas.add(schema);
  }

  private processConstantSchema(type: SdkConstantType, name: string): ConstantSchema {
    const valueType = this.processSchema(type.valueType, type.valueType.kind);

    return this.codeModel.schemas.add(
      new ConstantSchema(type.name ?? name, type.details ?? "", {
        summary: type.description,
        valueType: valueType,
        value: new ConstantValue(type.value),
      }),
    );
  }

  private processConstantSchemaFromEnumValue(type: SdkEnumValueType, name: string): ConstantSchema {
    const valueType = this.processSchema(type.enumType, type.enumType.name);

    return this.codeModel.schemas.add(
      new ConstantSchema(type.name ?? name, type.details ?? "", {
        summary: type.description,
        valueType: valueType,
        value: new ConstantValue(type.value ?? type.name),
      }),
    );
  }

  private processUnixTimeSchema(type: SdkDateTimeType, name: string): UnixTimeSchema {
    return this.codeModel.schemas.add(
      new UnixTimeSchema(name, type.details ?? "", {
        summary: type.description,
      }),
    );
  }

  private processDateTimeSchema(
    type: SdkDateTimeType,
    name: string,
    rfc1123: boolean,
  ): DateTimeSchema {
    return this.codeModel.schemas.add(
      new DateTimeSchema(name, type.details ?? "", {
        summary: type.description,
        format: rfc1123 ? "date-time-rfc1123" : "date-time",
      }),
    );
  }

  private processDateSchema(type: SdkBuiltInType, name: string): DateSchema {
    return this.codeModel.schemas.add(
      new DateSchema(name, type.details ?? "", {
        summary: type.description,
      }),
    );
  }

  private processTimeSchema(type: SdkBuiltInType, name: string): TimeSchema {
    return this.codeModel.schemas.add(
      new TimeSchema(name, type.details ?? "", {
        summary: type.description,
      }),
    );
  }

  private processDurationSchema(
    type: SdkDurationType,
    name: string,
    format: DurationSchema["format"] = "duration-rfc3339",
  ): DurationSchema {
    return this.codeModel.schemas.add(
      new DurationSchema(name, type.details ?? "", {
        summary: type.description,
        format: format,
      }),
    );
  }

  private processUrlSchema(type: SdkBuiltInType, name: string): UriSchema {
    return this.codeModel.schemas.add(
      new UriSchema(name, type.details ?? "", {
        summary: type.description,
      }),
    );
  }

  private processObjectSchema(type: SdkModelType, name: string): ObjectSchema {
    const rawModelType = type.__raw;
    const namespace = getNamespace(rawModelType);
    const objectSchema = new ObjectSchema(name, type.details ?? "", {
      summary: type.description,
      language: {
        default: {
          namespace: namespace,
        },
        java: {
          namespace: this.getJavaNamespace(namespace),
        },
      },
    });
    (objectSchema as CrossLanguageDefinition).crossLanguageDefinitionId =
      type.crossLanguageDefinitionId;
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
        description: type.description,
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

  private getEffectiveSchemaType(type: Type): Type {
    const program = this.program;
    function isSchemaProperty(property: ModelProperty) {
      return isPayloadProperty(program, property);
    }

    if (type.kind === "Model") {
      const effective = getEffectiveModelType(program, type, isSchemaProperty);
      if (this.isArm() && getNamespace(effective as Model)?.startsWith("Azure.ResourceManager")) {
        // Catalog is TrackedResource<CatalogProperties>
        return type;
      } else if (effective.name) {
        return effective;
      }
    }
    return type;
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

    if (prop.kind === "property" && prop.multipartOptions) {
      // TODO: handle MultipartOptions.isMulti
      if (prop.multipartOptions.isFilePart) {
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

    return new Property(prop.name, prop.details ?? "", schema, {
      summary: prop.description,
      required: !prop.optional,
      nullable: nullable,
      readOnly: this.isReadOnly(prop),
      serializedName: prop.kind === "property" ? prop.serializedName : undefined,
      extensions: extensions,
    });
  }

  private processUnionSchema(type: SdkUnionType, name: string): Schema {
    if (!(type.__raw && type.__raw.kind === "Union")) {
      throw new Error(`Invalid type for union: '${type.kind}'.`);
    }
    const rawUnionType: Union = type.__raw as Union;
    const namespace = getNamespace(rawUnionType);
    const baseName = type.name ?? pascalCase(name) + "Model";
    this.logWarning(
      `Convert TypeSpec Union '${getUnionDescription(rawUnionType, this.typeNameOptions)}' to Class '${baseName}'`,
    );
    const unionSchema = new OrSchema(baseName + "Base", type.details ?? "", {
      summary: type.description,
    });
    unionSchema.anyOf = [];
    type.variantTypes.forEach((it) => {
      const variantName = this.getUnionVariantName(it.__raw, { depth: 0 });
      const modelName = variantName + baseName;
      const propertyName = "value";

      // these ObjectSchema is not added to codeModel.schemas
      const objectSchema = new ObjectSchema(modelName, it.details ?? "", {
        summary: it.description,
        language: {
          default: {
            namespace: namespace,
          },
          java: {
            namespace: this.getJavaNamespace(namespace),
          },
        },
      });

      const variantSchema = this.processSchema(it, variantName);
      objectSchema.addProperty(
        new Property(propertyName, type.details ?? "", variantSchema, {
          summary: type.description,
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
      new BinarySchema(type.description ?? "", {
        summary: type.details,
      }),
    );
  }

  private getUnionVariantName(type: Type | undefined, option: any): string {
    if (type === undefined) {
      throw new Error("type is undefined.");
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
      default:
        throw new Error(`Unrecognized type for union variable: '${type.kind}'.`);
    }
  }

  private processMultipartFormDataFilePropertySchema(property: SdkBodyModelPropertyType): Schema {
    const processSchemaFunc = (type: SdkType) => this.processSchema(type, "");
    if (property.type.kind === "bytes" || property.type.kind === "model") {
      const namespace =
        property.type.kind === "model"
          ? (getNamespace(property.type.__raw) ?? this.namespace)
          : this.namespace;
      return getFileDetailsSchema(
        property,
        getNamespace(property.type.__raw) ?? this.namespace,
        namespace,
        this.codeModel.schemas,
        this.binarySchema,
        this.stringSchema,
        processSchemaFunc,
      );
    } else if (
      property.type.kind === "array" &&
      (property.type.valueType.kind === "bytes" || property.type.valueType.kind === "model")
    ) {
      const namespace =
        property.type.valueType.kind === "model"
          ? (getNamespace(property.type.valueType.__raw) ?? this.namespace)
          : this.namespace;
      return new ArraySchema(
        property.name,
        property.details ?? "",
        getFileDetailsSchema(
          property,
          namespace,
          this.getJavaNamespace(namespace),
          this.codeModel.schemas,
          this.binarySchema,
          this.stringSchema,
          processSchemaFunc,
        ),
        {
          summary: property.description,
        },
      );
    } else {
      throw new Error(`Invalid type for multipart form data: '${property.type.kind}'.`);
    }
  }

  private getDoc(target: Type | undefined): string {
    return target ? getDoc(this.program, target) || "" : "";
  }

  private getSummary(target: Type | undefined): string | undefined {
    return target ? getSummary(this.program, target) : undefined;
  }

  private getSerializedName(target: ModelProperty): string {
    if (isHeader(this.program, target)) {
      return getHeaderFieldName(this.program, target);
    } else if (isQueryParam(this.program, target)) {
      return getQueryParamName(this.program, target);
    } else if (isPathParam(this.program, target)) {
      return getPathParamName(this.program, target);
    } else {
      // TODO: currently this is only for JSON
      return getWireName(this.sdkContext, target);
    }
  }

  private isReadOnly(target: SdkModelPropertyType): boolean {
    const segment = target.__raw ? getSegment(this.program, target.__raw) !== undefined : false;
    if (segment) {
      return true;
    } else {
      const visibility = target.__raw ? getVisibility(this.program, target.__raw) : undefined;
      if (visibility) {
        return (
          !visibility.includes("write") &&
          !visibility.includes("create") &&
          !visibility.includes("update") &&
          !visibility.includes("delete") &&
          !visibility.includes("query")
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

  private getJavaNamespace(namespace: string | undefined): string | undefined {
    const tspNamespace = this.namespace;
    const baseJavaNamespace = this.emitterContext.options.namespace;
    if (!namespace) {
      return undefined;
    } else if (
      baseJavaNamespace &&
      (namespace === tspNamespace || namespace.startsWith(tspNamespace + "."))
    ) {
      return baseJavaNamespace + namespace.slice(tspNamespace.length).toLowerCase();
    } else {
      return "com." + namespace.toLowerCase();
    }
  }

  private logWarning(msg: string) {
    if (this.loggingEnabled) {
      logWarning(this.program, msg);
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

  private _apiVersionParameter?: Parameter;
  get apiVersionParameter(): Parameter {
    return (
      this._apiVersionParameter ||
      (this._apiVersionParameter = this.createApiVersionParameter(
        "api-version",
        ParameterLocation.Query,
      ))
    );
  }

  private _apiVersionParameterInPath?: Parameter;
  get apiVersionParameterInPath(): Parameter {
    return (
      this._apiVersionParameterInPath ||
      // TODO: hardcode as "apiVersion", as it is what we get from compiler
      (this._apiVersionParameterInPath = this.createApiVersionParameter(
        "apiVersion",
        ParameterLocation.Path,
      ))
    );
  }

  private isSubscriptionId(param: SdkPathParameter): boolean {
    return "subscriptionId".toLocaleLowerCase() === param.serializedName.toLocaleLowerCase();
  }

  private subscriptionIdParameter(parameter: SdkPathParameter): Parameter {
    if (!this._subscriptionParameter) {
      const description = parameter.description;
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
        if (schemaUsage.usage || schemaUsage.serializationFormats) {
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
