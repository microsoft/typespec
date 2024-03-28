// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { getDoc, getFormat, Program, Type } from "@typespec/compiler";
import { HttpServer } from "@typespec/http";
import { InputConstant } from "../type/inputConstant.js";
import { InputOperationParameterKind } from "../type/inputOperationParameterKind.js";
import { InputParameter } from "../type/inputParameter.js";
import {
    InputEnumType,
    InputModelType,
    InputPrimitiveType,
    InputType
} from "../type/inputType.js";
import { InputPrimitiveTypeKind } from "../type/inputPrimitiveTypeKind.js";
import { RequestLocation } from "../type/requestLocation.js";
import { getInputType, getFormattedType } from "./model.js";
import { SdkContext } from "@azure-tools/typespec-client-generator-core";
import { InputTypeKind } from "../type/inputTypeKind.js";

export interface TypeSpecServer {
    url: string;
    description?: string;
    parameters: InputParameter[];
}

function getDefaultValue(type: Type): any {
    switch (type.kind) {
        case "String":
            return type.value;
        case "Number":
            return type.value;
        case "Boolean":
            return type.value;
        case "Tuple":
            return type.values.map(getDefaultValue);
        default:
            return undefined;
    }
}

export function resolveServers(
    context: SdkContext,
    servers: HttpServer[],
    models: Map<string, InputModelType>,
    enums: Map<string, InputEnumType>
): TypeSpecServer[] {
    return servers.map((server) => {
        const parameters: InputParameter[] = [];
        let url: string = server.url;
        const endpoint: string = url
            .replace("http://", "")
            .replace("https://", "")
            .split("/")[0];
        for (const [name, prop] of server.parameters) {
            const isEndpoint: boolean = endpoint === `{${name}}`;
            let defaultValue = undefined;
            const value = prop.default ? getDefaultValue(prop.default) : "";
            const inputType: InputType = isEndpoint
                ? ({
                      Kind: InputTypeKind.Primitive,
                      Name: InputPrimitiveTypeKind.Uri,
                      IsNullable: false
                  } as InputPrimitiveType)
                : getInputType(
                      context,
                      getFormattedType(context.program, prop),
                      models,
                      enums
                  );

            if (value) {
                defaultValue = {
                    Type: inputType,
                    Value: value
                } as InputConstant;
            }
            const variable: InputParameter = {
                Name: name,
                NameInRequest: name,
                Description: getDoc(context.program, prop),
                Type: inputType,
                Location: RequestLocation.Uri,
                IsApiVersion:
                    name.toLowerCase() === "apiversion" ||
                    name.toLowerCase() === "api-version",
                IsResourceParameter: false,
                IsContentType: false,
                IsRequired: true,
                IsEndpoint: isEndpoint,
                SkipUrlEncoding: false,
                Explode: false,
                Kind: InputOperationParameterKind.Client,
                DefaultValue: defaultValue
            };

            parameters.push(variable);
        }
        /* add default server. */
        if (server.url && parameters.length === 0) {
            const variable: InputParameter = {
                Name: "host",
                NameInRequest: "host",
                Description: server.description,
                Type: {
                    Kind: InputTypeKind.Primitive,
                    Name: InputPrimitiveTypeKind.String,
                    IsNullable: false
                } as InputPrimitiveType,
                Location: RequestLocation.Uri,
                IsApiVersion: false,
                IsResourceParameter: false,
                IsContentType: false,
                IsRequired: true,
                IsEndpoint: true,
                SkipUrlEncoding: false,
                Explode: false,
                Kind: InputOperationParameterKind.Client,
                DefaultValue: {
                    Type: {
                        Kind: InputTypeKind.Primitive,
                        Name: InputPrimitiveTypeKind.String,
                        IsNullable: false
                    } as InputPrimitiveType,
                    Value: server.url
                } as InputConstant
            };
            url = `{host}`;
            parameters.push(variable);
        }
        return {
            url: url,
            description: server.description,
            parameters
        };
    });
}
