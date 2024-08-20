// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.examplemodel;

import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentCollectionMethod;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentManager;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceCollection;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;

/**
 * Model of example for FluentCollectionMethod.
 */
public class FluentCollectionMethodExample extends FluentBaseExample implements FluentMethodExample {

    private final FluentCollectionMethod collectionMethod;

    public FluentCollectionMethodExample(String name, String originalFileName,
                                         FluentManager manager, FluentResourceCollection collection,
                                         FluentCollectionMethod collectionMethod) {
        super(name, originalFileName, manager, collection);
        this.collectionMethod = collectionMethod;
    }

    public FluentCollectionMethod getCollectionMethod() {
        return collectionMethod;
    }

    @Override
    public String getMethodReference() {
        return CodeNamer.toCamelCase(this.getResourceCollection().getInterfaceType().getName()) + "()";
    }

    @Override
    public String getMethodName() {
        return collectionMethod.getMethodName();
    }
}
