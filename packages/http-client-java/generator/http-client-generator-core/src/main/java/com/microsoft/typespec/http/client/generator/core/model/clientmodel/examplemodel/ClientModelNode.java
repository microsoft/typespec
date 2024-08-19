// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel.examplemodel;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ModelProperty;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;

import java.util.HashMap;
import java.util.Map;

/**
 * Example node for a client model (a generated Java class).
 */
public class ClientModelNode extends ExampleNode {

    private ClientModel model;

    // modelProperties can contain more properties than in the model, as it includes those properties from the superclass of the model
    private final Map<ExampleNode, ModelProperty> modelProperties = new HashMap<>();

    public ClientModelNode(IType clientType, Object objectValue) {
        super(clientType, objectValue);
    }

    public ClientModel getClientModel() {
        return model;
    }

    public ClientModelNode setClientModel(ClientModel model) {
        this.model = model;
        return this;
    }

    public Map<ExampleNode, ModelProperty> getClientModelProperties() {
        return modelProperties;
    }
}
