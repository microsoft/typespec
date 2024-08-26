// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.examplemodel;

import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentManager;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceCollection;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.update.ResourceUpdate;

/**
 * Model of example for ResourceUpdate.
 */
public class FluentResourceUpdateExample extends FluentBaseExample {

    private final ResourceUpdate resourceUpdate;
    private final FluentCollectionMethodExample resourceGetExample;

    public FluentResourceUpdateExample(String name, String originalFileName,
                                       FluentManager manager, FluentResourceCollection collection,
                                       ResourceUpdate resourceUpdate,
                                       FluentCollectionMethodExample resourceGetExample) {
        super(name, originalFileName, manager, collection);
        this.resourceUpdate = resourceUpdate;
        this.resourceGetExample = resourceGetExample;
    }

    public ResourceUpdate getResourceUpdate() {
        return resourceUpdate;
    }

    public FluentCollectionMethodExample getResourceGetExample() {
        return resourceGetExample;
    }
}
