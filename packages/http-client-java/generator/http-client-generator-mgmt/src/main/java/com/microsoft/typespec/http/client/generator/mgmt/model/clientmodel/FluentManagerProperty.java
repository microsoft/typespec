// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;

import java.util.List;
import java.util.stream.Collectors;

public class FluentManagerProperty {

    private final String name;

    private final ClassType fluentType;
    private final ClassType fluentImplementType;
    private final String innerClientGetMethod;

    private final FluentResourceCollection resourceCollection;

    public FluentManagerProperty(FluentResourceCollection collection) {
        this.resourceCollection = collection;

        this.fluentType = collection.getInterfaceType();
        this.fluentImplementType = collection.getImplementationType();

        String interfaceName = fluentType.getName();
        this.name = CodeNamer.toCamelCase(interfaceName);

        this.innerClientGetMethod = "get" + CodeNamer.toPascalCase(collection.getInnerGroupClient().getVariableName());
    }

    public String getName() {
        return name;
    }

    public ClassType getFluentType() {
        return fluentType;
    }

    public ClassType getFluentImplementType() {
        return fluentImplementType;
    }

    public String getMethodName() {
        return CodeNamer.getModelNamer().modelPropertyGetterName(name);
    }

    public String getInnerClientGetMethod() {
        return innerClientGetMethod;
    }

    public List<ClassType> getResourceModelTypes() {
        return this.resourceCollection.getResourceCreates().stream()
                .map(rc -> rc.getResourceModel().getInterfaceType())
                .collect(Collectors.toList());
    }
}
