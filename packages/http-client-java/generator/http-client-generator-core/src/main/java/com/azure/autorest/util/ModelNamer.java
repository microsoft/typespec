// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.azure.autorest.util;

import com.azure.autorest.model.clientmodel.ClassType;
import com.azure.autorest.model.clientmodel.ClientModelProperty;
import com.azure.autorest.model.clientmodel.IType;
import com.azure.autorest.model.clientmodel.PrimitiveType;
import com.azure.autorest.model.clientmodel.ServiceClientProperty;

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
