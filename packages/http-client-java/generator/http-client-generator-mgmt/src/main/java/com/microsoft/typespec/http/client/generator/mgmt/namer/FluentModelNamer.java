// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.namer;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModelProperty;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;
import com.microsoft.typespec.http.client.generator.core.util.ModelNamer;

public class FluentModelNamer extends ModelNamer {

    @Override
    public String modelPropertyGetterName(ClientModelProperty property) {
        String propertyName = property.getName();
        return this.modelPropertyGetterName(propertyName);
    }

    @Override
    public String modelPropertyGetterName(IType clientType, String propertyName) {
        return this.modelPropertyGetterName(propertyName);
    }

    @Override
    public String modelPropertyGetterName(String propertyName) {
        return CodeNamer.toCamelCase(propertyName);
    }

    @Override
    public String modelPropertySetterName(ClientModelProperty property) {
        String propertyName = property.getName();
        return this.modelPropertySetterName(propertyName);
    }

    public String modelPropertySetterName(String propertyName) {
        return "with" + CodeNamer.toPascalCase(propertyName);
    }
}
