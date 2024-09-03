// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel.examplemodel;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;

import java.util.ArrayList;
import java.util.List;

/**
 * Example node for a Map.
 */
public class MapNode extends ExampleNode {

    private final List<String> keys = new ArrayList<>();

    public MapNode(IType clientType, Object objectValue) {
        super(clientType, objectValue);
    }

    public List<String> getKeys() {
        return keys;
    }
}
