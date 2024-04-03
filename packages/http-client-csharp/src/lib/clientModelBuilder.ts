// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import {
    SdkClient,
    listClients,
    listOperationGroups,
    listOperationsInOperationGroup,
    SdkOperationGroup,
    SdkContext,
    getLibraryName
} from "@azure-tools/typespec-client-generator-core";
import {
    EmitContext,
    listServices,
    Service,
    getDoc,
    getNamespaceFullName,
    Operation,
    ignoreDiagnostics,
    NoTarget,
    Namespace,
    Interface,
    getLocationContext
} from "@typespec/compiler";
import {
    getAuthentication,
    getServers,
    HttpOperation,
    getAllHttpServices,
    getHttpOperation
} from "@typespec/http";
import { getVersions } from "@typespec/versioning";
import { NetEmitterOptions, resolveOptions } from "../options.js";
import { CodeModel } from "../type/codeModel.js";
import { InputConstant } from "../type/inputConstant.js";
import { InputOperationParameterKind } from "../type/inputOperationParameterKind.js";
import { InputParameter } from "../type/inputParameter.js";
import {
    InputEnumType,
    InputModelType,
    InputPrimitiveType
} from "../type/inputType.js";
import { InputPrimitiveTypeKind } from "../type/inputPrimitiveTypeKind.js";
import { RequestLocation } from "../type/requestLocation.js";
import { getExternalDocs } from "./decorators.js";
import { processServiceAuthentication } from "./serviceAuthentication.js";
import { resolveServers } from "./typespecServer.js";
import { InputClient } from "../type/inputClient.js";
import { ClientKind } from "../type/clientKind.js";
import { InputOperation } from "../type/inputOperation.js";
import { getUsages, navigateModels } from "./model.js";
import { Usage } from "../type/usage.js";
import { loadOperation } from "./operation.js";
import { logger } from "./logger.js";
import { $lib } from "../emitter.js";
import { createContentTypeOrAcceptParameter } from "./utils.js";
import { InputTypeKind } from "../type/inputTypeKind.js";

export function createModel(
    sdkContext: SdkContext<NetEmitterOptions>
): CodeModel {
    const services = listServices(sdkContext.emitContext.program);
    if (services.length === 0) {
        services.push({
            type: sdkContext.emitContext.program.getGlobalNamespaceType()
        });
    }

    // TODO: support multiple service. Current only chose the first service.
    const service = services[0];
    const serviceNamespaceType = service.type;
    if (serviceNamespaceType === undefined) {
        throw Error("Can not emit yaml for a namespace that doesn't exist.");
    }

    return createModelForService(sdkContext, service);
}

