// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.create;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ModelProperty;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.FluentInterfaceStage;

public class DefinitionStage extends FluentInterfaceStage {

    public DefinitionStage(String name) {
        super(name);
    }

    public DefinitionStage(String name, ModelProperty property) {
        super(name, property);
    }

    public String getDescription(String modelName) {
        return property == null
                ? String.format("The stage of the %1$s definition.", modelName)
                : String.format("The stage of the %1$s definition allowing to specify %2$s.", modelName, property.getName());
    }

    public ModelProperty getModelProperty() {
        return this.property;
    }
}
