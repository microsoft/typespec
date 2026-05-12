import { createDiagnosticCollector, Diagnostic, getDoc, getSummary } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { getServers, HttpServer } from "@typespec/http";
import {
  getClientInitializationOptions,
  getClientNameOverride,
  getClientNamespace,
} from "./decorators.js";
import { getSdkHttpParameter } from "./http.js";
import {
  ClientInitializationOptions,
  InitializedByFlags,
  SdkClient,
  SdkClientInitializationType,
  SdkClientType,
  SdkEndpointParameter,
  SdkEndpointType,
  SdkHttpOperation,
  SdkPathParameter,
  SdkServiceOperation,
  SdkUnionType,
  TCGCContext,
  UsageFlags,
} from "./interfaces.js";
import {
  createGeneratedName,
  getActualClientType,
  getClientDoc,
  getTypeDecorators,
  getValueTypeValue,
  isSubscriptionId,
  updateWithApiVersionInformation,
} from "./internal-utils.js";
import { createDiagnostic } from "./lib.js";
import { createSdkMethods, getSdkMethodParameter } from "./methods.js";
import { getCrossLanguageDefinitionId } from "./public-utils.js";
import { getSdkBuiltInType, getSdkCredentialParameter, getTypeSpecBuiltInType } from "./types.js";

function getEndpointTypeFromSingleServer<
  TServiceOperation extends SdkServiceOperation = SdkHttpOperation,
>(
  context: TCGCContext,
  client: SdkClientType<TServiceOperation>,
  server: HttpServer | undefined,
): [SdkEndpointType[], readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const templateArguments: SdkPathParameter[] = [];
  const defaultOverridableEndpointType: SdkEndpointType = {
    kind: "endpoint",
    serverUrl: "{endpoint}",
    templateArguments: [
      {
        name: "endpoint",
        isGeneratedName: true,
        doc: "Service host",
        kind: "path",
        onClient: true,
        explode: false,
        style: "simple",
        allowReserved: true,
        optional: false,
        serializedName: "endpoint",
        correspondingMethodParams: [],
        methodParameterSegments: [],
        type: getSdkBuiltInType(context, $(context.program).builtin.url),
        isApiVersionParam: false,
        apiVersions: client.apiVersions,
        crossLanguageDefinitionId: `${client.crossLanguageDefinitionId}.endpoint`,
        decorators: [],
        access: "public",
        flatten: false,
      },
    ],
    decorators: [],
  };
  const types: SdkEndpointType[] = [];
  if (!server) return diagnostics.wrap([defaultOverridableEndpointType]);
  for (const param of server.parameters.values()) {
    const sdkParam = diagnostics.pipe(
      getSdkHttpParameter(context, param, undefined, undefined, "path"),
    );
    if (sdkParam.kind === "path") {
      templateArguments.push(sdkParam);
      sdkParam.onClient = true;
      if (param.defaultValue) {
        sdkParam.clientDefaultValue = getValueTypeValue(param.defaultValue);
      }
      const apiVersionInfo = updateWithApiVersionInformation(context, param, client.__raw);
      sdkParam.isApiVersionParam = apiVersionInfo.isApiVersionParam;
      if (sdkParam.isApiVersionParam && apiVersionInfo.clientDefaultValue) {
        sdkParam.clientDefaultValue = apiVersionInfo.clientDefaultValue;
      }
      sdkParam.apiVersions = client.apiVersions;
      sdkParam.crossLanguageDefinitionId = `${client.crossLanguageDefinitionId}.${param.name}`;
    } else {
      diagnostics.add(
        createDiagnostic({
          code: "server-param-not-path",
          target: param,
          format: {
            templateArgumentName: sdkParam.name,
            templateArgumentType: sdkParam.kind,
          },
        }),
      );
    }
  }
  const isOverridable =
    templateArguments.length === 1 && server.url.startsWith("{") && server.url.endsWith("}");

  if (templateArguments.length === 0) {
    types.push(defaultOverridableEndpointType);
    types[0].templateArguments[0].clientDefaultValue = server.url;
  } else {
    types.push({
      kind: "endpoint",
      serverUrl: server.url,
      templateArguments,
      decorators: [],
    });
    if (!isOverridable) {
      types.push(defaultOverridableEndpointType);
    }
  }
  return diagnostics.wrap(types);
}