export function createModelForService(
    sdkContext: SdkContext<NetEmitterOptions>,
    service: Service
): CodeModel {
    const emitterOptions = resolveOptions(sdkContext.emitContext);
    const program = sdkContext.emitContext.program;
    const serviceNamespaceType = service.type;

    const apiVersions: Set<string> | undefined = new Set<string>();
    let defaultApiVersion: string | undefined = undefined;
    const versions = getVersions(program, service.type)[1]?.getVersions();
    if (versions && versions.length > 0) {
        for (const ver of versions) {
            apiVersions.add(ver.value);
        }
        defaultApiVersion = versions[versions.length - 1].value;
    }
    const defaultApiVersionConstant: InputConstant | undefined =
        defaultApiVersion
            ? {
                  Type: {
                      Kind: InputTypeKind.Primitive,
                      Name: InputPrimitiveTypeKind.String,
                      IsNullable: false
                  } as InputPrimitiveType,
                  Value: defaultApiVersion
              }
            : undefined;

    const description = getDoc(program, serviceNamespaceType);
    const externalDocs = getExternalDocs(sdkContext, serviceNamespaceType);

    const servers = getServers(program, serviceNamespaceType);
    const namespace = getNamespaceFullName(serviceNamespaceType) || "client";
    const authentication = getAuthentication(program, serviceNamespaceType);
    let auth = undefined;
    if (authentication) {
        auth = processServiceAuthentication(authentication);
    }

    const modelMap = new Map<string, InputModelType>();
    const enumMap = new Map<string, InputEnumType>();
    let urlParameters: InputParameter[] | undefined = undefined;
    let url: string = "";
    const convenienceOperations: HttpOperation[] = [];

    //create endpoint parameter from servers
    if (servers !== undefined) {
        const typespecServers = resolveServers(
            sdkContext,
            servers,
            modelMap,
            enumMap
        );
        if (typespecServers.length > 0) {
            /* choose the first server as endpoint. */
            url = typespecServers[0].url;
            urlParameters = typespecServers[0].parameters;
        }
    }
    const [services] = getAllHttpServices(program);
    const routes = services[0].operations;
    if (routes.length === 0) {
        $lib.reportDiagnostic(program, {
            code: "No-Route",
            format: { service: services[0].namespace.name },
            target: NoTarget
        });
    }
    logger.info("routes:" + routes.length);

    const clients: InputClient[] = [];
    const dpgClients = listClients(sdkContext);
    for (const client of dpgClients) {
        clients.push(emitClient(client));
        addChildClients(sdkContext.emitContext, client, clients);
    }

    for (const client of clients) {
        for (const op of client.Operations) {
            const apiVersionIndex = op.Parameters.findIndex(
                (value: InputParameter) => value.IsApiVersion
            );
            if (apiVersionIndex === -1) {
                continue;
            }
            const apiVersionInOperation = op.Parameters[apiVersionIndex];
            if (defaultApiVersionConstant !== undefined) {
                if (!apiVersionInOperation.DefaultValue?.Value) {
                    apiVersionInOperation.DefaultValue =
                        defaultApiVersionConstant;
                }
            } else {
                apiVersionInOperation.Kind = InputOperationParameterKind.Method;
            }
        }
    }

    navigateModels(sdkContext, serviceNamespaceType, modelMap, enumMap);

    const usages = getUsages(sdkContext, convenienceOperations, modelMap);
    setUsage(usages, modelMap);
    setUsage(usages, enumMap);

    const clientModel = {
        Name: namespace,
        Description: description,
        ApiVersions: Array.from(apiVersions.values()),
        Enums: Array.from(enumMap.values()),
        Models: Array.from(modelMap.values()),
        Clients: clients,
        Auth: auth
    } as CodeModel;
    return clientModel;

    function addChildClients(
        context: EmitContext<NetEmitterOptions>,
        client: SdkClient | SdkOperationGroup,
        clients: InputClient[]
    ) {
        const dpgOperationGroups = listOperationGroups(
            sdkContext,
            client as SdkClient
        );
        for (const dpgGroup of dpgOperationGroups) {
            var subClient = emitClient(dpgGroup, client);
            clients.push(subClient);
            addChildClients(context, dpgGroup, clients);
        }
    }

    function getClientName(client: SdkClient | SdkOperationGroup): string {
        if (client.kind === ClientKind.SdkClient) {
            return client.name;
        }

        var pathParts = client.groupPath.split(".");
        if (pathParts?.length >= 3) {
            return pathParts.slice(pathParts.length - 2).join("");
        }

        var clientName = getLibraryName(sdkContext, client.type);
        if (
            clientName === "Models" &&
            resolveOptions(sdkContext.emitContext)["model-namespace"] !== false
        ) {
            $lib.reportDiagnostic(program, {
                code: "Invalid-Name",
                format: { name: clientName },
                target: client.type
            });
            return "ModelsOps";
        }
        return clientName;
    }

    function emitClient(
        client: SdkClient | SdkOperationGroup,
        parent?: SdkClient | SdkOperationGroup
    ): InputClient {
        const operations = listOperationsInOperationGroup(sdkContext, client);
        let clientDesc = "";
        if (operations.length > 0) {
            const container = ignoreDiagnostics(
                getHttpOperation(program, operations[0])
            ).container;
            clientDesc = getDoc(program, container) ?? "";
        }

        const inputClient = {
            Name: getClientName(client),
            Description: clientDesc,
            Operations: [],
            Protocol: {},
            Creatable: client.kind === ClientKind.SdkClient,
            Parent: parent === undefined ? undefined : getClientName(parent)
        } as InputClient;
        for (const op of operations) {
            const httpOperation = ignoreDiagnostics(
                getHttpOperation(program, op)
            );
            const inputOperation: InputOperation = loadOperation(
                sdkContext,
                httpOperation,
                url,
                urlParameters,
                serviceNamespaceType,
                modelMap,
                enumMap
            );

            applyDefaultContentTypeAndAcceptParameter(inputOperation);
            inputClient.Operations.push(inputOperation);
            if (inputOperation.GenerateConvenienceMethod)
                convenienceOperations.push(httpOperation);
        }
        return inputClient;
    }
}

function setUsage(
    usages: { inputs: string[]; outputs: string[]; roundTrips: string[] },
    models: Map<string, InputModelType | InputEnumType>
) {
    for (const [name, m] of models) {
        if (m.Usage !== undefined && m.Usage !== Usage.None) continue;
        if (usages.inputs.includes(name)) {
            m.Usage = Usage.Input;
        } else if (usages.outputs.includes(name)) {
            m.Usage = Usage.Output;
        } else if (usages.roundTrips.includes(name)) {
            m.Usage = Usage.RoundTrip;
        } else {
            m.Usage = Usage.None;
        }
    }
}

function applyDefaultContentTypeAndAcceptParameter(
    operation: InputOperation
): void {
    const defaultValue: string = "application/json";
    if (
        operation.Parameters.some(
            (value) => value.Location === RequestLocation.Body
        ) &&
        !operation.Parameters.some((value) => value.IsContentType === true)
    ) {
        operation.Parameters.push(
            createContentTypeOrAcceptParameter(
                [defaultValue],
                "contentType",
                "Content-Type"
            )
        );
        operation.RequestMediaTypes = [defaultValue];
    }

    if (
        !operation.Parameters.some(
            (value) =>
                value.Location === RequestLocation.Header &&
                value.NameInRequest.toLowerCase() === "accept"
        )
    ) {
        operation.Parameters.push(
            createContentTypeOrAcceptParameter(
                [defaultValue],
                "accept",
                "Accept"
            )
        );
    }
}
