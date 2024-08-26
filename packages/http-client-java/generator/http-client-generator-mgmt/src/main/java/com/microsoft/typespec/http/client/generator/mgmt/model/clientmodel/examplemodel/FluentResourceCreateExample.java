// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.examplemodel;

import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentManager;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceCollection;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.create.ResourceCreate;

/**
 * Model of example for ResourceCreate.
 */
public class FluentResourceCreateExample extends FluentBaseExample {

    private final ResourceCreate resourceCreate;

    public FluentResourceCreateExample(String name, String originalFileName,
                                       FluentManager manager, FluentResourceCollection collection,
                                       ResourceCreate resourceCreate) {
        super(name, originalFileName, manager, collection);
        this.resourceCreate = resourceCreate;
    }

    public ResourceCreate getResourceCreate() {
        return resourceCreate;
    }
}
