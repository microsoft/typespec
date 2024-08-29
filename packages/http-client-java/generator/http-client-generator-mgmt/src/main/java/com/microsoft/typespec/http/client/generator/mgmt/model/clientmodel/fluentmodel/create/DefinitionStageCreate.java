// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.create;

public class DefinitionStageCreate extends DefinitionStage {

    public DefinitionStageCreate() {
        super("WithCreate");
    }

    @Override
    public String getDescription(String modelName) {
        return String.format("The stage of the %1$s definition which contains all the minimum required properties for the resource to be created, but also allows for any other optional properties to be specified.", modelName);
    }
}
