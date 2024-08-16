// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.util;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModelProperty;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PrimitiveType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ServiceClientProperty;

public class ModelNamer {

    public String modelPropertyGetterName(ServiceClientProperty property) {
        return modelPropertyGetterName(property.getType(), property.getName());
    }

    public String modelPropertyGetterName(ClientModelProperty property) {
        return modelPropertyGetterName(property.getClientType(), property.getName());
    }

    public String modelPropertyGetterName(IType clientType, String propertyName) {
        String prefix = "get";
        if (clientType == PrimitiveType.BOOLEAN || clientType == ClassType.BOOLEAN) {
            prefix = "is";
            if (CodeNamer.toCamelCase(propertyName).startsWith(prefix)) {
                return CodeNamer.toCamelCase(propertyName);
            }
        }
        return prefix + CodeNamer.toPascalCase(propertyName);
    }

    public String modelPropertyGetterName(String propertyName) {
        return "get" + CodeNamer.toPascalCase(propertyName);
    }

    public String modelPropertySetterName(ClientModelProperty property) {
        return "set" + CodeNamer.toPascalCase(property.getName());
    }

    public String modelPropertySetterName(String propertyName) {
        return "set" + CodeNamer.toPascalCase(propertyName);
    }
}
