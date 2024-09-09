// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel.examplemodel;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;

import java.util.ArrayList;
import java.util.List;

/**
 * Tree of example nodes.
 */
public abstract class ExampleNode {

    // the full Object at and below this node
    private final Object objectValue;

    private final IType clientType;

    private final List<ExampleNode> childNodes = new ArrayList<>();

    public ExampleNode(IType clientType, Object objectValue) {
        this.clientType = clientType;
        this.objectValue = objectValue;
    }

    public List<ExampleNode> getChildNodes() {
        return childNodes;
    }

    public Object getObjectValue() {
        return objectValue;
    }

    public IType getClientType() {
        return clientType;
    }

    public boolean isNull() {
        return objectValue == null;
    }
}