function getSdkEndpointParameter<TServiceOperation extends SdkServiceOperation = SdkHttpOperation>(
  context: TCGCContext,
  client: SdkClientType<TServiceOperation>,
): [SdkEndpointParameter, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const rawClient = client.__raw;
  // For multiple services, just take the first one to get servers
  const service = rawClient.services[0];
  const servers = getServers(context.program, service);
  const types: SdkEndpointType[] = [];

  if (servers === undefined) {
    // if there is no defined server url, we will return an overridable endpoint
    types.push(...diagnostics.pipe(getEndpointTypeFromSingleServer(context, client, undefined)));
  } else {
    for (const server of servers) {
      types.push(...diagnostics.pipe(getEndpointTypeFromSingleServer(context, client, server)));
    }
  }
  let type: SdkEndpointType | SdkUnionType<SdkEndpointType>;
  if (types.length > 1) {
    type = {
      kind: "union",
      access: "public",
      usage: UsageFlags.None,
      variantTypes: types,
      name: createGeneratedName(context, service, "Endpoint"),
      isGeneratedName: true,
      apiVersions: client.apiVersions,
      crossLanguageDefinitionId: `${client.crossLanguageDefinitionId}.Endpoint`,
      namespace: getClientNamespace(context, service),
      decorators: [],
    } as SdkUnionType<SdkEndpointType>;
  } else {
    type = types[0];
  }
  return diagnostics.wrap({
    kind: "endpoint",
    type,
    name: "endpoint",
    isGeneratedName: true,
    doc: "Service host",
    onClient: true,
    urlEncode: false,
    // Endpoint parameter's api versions are derived from the client
    apiVersions: client.apiVersions,
    optional: false,
    isApiVersionParam: false,
    crossLanguageDefinitionId: `${client.crossLanguageDefinitionId}.endpoint`,
    decorators: [],
    access: "public",
    flatten: false,
  });
}

export function createSdkClientType<TServiceOperation extends SdkServiceOperation>(
  context: TCGCContext,
  client: SdkClient,
  parent?: SdkClientType<TServiceOperation>,
): [SdkClientType<TServiceOperation>, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  let name = client.name;
  if (client.type) {
    const override = getClientNameOverride(context, client.type);
    if (override) {
      name = override;
    }
  }
  const clientType = getActualClientType(client);
  const sdkClientType: SdkClientType<TServiceOperation> = {
    __raw: client,
    kind: "client",
    name,
    doc: client.type ? getClientDoc(context, client.type) : undefined,
    summary: client.type ? getSummary(context.program, client.type) : undefined,
    methods: [],
    apiVersions: context.getApiVersionsForType(clientType),
    namespace: getClientNamespace(context, clientType),
    clientInitialization: diagnostics.pipe(
      createSdkClientInitializationType(context, client, parent),
    ),
    decorators: client.type ? diagnostics.pipe(getTypeDecorators(context, client.type)) : [],
    parent,
    crossLanguageDefinitionId: getCrossLanguageDefinitionId(context, clientType),
  };
  // Handle client methods
  sdkClientType.methods = diagnostics.pipe(
    createSdkMethods<TServiceOperation>(context, client, sdkClientType),
  );
  // Handle sub-clients
  for (const subClient of client.subClients) {
    const subClientType = diagnostics.pipe(
      createSdkClientType<TServiceOperation>(context, subClient, sdkClientType),
    );
    if (sdkClientType.children) {
      sdkClientType.children.push(subClientType);
    } else {
      sdkClientType.children = [subClientType];
    }
  }
  // Handle default client parameters (endpoint, credential, api version, subscription id)
  addDefaultClientParameters(context, sdkClientType);

  return diagnostics.wrap(sdkClientType);
}

function addDefaultClientParameters<
  TServiceOperation extends SdkServiceOperation = SdkHttpOperation,
>(context: TCGCContext, client: SdkClientType<TServiceOperation>): void {
  const diagnostics = createDiagnosticCollector();
  const defaultClientParamters = [];
  // there will always be an endpoint property
  defaultClientParamters.push(diagnostics.pipe(getSdkEndpointParameter(context, client)));
  const credentialParam = getSdkCredentialParameter(context, client);
  if (credentialParam) {
    defaultClientParamters.push(credentialParam);
  }
  let apiVersionParam = context.__clientParametersCache
    .get(client.__raw)
    ?.find((x) => x.isApiVersionParam);
  if (!apiVersionParam) {
    for (const sc of client.__raw.subClients) {
      // if any sub clients have an api version param, the top level needs
      // the api version param as well
      apiVersionParam = context.__clientParametersCache.get(sc)?.find((x) => x.isApiVersionParam);
      if (apiVersionParam) {
        context.__clientParametersCache.get(client.__raw)?.push(apiVersionParam);
        break;
      }
    }
  }
  if (apiVersionParam) {
    if (client.__raw.services.length > 1) {
      // for multi-service clients, keep apiVersions empty and no default value
      // and set the type to string instead of a specific enum
      const multipleServiceApiVersionParam = { ...apiVersionParam };
      multipleServiceApiVersionParam.apiVersions = [];
      multipleServiceApiVersionParam.clientDefaultValue = undefined;
      multipleServiceApiVersionParam.type = getTypeSpecBuiltInType(context, "string");
      // For multi-service clients, the API version parameter should always be optional
      multipleServiceApiVersionParam.optional = true;
      defaultClientParamters.push(multipleServiceApiVersionParam);
    } else {
      // For single-service clients, API version parameters are optional only when they have a client default value
      if (apiVersionParam.clientDefaultValue !== undefined) {
        apiVersionParam.optional = true;
      }
      defaultClientParamters.push(apiVersionParam);
    }
  }
  let subId = context.__clientParametersCache
    .get(client.__raw)
    ?.find((x) => isSubscriptionId(context, x));
  if (subId) {
    defaultClientParamters.push(subId);
  }
  client.clientInitialization.parameters = [
    ...defaultClientParamters,
    ...client.clientInitialization.parameters,
  ];
}

