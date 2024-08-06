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
  getLroMetadata,
  getPagedResult,
  isPollingLocation,
} from "@azure-tools/typespec-azure-core";
import {
  SdkArrayType,
  SdkBodyModelPropertyType,
  SdkBuiltInType,
  SdkClient,
  SdkConstantType,
  SdkContext,
  SdkDateTimeType,
  SdkDictionaryType,
  SdkDurationType,
  SdkEnumType,
  SdkEnumValueType,
  SdkModelPropertyType,
  SdkModelType,
  SdkType,
  SdkUnionType,
  createSdkContext,
  getAllModels,
  getClientNameOverride,
  getClientType,
  getCrossLanguageDefinitionId,
  getDefaultApiVersion,
  getHttpOperationExamples,
  getHttpOperationWithCache,
  getWireName,
  isApiVersion,
  isInternal,
  isSdkBuiltInKind,
  isSdkIntKind,
  listClients,
  listOperationGroups,
  listOperationsInOperationGroup,
  shouldGenerateConvenient,
  shouldGenerateProtocol,
} from "@azure-tools/typespec-client-generator-core";
import {
  EmitContext,
  Interface,
  Model,
  ModelProperty,
  Namespace,
  Operation,
  Program,
  Scalar,
  Type,
  TypeNameOptions,
  Union,
  getDoc,
  getEffectiveModelType,
  getEncode,
  getFriendlyName,
  getNamespaceFullName,
  getOverloadedOperation,
  getProjectedName,
  getSummary,
  getVisibility,
  isArrayModelType,
  isErrorModel,
  isRecordModelType,
  isVoidType,
  listServices,
} from "@typespec/compiler";
import {
  Authentication,
  HttpOperation,
  HttpOperationBody,
  HttpOperationMultipartBody,
  HttpOperationParameter,
  HttpOperationResponse,
  HttpServer,
  HttpStatusCodesEntry,
  Visibility,
  getAuthentication,
  getHeaderFieldName,
  getHeaderFieldOptions,
  getPathParamName,
  getQueryParamName,
  getQueryParamOptions,
  getServers,
  getStatusCodeDescription,
  isHeader,
  isPathParam,
  isQueryParam,
} from "@typespec/http";
import { getResourceOperation, getSegment } from "@typespec/rest";
import { Version, getAddedOnVersions, getVersion } from "@typespec/versioning";
import { fail } from "assert";
import pkg from "lodash";
import { pathToFileURL } from "url";
import { Client as CodeModelClient, CrossLanguageDefinition } from "./common/client.js";
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
import { PreNamer } from "./prenamer/prenamer.js";
import {
  ProcessingCache,
  getAccess,
  getDurationFormatFromSdkType,
  getNonNullSdkType,
  getUnionDescription,
  getUsage,
  hasScalarAsBase,
  isArmCommonType,
  isModelReferredInTemplate,
  isNullableType,
  isStable,
  modelIs,
  pushDistinct,
} from "./type-utils.js";
import {
  getJavaNamespace,
  getNamespace,
  logWarning,
  pascalCase,
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
    this.processSchemaFromSdkTypeImpl(type, name)
  );
  readonly typeUnionRefCache = new Map<Type, Union | null | undefined>(); // Union means it ref a Union type, null means it does not ref any Union, undefined means type visited but not completed

  // current apiVersion name to generate code
  private apiVersion: Version | undefined;

  public constructor(program1: Program, context: EmitContext<EmitterOptions>) {
    this.options = context.options;
    this.program = program1;
    this.emitterContext = context;
    if (this.options["dev-options"]?.loglevel) {
      this.loggingEnabled = true;
    }

    if (this.options["skip-special-headers"]) {
      this.options["skip-special-headers"].forEach((it) =>
        SPECIAL_HEADER_NAMES.add(it.toLowerCase())
      );
    }

    const service = listServices(this.program)[0];
    const serviceNamespace = service.type;
    if (serviceNamespace === undefined) {
      throw Error("Cannot emit yaml for a namespace that doesn't exist.");
    }
    this.serviceNamespace = serviceNamespace;

    this.namespace = getNamespaceFullName(serviceNamespace) || "Azure.Client";
    // java namespace
    const javaNamespace = getJavaNamespace(this.namespace);

    const namespace1 = this.namespace;
    this.typeNameOptions = {
      // shorten type names by removing TypeSpec and service namespace
      namespaceFilter(ns) {
        const name = getNamespaceFullName(ns);
        return name !== "TypeSpec" && name !== namespace1;
      },
    };

    // init code model
    const title = this.options["service-name"] ?? serviceNamespace.name;

    const description = this.getDoc(serviceNamespace);
    this.codeModel = new CodeModel(title, false, {
      info: {
        description: description,
      },
      language: {
        default: {
          name: title,
          description: description,
          summary: this.getSummary(serviceNamespace),
          namespace: this.namespace,
        },
        java: {
          namespace: javaNamespace,
        },
      },
    });
  }

  public async build(): Promise<CodeModel> {
    this.sdkContext = await createSdkContext(this.emitterContext, "@typespec/http-client-java");

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

    const clients = this.processClients();

    this.processModels(clients);

    this.processSchemaUsage();

    if (this.options.namer) {
      this.codeModel = new PreNamer(this.codeModel).init().process();
    }

    this.deduplicateSchemaName();

    return this.codeModel;
  }

  private processHost(server: HttpServer | undefined): Parameter[] {
    const hostParameters: Parameter[] = [];
    if (server && !this.isArmSynthesizedServer(server)) {
      server.parameters.forEach((it) => {
        let parameter;

        if (isApiVersion(this.sdkContext, it)) {
          parameter = this.createApiVersionParameter(it.name, ParameterLocation.Uri);
        } else {
          const sdkType = getClientType(this.sdkContext, it.type);
          const schema = this.processSchemaFromSdkType(sdkType, it.name);
          this.trackSchemaUsage(schema, {
            usage: [SchemaContext.Input, SchemaContext.Output /*SchemaContext.Public*/],
          });
          parameter = new Parameter(this.getName(it), this.getDoc(it), schema, {
            implementation: ImplementationLocation.Client,
            origin: "modelerfour:synthesized/host",
            required: !it.optional,
            protocol: {
              http: new HttpParameter(ParameterLocation.Uri),
            },
            language: {
              default: {
                serializedName: it.name,
              },
            },
            extensions: {
              "x-ms-skip-url-encoding": schema instanceof UriSchema,
            },
            // // make the logic same as TCGC, which takes the server-side default of host as client-side default
            // clientDefaultValue: getDefaultValue(it.defaultValue),
          });
        }

        hostParameters.push(this.codeModel.addGlobalParameter(parameter));
      });
      return hostParameters;
    } else {
      // use "endpoint"
      hostParameters.push(
        this.codeModel.addGlobalParameter(
          new Parameter("endpoint", "Server parameter", this.stringSchema, {
            implementation: ImplementationLocation.Client,
            origin: "modelerfour:synthesized/host",
            required: true,
            protocol: {
              http: new HttpParameter(ParameterLocation.Uri),
            },
            language: {
              default: {
                serializedName: "endpoint",
              },
            },
            extensions: {
              "x-ms-skip-url-encoding": true,
            },
          })
        )
      );
      return hostParameters;
    }
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
                oauth2Scheme.scopes.push(...it.scopes.map((it) => it.value))
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
                  this.logWarning(`{scheme.scheme} auth method is currently not supported.`);
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

  private isInternal(context: SdkContext, operation: Operation): boolean {
    const access = getAccess(operation);
    if (access) {
      return access === "internal";
    } else {
      // TODO: deprecate "internal"
      // eslint-disable-next-line deprecation/deprecation
      return isInternal(context, operation);
    }
  }

  private processModels(clients: SdkClient[]) {
    const processedSdkModels: Set<SdkModelType | SdkEnumType> = new Set();

    // lambda to mark model as public
    const modelAsPublic = (model: SdkModelType | SdkEnumType) => {
      const schema = this.processSchemaFromSdkType(model, "");

      this.trackSchemaUsage(schema, {
        usage: [SchemaContext.Public],
      });
    };

    const sdkModels: (SdkModelType | SdkEnumType)[] = getAllModels(this.sdkContext);

    // process sdk models
    for (const model of sdkModels) {
      if (!processedSdkModels.has(model)) {
        const access = getAccess(model.__raw);
        if (access === "public") {
          modelAsPublic(model);
        } else if (access === "internal") {
          const schema = this.processSchemaFromSdkType(model, model.name);

          this.trackSchemaUsage(schema, {
            usage: [SchemaContext.Internal],
          });
        }

        const usage = getUsage(model.__raw);
        if (usage) {
          const schema = this.processSchemaFromSdkType(model, "");

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

      // Internal on Anonymous
      if (schemaUsage?.includes(SchemaContext.Anonymous)) {
        const index = schemaUsage.indexOf(SchemaContext.Internal);
        if (index < 0) {
          schemaUsage.push(SchemaContext.Internal);
        }
      }
    }
  }

  private processClients(): SdkClient[] {
    const clients = listClients(this.sdkContext);
    // preprocess group-etag-headers
    this.options["group-etag-headers"] = this.options["group-etag-headers"] ?? true;

    for (const client of clients) {
      const codeModelClient = new CodeModelClient(client.name, this.getDoc(client.type), {
        summary: this.getSummary(client.type),

        // at present, use global security definition
        security: this.codeModel.security,
      });
      codeModelClient.crossLanguageDefinitionId = client.crossLanguageDefinitionId;

      // versioning
      const versioning = getVersion(this.program, client.service);
      if (versioning && versioning.getVersions()) {
        // @versioned in versioning
        if (!this.sdkContext.apiVersion || ["all", "latest"].includes(this.sdkContext.apiVersion)) {
          this.apiVersion = getDefaultApiVersion(this.sdkContext, client.service);
        } else {
          this.apiVersion = versioning
            .getVersions()
            .find((it: Version) => it.value === this.sdkContext.apiVersion);
          if (!this.apiVersion) {
            throw new Error("Unrecognized api-version: " + this.sdkContext.apiVersion);
          }
        }

        codeModelClient.apiVersions = [];
        for (const version of this.getFilteredApiVersions(
          this.apiVersion,
          versioning.getVersions(),
          this.options["service-version-exclude-preview"]
        )) {
          const apiVersion = new ApiVersion();
          apiVersion.version = version.value;
          codeModelClient.apiVersions.push(apiVersion);
        }
      }

      // server
      let baseUri = "{endpoint}";
      const servers = getServers(this.program, client.service);
      if (servers && servers.length === 1 && !this.isArmSynthesizedServer(servers[0])) {
        baseUri = servers[0].url;
      }
      const hostParameters = this.processHost(servers?.length === 1 ? servers[0] : undefined);
      codeModelClient.addGlobalParameters(hostParameters);
      const clientContext = new ClientContext(
        baseUri,
        hostParameters,
        codeModelClient.globalParameters!,
        codeModelClient.apiVersions
      );
      clientContext.preProcessOperations(this.sdkContext, client);

      const operationGroups = listOperationGroups(this.sdkContext, client, true);

      const operationWithoutGroup = listOperationsInOperationGroup(this.sdkContext, client);
      let codeModelGroup = new OperationGroup("");
      for (const operation of operationWithoutGroup) {
        if (!this.needToSkipProcessingOperation(operation, clientContext)) {
          codeModelGroup.addOperation(this.processOperation("", operation, clientContext));
        }
      }
      if (codeModelGroup.operations?.length > 0) {
        codeModelClient.operationGroups.push(codeModelGroup);
      }

      for (const operationGroup of operationGroups) {
        const operations = listOperationsInOperationGroup(this.sdkContext, operationGroup);
        // operation group with no operation is skipped
        if (operations.length > 0) {
          const groupPath = operationGroup.groupPath.split(".");
          let operationGroupName: string;
          if (groupPath.length > 1) {
            // groupPath should be in format of "OpenAIClient.Chat.Completions"
            operationGroupName = groupPath.slice(1).join("");
          } else {
            // protection
            operationGroupName = operationGroup.type.name;
          }
          codeModelGroup = new OperationGroup(operationGroupName);
          for (const operation of operations) {
            if (!this.needToSkipProcessingOperation(operation, clientContext)) {
              codeModelGroup.addOperation(
                this.processOperation(operationGroupName, operation, clientContext)
              );
            }
          }
          codeModelClient.operationGroups.push(codeModelGroup);
        }
      }

      this.codeModel.clients.push(codeModelClient);
    }

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

    return clients;
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
    pinnedApiVersion: Version | undefined,
    versions: Version[],
    excludePreview: boolean = false
  ): Version[] {
    if (!pinnedApiVersion) {
      return versions;
    }
    return versions
      .slice(0, versions.indexOf(pinnedApiVersion) + 1)
      .filter((version) => !excludePreview || !isStable(pinnedApiVersion) || isStable(version));
  }

  /**
   * `@armProviderNamespace` currently will add a default server if not defined globally:
   * https://github.com/Azure/typespec-azure/blob/8b8d7c05f168d9305a09691c4fedcb88f4a57652/packages/typespec-azure-resource-manager/src/namespace.ts#L121-L128
   * TODO: if the synthesized server has the right hostParameter, we can use that instead
   *
   * @param server returned by getServers
   * @returns whether it's synthesized by `@armProviderNamespace`
   */
  private isArmSynthesizedServer(server: HttpServer): boolean {
    return this.isArm() && (!server.parameters || server.parameters.size === 0);
  }

  private needToSkipProcessingOperation(
    operation: Operation,
    clientContext: ClientContext
  ): boolean {
    // don't generate protocol and convenience method for overloaded operations
    // issue link: https://github.com/Azure/autorest.java/issues/1958#issuecomment-1562558219 we will support generate overload methods for non-union type in future (TODO issue: https://github.com/Azure/autorest.java/issues/2160)
    if (getOverloadedOperation(this.program, operation)) {
      this.trace(
        `Operation '${operation.name}' is temporary skipped, as it is an overloaded operation`
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

  private getOperationExample(operation: HttpOperation): Record<string, any> | undefined {
    const httpOperationExamples = getHttpOperationExamples(this.sdkContext, operation);
    if (httpOperationExamples && httpOperationExamples.length > 0) {
      const operationExamples: Record<string, any> = {};
      for (const example of httpOperationExamples) {
        const operationExample = example.rawExample;
        operationExample["x-ms-original-file"] = pathToFileURL(example.filePath).toString();
        operationExamples[
          operationExample.title ?? operationExample.operationId ?? operation.operation.name
        ] = operationExample;
      }
      return operationExamples;
    } else {
      return undefined;
    }
  }

  private processOperation(
    groupName: string,
    operation: Operation,
    clientContext: ClientContext
  ): CodeModelOperation {
    const op = getHttpOperationWithCache(this.sdkContext, operation);

    const operationGroup = this.codeModel.getOperationGroup(groupName);
    const operationName = this.getName(operation);
    const opId = groupName ? `${groupName}_${operationName}` : `${operationName}`;

    const operationExamples = this.getOperationExample(op);

    const codeModelOperation = new CodeModelOperation(operationName, this.getDoc(operation), {
      operationId: opId,
      summary: this.getSummary(operation),
      extensions: {
        "x-ms-examples": operationExamples,
      },
    });

    (codeModelOperation as CrossLanguageDefinition).crossLanguageDefinitionId =
      getCrossLanguageDefinitionId(this.sdkContext, operation);
    codeModelOperation.internalApi = this.isInternal(this.sdkContext, operation);

    const convenienceApiName = this.getConvenienceApiName(operation);
    let generateConvenienceApi: boolean = Boolean(convenienceApiName);
    let generateProtocolApi: boolean = shouldGenerateProtocol(this.sdkContext, operation);

    let apiComment: string | undefined = undefined;
    if (generateConvenienceApi) {
      // check if the convenience API need to be disabled for some special cases
      if (operationIsMultipart(op)) {
        // do not generate protocol method for multipart/form-data, as it be very hard for user to prepare the request body as BinaryData
        generateProtocolApi = false;
        apiComment = `Protocol API requires serialization of parts with content-disposition and data, as operation '${op.operation.name}' is 'multipart/form-data'`;
        this.logWarning(apiComment);
      } else if (operationIsMultipleContentTypes(op)) {
        // and multiple content types
        // issue link: https://github.com/Azure/autorest.java/issues/1958#issuecomment-1562558219
        generateConvenienceApi = false;
        apiComment = `Convenience API is not generated, as operation '${op.operation.name}' is multiple content-type`;
        this.logWarning(apiComment);
      } else if (
        operationIsJsonMergePatch(op) &&
        this.options["stream-style-serialization"] === false
      ) {
        // do not generate convenient method for json merge patch operation if stream-style-serialization is not enabled
        generateConvenienceApi = false;
        apiComment = `Convenience API is not generated, as operation '${op.operation.name}' is 'application/merge-patch+json' and stream-style-serialization is not enabled`;
        this.logWarning(apiComment);
      }
      // else {
      //   const union = operationRefersUnion(this.program, op, this.typeUnionRefCache);
      //   if (union) {
      //     // and Union
      //     generateConvenienceApi = false;
      //     apiComment = `Convenience API is not generated, as operation '${
      //       op.operation.name
      //     }' refers Union '${getUnionDescription(union, this.typeNameOptions)}'`;
      //     this.logWarning(apiComment);
      //   }
      // }
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
            path: op.path,
            method: op.verb,
            uri: clientContext.baseUri,
          },
        },
      })
    );

    // host
    clientContext.hostParameters.forEach((it) => codeModelOperation.addParameter(it));
    // parameters
    op.parameters.parameters.map((it) =>
      this.processParameter(codeModelOperation, it, clientContext)
    );
    // "accept" header
    this.addAcceptHeaderParameter(codeModelOperation, op.responses);
    // body
    if (op.parameters.body) {
      if (op.parameters.body.property) {
        if (!isVoidType(op.parameters.body.property.type)) {
          this.processParameterBody(codeModelOperation, op, op.parameters.body.property);
        }
      } else if (op.parameters.body.type) {
        let bodyType = op.parameters.body.type;

        if (bodyType.kind === "Model") {
          // try use resource type as round-trip model
          const resourceType = getResourceOperation(this.program, operation)?.resourceType;
          if (resourceType && op.responses && op.responses.length > 0) {
            const resp = op.responses[0];
            if (resp.responses && resp.responses.length > 0 && resp.responses[0].body) {
              const responseBody = resp.responses[0].body;
              const bodyTypeInResponse = this.findResponseBody(responseBody.type);
              // response body type is resource type, and request body type (if templated) contains resource type
              if (
                bodyTypeInResponse === resourceType &&
                isModelReferredInTemplate(bodyType, resourceType)
              ) {
                bodyType = resourceType;
              }
            }
          }

          this.processParameterBody(codeModelOperation, op, bodyType);
        }
      }
    }

    // group ETag header parameters, if exists
    if (this.options["group-etag-headers"]) {
      this.processEtagHeaderParameters(codeModelOperation, op);
    }

    // lro metadata
    const lroMetadata = this.processLroMetadata(codeModelOperation, op);

    // responses
    op.responses.map((it) => this.processResponse(codeModelOperation, it, lroMetadata.longRunning));

    // check for paged
    this.processRouteForPaged(codeModelOperation, op.responses);
    // check for long-running operation
    this.processRouteForLongRunning(codeModelOperation, operation, op.responses, lroMetadata);

    operationGroup.addOperation(codeModelOperation);

    return codeModelOperation;
  }

  private processRouteForPaged(op: CodeModelOperation, responses: HttpOperationResponse[]) {
    for (const response of responses) {
      if (response.responses && response.responses.length > 0 && response.responses[0].body) {
        const responseBody = response.responses[0].body;
        const bodyType = this.findResponseBody(responseBody.type);
        if (bodyType.kind === "Model") {
          const pagedResult = getPagedResult(this.program, bodyType);
          if (pagedResult) {
            op.extensions = op.extensions ?? {};
            op.extensions["x-ms-pageable"] = {
              itemName: pagedResult.itemsProperty?.name,
              nextLinkName: pagedResult.nextLinkProperty?.name,
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
    httpOperation: HttpOperation
  ): LongRunningMetadata {
    const operation = httpOperation.operation;

    const trackConvenienceApi: boolean = Boolean(op.convenienceApi);

    const lroMetadata = getLroMetadata(this.program, operation);
    // needs lroMetadata.statusMonitorStep, as getLroMetadata would return for @pollingOperation operation
    if (lroMetadata && lroMetadata.pollingInfo && lroMetadata.statusMonitorStep) {
      let pollingSchema = undefined;
      let finalSchema = undefined;

      let pollingStrategy: Metadata | undefined = undefined;
      let finalResultPropertySerializedName: string | undefined = undefined;

      const verb = httpOperation.verb;
      const useNewPollStrategy = isLroNewPollingStrategy(httpOperation, lroMetadata);
      if (useNewPollStrategy) {
        // use OperationLocationPollingStrategy
        pollingStrategy = new Metadata({
          language: {
            java: {
              name: "OperationLocationPollingStrategy",
              namespace: getJavaNamespace(this.namespace) + ".implementation",
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
        pollingSchema = this.processSchemaFromSdkType(sdkType, "pollResult");
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
        finalSchema = this.processSchemaFromSdkType(sdkType, "finalResult");

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
        finalResultPropertySerializedName
      );
      return op.lroMetadata;
    }

    return new LongRunningMetadata(false);
  }

  private processRouteForLongRunning(
    op: CodeModelOperation,
    operation: Operation,
    responses: HttpOperationResponse[],
    lroMetadata: LongRunningMetadata
  ) {
    if (lroMetadata.longRunning) {
      op.extensions = op.extensions ?? {};
      op.extensions["x-ms-long-running-operation"] = true;
      return;
    }

    for (const resp of responses) {
      if (resp.responses && resp.responses.length > 0 && resp.responses[0].headers) {
        for (const [_, header] of Object.entries(resp.responses[0].headers)) {
          if (isPollingLocation(this.program, header)) {
            op.extensions = op.extensions ?? {};
            op.extensions["x-ms-long-running-operation"] = true;

            break;
          }
        }
      }
    }
  }

  private _armApiVersionParameter?: Parameter;

  private processParameter(
    op: CodeModelOperation,
    param: HttpOperationParameter,
    clientContext: ClientContext
  ) {
    if (clientContext.apiVersions && isApiVersion(this.sdkContext, param)) {
      // pre-condition for "isApiVersion": the client supports ApiVersions
      if (this.isArm()) {
        // Currently we assume ARM tsp only have one client and one api-version.
        // TODO: How will service define mixed api-versions(like those in Compute RP)?
        const apiVersion = this.apiVersion?.value;
        if (!this._armApiVersionParameter) {
          this._armApiVersionParameter = this.createApiVersionParameter(
            "api-version",
            param.type === "query" ? ParameterLocation.Query : ParameterLocation.Path,
            apiVersion
          );
          clientContext.addGlobalParameter(this._armApiVersionParameter);
        }
        op.addParameter(this._armApiVersionParameter);
      } else {
        const parameter =
          param.type === "query" ? this.apiVersionParameter : this.apiVersionParameterInPath;
        op.addParameter(parameter);
        clientContext.addGlobalParameter(parameter);
      }
    } else if (this.isSubscriptionId(param)) {
      const parameter = this.subscriptionIdParameter(param);
      op.addParameter(parameter);
      clientContext.addGlobalParameter(parameter);
    } else if (SPECIAL_HEADER_NAMES.has(param.name.toLowerCase())) {
      // special headers
      op.specialHeaders = op.specialHeaders ?? [];
      if (!stringArrayContainsIgnoreCase(op.specialHeaders, param.name)) {
        op.specialHeaders.push(param.name);
      }
    } else {
      // schema
      let schema;
      const sdkType = getNonNullSdkType(getClientType(this.sdkContext, param.param));
      if (
        param.type === "header" &&
        param.param.type.kind === "Scalar" &&
        getEncode(this.program, param.param) === undefined &&
        getEncode(this.program, param.param.type) === undefined &&
        (hasScalarAsBase(param.param.type, "utcDateTime") ||
          hasScalarAsBase(param.param.type, "offsetDateTime")) &&
        (sdkType.kind === "utcDateTime" || sdkType.kind === "offsetDateTime")
      ) {
        // utcDateTime in header maps to rfc7231
        schema = this.processDateTimeSchemaFromSdkType(sdkType, param.param.name, true);
      } else {
        schema = this.processSchemaFromSdkType(sdkType, param.param.name);
      }

      // skip-url-encoding
      let extensions: { [id: string]: any } | undefined = undefined;
      if (
        (param.type === "query" || param.type === "path") &&
        param.param.type.kind === "Scalar" &&
        schema instanceof UriSchema
      ) {
        extensions = { "x-ms-skip-url-encoding": true };
      }

      if (this.supportsAdvancedVersioning()) {
        // versioning
        const addedOn = getAddedOnVersions(this.program, param.param);
        if (addedOn) {
          extensions = extensions ?? {};
          extensions["x-ms-versioning-added"] = clientContext.getAddedVersions(addedOn);
        }
      }

      // format if array
      let style = undefined;
      let explode = undefined;
      if (param.param.type.kind === "Model" && isArrayModelType(this.program, param.param.type)) {
        if (param.type === "query") {
          const queryParamOptions = getQueryParamOptions(this.program, param.param);
          switch (queryParamOptions?.format) {
            case "csv":
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
              style = SerializationStyle.Form;
              explode = true;
              break;

            default:
              if (queryParamOptions?.format) {
                this.logWarning(
                  `Unrecognized query parameter format: '${queryParamOptions?.format}'.`
                );
              }
              break;
          }
        } else if (param.type === "header") {
          const headerFieldOptions = getHeaderFieldOptions(this.program, param.param);
          switch (headerFieldOptions?.format) {
            case "csv":
              style = SerializationStyle.Simple;
              break;

            default:
              if (headerFieldOptions?.format) {
                this.logWarning(
                  `Unrecognized header parameter format: '${headerFieldOptions?.format}'.`
                );
              }
              break;
          }
        }
      }

      const nullable = isNullableType(param.param.type);
      const parameter = new Parameter(this.getName(param.param), this.getDoc(param.param), schema, {
        summary: this.getSummary(param.param),
        implementation: ImplementationLocation.Method,
        required: !param.param.optional,
        nullable: nullable,
        protocol: {
          http: new HttpParameter(param.type, {
            style: style,
            explode: explode,
          }),
        },
        language: {
          default: {
            serializedName: this.getSerializedName(param.param),
          },
        },
        extensions: extensions,
      });
      op.addParameter(parameter);

      this.trackSchemaUsage(schema, { usage: [SchemaContext.Input] });

      if (op.convenienceApi) {
        this.trackSchemaUsage(schema, {
          usage: [op.internalApi ? SchemaContext.Internal : SchemaContext.Public],
        });
      }
    }
  }

  private addAcceptHeaderParameter(op: CodeModelOperation, responses: HttpOperationResponse[]) {
    if (
      op.parameters?.some((it) => it.language.default.serializedName?.toLowerCase() === "accept")
    ) {
      // parameters already include "accept" header
      return;
    }

    const produces = new Set<string>();
    for (const resp of responses) {
      if (resp.responses && resp.responses.length > 0) {
        for (const response of resp.responses) {
          response.body?.contentTypes.forEach((it) => produces.add(it));
        }
      }
    }
    if (produces.size === 0) {
      produces.add("application/json");
    }
    const acceptTypes = Array.from(produces.values()).join(", ");

    const acceptSchema =
      this.codeModel.schemas.constants?.find(
        (it) => it.language.default.name === "accept" && it.value.value === acceptTypes
      ) ||
      this.codeModel.schemas.add(
        new ConstantSchema("accept", `Accept: ${acceptTypes}`, {
          valueType: this.stringSchema,
          value: new ConstantValue(acceptTypes),
        })
      );
    op.addParameter(
      new Parameter("accept", "Accept header", acceptSchema, {
        implementation: ImplementationLocation.Method,
        origin: "modelerfour:synthesized/accept",
        required: true,
        protocol: {
          http: new HttpParameter(ParameterLocation.Header),
        },
        language: {
          default: {
            serializedName: "accept",
          },
        },
      })
    );
  }

  private processEtagHeaderParameters(op: CodeModelOperation, httpOperation: HttpOperation) {
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

        const namespace = getNamespace(httpOperation.operation);
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
          })
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
          }
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
                }
              )
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
    httpOperation: HttpOperation,
    body: ModelProperty | Model
  ) {
    // set contentTypes to mediaTypes
    op.requests![0].protocol.http!.mediaTypes = httpOperation.parameters.body!.contentTypes;

    const parameters = httpOperation.operation.parameters;

    const unknownRequestBody =
      op.requests![0].protocol.http!.mediaTypes &&
      op.requests![0].protocol.http!.mediaTypes.length > 0 &&
      !isKnownContentType(op.requests![0].protocol.http!.mediaTypes);

    const sdkType: SdkType = getClientType(this.sdkContext, body, httpOperation.operation);

    let schema: Schema;
    if (
      unknownRequestBody &&
      body.kind === "ModelProperty" &&
      body.type.kind === "Scalar" &&
      body.type.name === "bytes"
    ) {
      // handle binary request body
      schema = this.processBinarySchema(body.type);
    } else {
      schema = this.processSchemaFromSdkType(sdkType, body.name);
    }

    // Explicit body parameter @body or @bodyRoot would result to body.kind === "ModelProperty"
    // Implicit body parameter would result to body.kind === "Model"
    // see https://typespec.io/docs/libraries/http/cheat-sheet#data-types
    const bodyParameterFlatten = sdkType.kind === "model" && body.kind === "Model" && !this.isArm();

    const parameterName =
      body.kind === "Model" ? (sdkType.kind === "model" ? sdkType.name : "") : this.getName(body);
    const parameter = new Parameter(parameterName, this.getDoc(body), schema, {
      summary: this.getSummary(body),
      implementation: ImplementationLocation.Method,
      required: body.kind === "Model" || !body.optional,
      protocol: {
        http: new HttpParameter(ParameterLocation.Body),
      },
    });
    op.addParameter(parameter);

    this.trackSchemaUsage(schema, { usage: [SchemaContext.Input] });

    if (op.convenienceApi) {
      // model/schema does not need to be Public or Internal, if it is not to be used in convenience API
      this.trackSchemaUsage(schema, {
        usage: [op.internalApi ? SchemaContext.Internal : SchemaContext.Public],
      });
    }

    if (operationIsJsonMergePatch(httpOperation)) {
      this.trackSchemaUsage(schema, { usage: [SchemaContext.JsonMergePatch] });
    }
    if (op.convenienceApi && operationIsMultipart(httpOperation)) {
      this.trackSchemaUsage(schema, { serializationFormats: [KnownMediaType.Multipart] });
    }

    if (schema instanceof ObjectSchema && bodyParameterFlatten) {
      // flatten body parameter

      // name the schema for documentation
      schema.language.default.name = pascalCase(op.language.default.name) + "Request";

      if (!parameter.language.default.name) {
        // name the parameter for documentation
        parameter.language.default.name = "request";
      }

      if (operationIsJsonMergePatch(httpOperation)) {
        // skip model flatten, if "application/merge-patch+json"
        schema.language.default.name = pascalCase(op.language.default.name) + "PatchRequest";
        return;
      }

      this.trackSchemaUsage(schema, { usage: [SchemaContext.Anonymous] });

      if (op.convenienceApi && op.parameters) {
        op.convenienceApi.requests = [];
        const request = new Request({
          protocol: op.requests![0].protocol,
        });
        request.parameters = [];
        op.convenienceApi.requests.push(request);

        for (const [_, opParameter] of parameters.properties) {
          const serializedName = this.getSerializedName(opParameter);
          const existParameter = op.parameters.find(
            (it) => it.language.default.serializedName === serializedName
          );
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
              (it) => it.serializedName === serializedName
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
                    originalParameter: parameter,
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
                  }
                )
              );
            }
          }
        }
        request.signatureParameters = request.parameters;

        if (request.signatureParameters.length > 6) {
          // create an option bag
          const name = op.language.default.name + "Options";
          const namespace = getNamespace(httpOperation.operation);
          // option bag schema
          const optionBagSchema = this.codeModel.schemas.add(
            new GroupSchema(name, `Options for ${op.language.default.name} API`, {
              language: {
                default: {
                  namespace: namespace,
                },
                java: {
                  namespace: getJavaNamespace(namespace),
                },
              },
            })
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
                }
              )
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
            }
          );

          request.signatureParameters = [optionBagParameter];
          request.parameters.forEach((it) => (it.groupedBy = optionBagParameter));
          request.parameters.push(optionBagParameter);
        }
      }
    }
  }

  private findResponseBody(bodyType: Type): Type {
    // find a type that possibly without http metadata like @statusCode
    return this.getEffectiveSchemaType(bodyType);
  }

  private processResponse(
    op: CodeModelOperation,
    resp: HttpOperationResponse,
    longRunning: boolean
  ) {
    // TODO: what to do if more than 1 response?
    // It happens when the response type is Union, on one status code.
    let response: Response;
    let headers: Array<HttpHeader> | undefined = undefined;
    if (resp.responses && resp.responses.length > 0) {
      // headers
      headers = [];
      for (const response of resp.responses.values()) {
        if (response.headers) {
          for (const [key, header] of Object.entries(response.headers)) {
            const sdkType = getClientType(this.sdkContext, header);
            const schema = this.processSchemaFromSdkType(sdkType, key);
            headers.push(
              new HttpHeader(key, schema, {
                language: {
                  default: {
                    name: key,
                    description: this.getDoc(header),
                  },
                },
              })
            );
          }
        }
      }
    }

    let responseBody: HttpOperationBody | HttpOperationMultipartBody | undefined = undefined;
    let bodyType: Type | undefined = undefined;
    let trackConvenienceApi: boolean = Boolean(op.convenienceApi);
    if (resp.responses && resp.responses.length > 0 && resp.responses[0].body) {
      responseBody = resp.responses[0].body;
    }
    if (responseBody) {
      const unknownResponseBody =
        responseBody.contentTypes.length > 0 && !isKnownContentType(responseBody.contentTypes);

      bodyType = this.findResponseBody(responseBody.type);
      if (unknownResponseBody && bodyType.kind === "Scalar" && bodyType.name === "bytes") {
        // binary
        response = new BinaryResponse({
          protocol: {
            http: {
              statusCodes: this.getStatusCodes(resp.statusCodes),
              headers: headers,
              mediaTypes: responseBody.contentTypes,
              knownMediaType: KnownMediaType.Binary,
            },
          },
          language: {
            default: {
              name: op.language.default.name + "Response",
              description: this.getResponseDescription(resp),
            },
          },
        });
      } else {
        // schema (usually JSON)
        let schema: Schema | undefined = undefined;
        if (longRunning) {
          // LRO uses the LroMetadata for poll/final result, not the response of activation request
          trackConvenienceApi = false;
        }
        if (!schema) {
          const sdkType = getClientType(this.sdkContext, bodyType);
          schema = this.processSchemaFromSdkType(sdkType, op.language.default.name + "Response");
        }
        response = new SchemaResponse(schema, {
          protocol: {
            http: {
              statusCodes: this.getStatusCodes(resp.statusCodes),
              headers: headers,
              mediaTypes: responseBody.contentTypes,
            },
          },
          language: {
            default: {
              name: op.language.default.name + "Response",
              description: this.getResponseDescription(resp),
            },
          },
        });
      }
    } else {
      // not binary nor schema, usually NoContent
      response = new Response({
        protocol: {
          http: {
            statusCodes: this.getStatusCodes(resp.statusCodes),
            headers: headers,
          },
        },
        language: {
          default: {
            name: op.language.default.name + "Response",
            description: this.getResponseDescription(resp),
          },
        },
      });
    }
    if (resp.statusCodes === "*" || (bodyType && isErrorModel(this.program, bodyType))) {
      // "*", or the model is @error
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

  private getResponseDescription(resp: HttpOperationResponse): string {
    return (
      resp.description ||
      (resp.statusCodes === "*"
        ? "An unexpected error response"
        : getStatusCodeDescription(resp.statusCodes)) ||
      ""
    );
  }

  private processSchemaFromSdkType(type: SdkType, nameHint: string): Schema {
    return this.schemaCache.process(type, nameHint) || fail("Unable to process schema.");
  }

  private processSchemaFromSdkTypeImpl(type: SdkType, nameHint: string): Schema {
    if (isSdkBuiltInKind(type.kind)) {
      return this.processBuiltInFromSdkType(type as SdkBuiltInType, nameHint);
    } else {
      switch (type.kind) {
        case "enum":
          return this.processChoiceSchemaFromSdkType(type, type.name);

        case "enumvalue":
          return this.processConstantSchemaFromEnumValueFromSdkType(type, nameHint);

        case "union":
          return this.processUnionSchemaFromSdkType(type, type.name);

        case "model":
          return this.processObjectSchemaFromSdkType(type, type.name);

        case "dict":
          return this.processDictionarySchemaFromSdkType(type, nameHint);

        case "array":
          return this.processArraySchemaFromSdkType(type, nameHint);

        case "duration":
          return this.processDurationSchemaFromSdkType(
            type,
            nameHint,
            getDurationFormatFromSdkType(type)
          );

        case "constant":
          return this.processConstantSchemaFromSdkType(type, nameHint);

        case "utcDateTime":
        case "offsetDateTime":
          if (type.encode === "unixTimestamp") {
            return this.processUnixTimeSchemaFromSdkType(type, nameHint);
          } else {
            return this.processDateTimeSchemaFromSdkType(type, nameHint, type.encode === "rfc7231");
          }
      }
    }
    throw new Error(`Unrecognized type: '${type.kind}'.`);
  }

  private processBuiltInFromSdkType(type: SdkBuiltInType, nameHint: string): Schema {
    nameHint = nameHint || type.kind;

    if (isSdkIntKind(type.kind)) {
      const integerSize = type.kind === "safeint" || type.kind.includes("int64") ? 64 : 32;
      return this.processIntegerSchemaFromSdkType(type, nameHint, integerSize);
    } else {
      switch (type.kind) {
        case "any":
          return this.processAnySchemaFromSdkType();

        case "string":
          return this.processStringSchemaFromSdkType(type, nameHint);

        case "float":
        case "float32":
        case "float64":
          return this.processNumberSchemaFromSdkType(type, nameHint);

        case "decimal":
        case "decimal128":
          return this.processDecimalSchemaFromSdkType(type, nameHint);

        case "bytes":
          return this.processByteArraySchemaFromSdkType(type, nameHint);

        case "boolean":
          return this.processBooleanSchemaFromSdkType(type, nameHint);

        case "plainTime":
          return this.processTimeSchemaFromSdkType(type, nameHint);

        case "plainDate":
          return this.processDateSchemaFromSdkType(type, nameHint);

        case "url":
          return this.processUrlSchemaFromSdkType(type, nameHint);
      }
    }
  }

  private processAnySchemaFromSdkType(): AnySchema {
    return this.anySchema;
  }

  private processStringSchemaFromSdkType(type: SdkBuiltInType, name: string): StringSchema {
    return this.codeModel.schemas.add(
      new StringSchema(name, type.details ?? "", {
        summary: type.description,
      })
    );
  }

  private processByteArraySchemaFromSdkType(type: SdkBuiltInType, name: string): ByteArraySchema {
    const base64Encoded: boolean = type.encode === "base64url";
    return this.codeModel.schemas.add(
      new ByteArraySchema(name, type.details ?? "", {
        summary: type.description,
        format: base64Encoded ? "base64url" : "byte",
      })
    );
  }

  private processIntegerSchemaFromSdkType(
    type: SdkBuiltInType,
    name: string,
    precision: number
  ): NumberSchema {
    return this.codeModel.schemas.add(
      new NumberSchema(name, type.details ?? "", SchemaType.Integer, precision, {
        summary: type.description,
      })
    );
  }

  private processNumberSchemaFromSdkType(type: SdkBuiltInType, name: string): NumberSchema {
    return this.codeModel.schemas.add(
      new NumberSchema(name, type.details ?? "", SchemaType.Number, 64, {
        summary: type.description,
      })
    );
  }

  private processDecimalSchemaFromSdkType(type: SdkBuiltInType, name: string): NumberSchema {
    // "Infinity" maps to "BigDecimal" in Java
    return this.codeModel.schemas.add(
      new NumberSchema(name, type.details ?? "", SchemaType.Number, Infinity, {
        summary: type.description,
      })
    );
  }

  private processBooleanSchemaFromSdkType(type: SdkBuiltInType, name: string): BooleanSchema {
    return this.codeModel.schemas.add(
      new BooleanSchema(name, type.details ?? "", {
        summary: type.description,
      })
    );
  }

  private processArraySchemaFromSdkType(type: SdkArrayType, name: string): ArraySchema {
    let nullableItems = false;
    let elementType = type.valueType;
    if (elementType.kind === "nullable") {
      nullableItems = true;
      elementType = elementType.type;
    }

    const elementSchema = this.processSchemaFromSdkType(elementType, name);
    return this.codeModel.schemas.add(
      new ArraySchema(name, type.details ?? "", elementSchema, {
        summary: type.description,
        nullableItems: nullableItems,
      })
    );
  }

  private processDictionarySchemaFromSdkType(
    type: SdkDictionaryType,
    name: string
  ): DictionarySchema {
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
    const elementSchema = this.processSchemaFromSdkType(elementType, name);
    dictSchema.elementType = elementSchema;

    dictSchema.nullableItems = nullableItems;

    return this.codeModel.schemas.add(dictSchema);
  }

  private processChoiceSchemaFromSdkType(
    type: SdkEnumType,
    name: string
  ): ChoiceSchema | SealedChoiceSchema | ConstantSchema {
    const rawEnumType = type.__raw;
    const namespace = getNamespace(rawEnumType);
    const valueType = this.processSchemaFromSdkType(type.valueType, type.valueType.kind);

    const choices: ChoiceValue[] = [];
    type.values.forEach((it: SdkEnumValueType) =>
      choices.push(new ChoiceValue(it.name, it.description ?? "", it.value ?? it.name))
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
          namespace: getJavaNamespace(namespace),
        },
      },
    });
    schema.crossLanguageDefinitionId = type.crossLanguageDefinitionId;
    return this.codeModel.schemas.add(schema);
  }

  private processConstantSchemaFromSdkType(type: SdkConstantType, name: string): ConstantSchema {
    const valueType = this.processSchemaFromSdkType(type.valueType, type.valueType.kind);

    return this.codeModel.schemas.add(
      new ConstantSchema(type.name ?? name, type.details ?? "", {
        summary: type.description,
        valueType: valueType,
        value: new ConstantValue(type.value),
      })
    );
  }

  private processConstantSchemaFromEnumValueFromSdkType(
    type: SdkEnumValueType,
    name: string
  ): ConstantSchema {
    const valueType = this.processSchemaFromSdkType(type.enumType, type.enumType.name);

    return this.codeModel.schemas.add(
      new ConstantSchema(type.name ?? name, type.details ?? "", {
        summary: type.description,
        valueType: valueType,
        value: new ConstantValue(type.value ?? type.name),
      })
    );
  }

  private processUnixTimeSchemaFromSdkType(type: SdkDateTimeType, name: string): UnixTimeSchema {
    return this.codeModel.schemas.add(
      new UnixTimeSchema(name, type.details ?? "", {
        summary: type.description,
      })
    );
  }

  private processDateTimeSchemaFromSdkType(
    type: SdkDateTimeType,
    name: string,
    rfc1123: boolean
  ): DateTimeSchema {
    return this.codeModel.schemas.add(
      new DateTimeSchema(name, type.details ?? "", {
        summary: type.description,
        format: rfc1123 ? "date-time-rfc1123" : "date-time",
      })
    );
  }

  private processDateSchemaFromSdkType(type: SdkBuiltInType, name: string): DateSchema {
    return this.codeModel.schemas.add(
      new DateSchema(name, type.details ?? "", {
        summary: type.description,
      })
    );
  }

  private processTimeSchemaFromSdkType(type: SdkBuiltInType, name: string): TimeSchema {
    return this.codeModel.schemas.add(
      new TimeSchema(name, type.details ?? "", {
        summary: type.description,
      })
    );
  }

  private processDurationSchemaFromSdkType(
    type: SdkDurationType,
    name: string,
    format: DurationSchema["format"] = "duration-rfc3339"
  ): DurationSchema {
    return this.codeModel.schemas.add(
      new DurationSchema(name, type.details ?? "", {
        summary: type.description,
        format: format,
      })
    );
  }

  private processUrlSchemaFromSdkType(type: SdkBuiltInType, name: string): UriSchema {
    return this.codeModel.schemas.add(
      new UriSchema(name, type.details ?? "", {
        summary: type.description,
      })
    );
  }

  private processObjectSchemaFromSdkType(type: SdkModelType, name: string): ObjectSchema {
    const rawModelType = type.__raw;
    const namespace = getNamespace(rawModelType);
    const objectSchema = new ObjectSchema(name, type.details ?? "", {
      summary: type.description,
      language: {
        default: {
          namespace: namespace,
        },
        java: {
          namespace: getJavaNamespace(namespace),
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
        this.processModelPropertyFromSdkType(type.discriminatorProperty)
      );
      for (const discriminatorValue in type.discriminatedSubtypes) {
        const subType = type.discriminatedSubtypes[discriminatorValue];
        this.processSchemaFromSdkType(subType, subType.name);
      }
    }

    // type is a subtype
    if (type.baseModel) {
      const parentSchema = this.processSchemaFromSdkType(type.baseModel, type.baseModel.name);
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
      const parentSchema = this.processSchemaFromSdkType(sdkDictType, "Record");
      objectSchema.parents = objectSchema.parents ?? new Relations();
      objectSchema.parents.immediate.push(parentSchema);
      pushDistinct(objectSchema.parents.all, parentSchema);
      objectSchema.discriminatorValue = type.discriminatorValue;
    }

    // properties
    for (const prop of type.properties) {
      if (prop.kind === "property" && !prop.discriminator) {
        objectSchema.addProperty(this.processModelPropertyFromSdkType(prop));
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

  private processModelPropertyFromSdkType(prop: SdkModelPropertyType): Property {
    let nullable = false;
    let nonNullType = prop.type;
    if (nonNullType.kind === "nullable") {
      nullable = true;
      nonNullType = nonNullType.type;
    }
    let schema = this.processSchemaFromSdkType(nonNullType, "");

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
        schema = this.processMultipartFormDataFilePropertySchemaFromSdkType(prop, this.namespace);
      }
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

  private processUnionSchemaFromSdkType(type: SdkUnionType, name: string): Schema {
    if (!(type.__raw && type.__raw.kind === "Union")) {
      throw new Error(`Invalid type for union: '${type.kind}'.`);
    }
    const rawUnionType: Union = type.__raw as Union;
    const namespace = getNamespace(rawUnionType);
    const baseName = type.name ?? pascalCase(name) + "Model";
    this.logWarning(
      `Convert TypeSpec Union '${getUnionDescription(rawUnionType, this.typeNameOptions)}' to Class '${baseName}'`
    );
    const unionSchema = new OrSchema(baseName + "Base", type.details ?? "", {
      summary: type.description,
    });
    unionSchema.anyOf = [];
    type.values.forEach((it) => {
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
            namespace: getJavaNamespace(namespace),
          },
        },
      });

      const variantSchema = this.processSchemaFromSdkType(it, variantName);
      objectSchema.addProperty(
        new Property(propertyName, type.details ?? "", variantSchema, {
          summary: type.description,
          required: true,
          readOnly: false,
        })
      );
      unionSchema.anyOf.push(objectSchema);
    });
    return this.codeModel.schemas.add(unionSchema);
  }

  private processBinarySchema(type: Scalar): BinarySchema {
    return this.codeModel.schemas.add(
      new BinarySchema(this.getDoc(type), {
        summary: this.getSummary(type),
      })
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

  private processMultipartFormDataFilePropertySchemaFromSdkType(
    property: SdkBodyModelPropertyType,
    namespace: string
  ): Schema {
    const processSchemaFunc = (type: SdkType) => this.processSchemaFromSdkType(type, "");
    if (property.type.kind === "bytes" || property.type.kind === "model") {
      return getFileDetailsSchema(
        property,
        namespace,
        this.codeModel.schemas,
        this.binarySchema,
        this.stringSchema,
        processSchemaFunc
      );
    } else if (
      property.type.kind === "array" &&
      (property.type.valueType.kind === "bytes" || property.type.valueType.kind === "model")
    ) {
      return new ArraySchema(
        property.name,
        property.details ?? "",
        getFileDetailsSchema(
          property,
          namespace,
          this.codeModel.schemas,
          this.binarySchema,
          this.stringSchema,
          processSchemaFunc
        ),
        {
          summary: property.description,
        }
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

  private getName(
    target: ModelProperty | Operation,
    nameHint: string | undefined = undefined
  ): string {
    // TODO: once getLibraryName API in typespec-client-generator-core can get projected name from language and client, as well as can handle template case, use getLibraryName API
    const emitterClientName = getClientNameOverride(this.sdkContext, target);
    if (emitterClientName && typeof emitterClientName === "string") {
      return emitterClientName;
    }
    // TODO: deprecate getProjectedName
    const languageProjectedName = getProjectedName(this.program, target, "java");
    if (languageProjectedName) {
      return languageProjectedName;
    }

    const clientProjectedName = getProjectedName(this.program, target, "client");
    if (clientProjectedName) {
      return clientProjectedName;
    }

    const friendlyName = getFriendlyName(this.program, target);
    if (friendlyName) {
      return friendlyName;
    }

    if (typeof target.name === "symbol") {
      return "";
    }
    return target.name || "";
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

  private getConvenienceApiName(op: Operation): string | undefined {
    // check @convenienceMethod
    if (shouldGenerateConvenient(this.sdkContext, op)) {
      return this.getName(op);
    } else {
      return undefined;
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
        new NumberSchema("integer", "simple integer", SchemaType.Integer, 64)
      ))
    );
  }

  private _doubleSchema?: NumberSchema;
  get doubleSchema(): NumberSchema {
    return (
      this._doubleSchema ||
      (this._doubleSchema = this.codeModel.schemas.add(
        new NumberSchema("double", "simple float", SchemaType.Number, 64)
      ))
    );
  }

  private _booleanSchema?: BooleanSchema;
  get booleanSchema(): BooleanSchema {
    return (
      this._booleanSchema ||
      (this._booleanSchema = this.codeModel.schemas.add(
        new BooleanSchema("boolean", "simple boolean")
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
        this.stringSchema
      ))
    );
  }

  private createApiVersionParameter(
    serializedName: string,
    parameterLocation: ParameterLocation,
    value = ""
  ): Parameter {
    return new Parameter(
      serializedName,
      "Version parameter",
      this.codeModel.schemas.add(
        new ConstantSchema(serializedName, "API Version", {
          valueType: this.stringSchema,
          value: new ConstantValue(value),
        })
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
      }
    );
  }

  private _apiVersionParameter?: Parameter;
  get apiVersionParameter(): Parameter {
    return (
      this._apiVersionParameter ||
      (this._apiVersionParameter = this.createApiVersionParameter(
        "api-version",
        ParameterLocation.Query
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
        ParameterLocation.Path
      ))
    );
  }

  private isSubscriptionId(param: HttpOperationParameter): boolean {
    return (
      "subscriptionId".toLocaleLowerCase() === param?.name?.toLocaleLowerCase() &&
      param.param &&
      isArmCommonType(param.param) &&
      isPathParam(this.program, param.param)
    );
  }

  private subscriptionIdParameter(parameter: HttpOperationParameter): Parameter {
    if (!this._subscriptionParameter) {
      const param = parameter.param;
      const description = getDoc(this.program, param);
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
        }
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
    const schemaUsage = {
      usage: (schema as SchemaUsage).usage?.filter(
        (it) => it !== SchemaContext.Paged && it !== SchemaContext.Anonymous
      ),
      serializationFormats: (schema as SchemaUsage).serializationFormats?.filter(
        (it) => it !== KnownMediaType.Multipart
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
          ...schemaUsage.serializationFormats
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