function createSdkClientInitializationType<
  TServiceOperation extends SdkServiceOperation = SdkHttpOperation,
>(
  context: TCGCContext,
  client: SdkClient,
  parent?: SdkClientType<TServiceOperation> | undefined,
): [SdkClientInitializationType, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const isRootClient = !client.parent;
  const name = `${client.name}Options`;
  const result: SdkClientInitializationType = {
    kind: "clientinitialization",
    doc: "Initialization for the client",
    parameters: [],
    initializedBy: isRootClient ? InitializedByFlags.Individually : InitializedByFlags.Default,
    name,
    isGeneratedName: true,
    decorators: [],
  };
  let initializationOptions: ClientInitializationOptions | undefined = undefined;

  // customization
  if (client.type) {
    initializationOptions = getClientInitializationOptions(context, client.type);
    if (initializationOptions?.parameters) {
      result.doc = getDoc(context.program, initializationOptions.parameters);
      result.summary = getSummary(context.program, initializationOptions.parameters);
      result.name =
        initializationOptions.parameters.name === "" ? name : initializationOptions.parameters.name;
      result.isGeneratedName = initializationOptions.parameters.name === "" ? true : false;
      result.decorators = diagnostics.pipe(
        getTypeDecorators(context, initializationOptions.parameters),
      );
      result.__raw = initializationOptions.parameters;
      for (const parameter of initializationOptions.parameters.properties.values()) {
        const clientParameter = diagnostics.pipe(getSdkMethodParameter(context, parameter));
        clientParameter.onClient = true;
        result.parameters.push(clientParameter);
      }
    }
    if (initializationOptions?.initializedBy !== undefined) {
      if (
        initializationOptions.initializedBy !== InitializedByFlags.CustomizeCode &&
        isRootClient &&
        (initializationOptions.initializedBy & InitializedByFlags.Parent) ===
          InitializedByFlags.Parent
      ) {
        diagnostics.add(
          createDiagnostic({
            code: "invalid-initialized-by",
            target: client.type,
            format: {
              message:
                "First level client must have `InitializedBy.individually` specified in `initializedBy`.",
            },
          }),
        );
      } else if (
        initializationOptions.initializedBy !== InitializedByFlags.CustomizeCode &&
        !isRootClient &&
        initializationOptions.initializedBy === InitializedByFlags.Individually
      ) {
        diagnostics.add(
          createDiagnostic({
            code: "invalid-initialized-by",
            target: client.type,
            format: {
              message:
                "Sub client must have `InitializedBy.parent` or `InitializedBy.individually | InitializedBy.parent` specified in `initializedBy`.",
            },
          }),
        );
      } else {
        result.initializedBy = initializationOptions.initializedBy;
      }
    }
    if (initializationOptions?.parameters) {
      // Cache elevated parameter, then we could use it to set `onClient` property for method parameters.
      let clientParams = context.__clientParametersCache.get(client);
      if (!clientParams) {
        clientParams = [];
        context.__clientParametersCache.set(client, clientParams);
      }
      for (const param of result.parameters) {
        if (param.kind === "method") clientParams.push(param);
      }
    }
  }

  // Propagate parent client initialization parameters if InitializedBy.Parent or no InitializedBy is set
  // Only propagate if no custom parameters are set on the child
  if (
    !initializationOptions?.parameters &&
    parent &&
    result.initializedBy !== InitializedByFlags.Individually
  ) {
    // Prepend parent parameters to child parameters
    // This ensures parent parameters come first, child-specific parameters come after
    const parentParams = parent.clientInitialization.parameters;
    const childParamNames = new Set(result.parameters.map((p) => p.name));

    // Only add parent params that aren't already defined in child
    const inheritedParams = parentParams.filter((p) => !childParamNames.has(p.name));

    result.parameters = [...inheritedParams, ...result.parameters];

    // Also update the cache to include parent parameters
    let clientParams = context.__clientParametersCache.get(client);
    if (!clientParams) {
      clientParams = [];
      context.__clientParametersCache.set(client, clientParams);
    }

    for (const param of inheritedParams) {
      if (param.kind === "method" && !clientParams.some((cp) => cp.name === param.name)) {
        clientParams.push(param);
      }
    }
  }

  return diagnostics.wrap(result);
}
