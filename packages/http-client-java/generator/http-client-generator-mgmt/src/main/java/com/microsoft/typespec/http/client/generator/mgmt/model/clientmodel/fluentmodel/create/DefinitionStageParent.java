// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.create;

import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.method.FluentMethod;

import java.util.Arrays;
import java.util.List;

public class DefinitionStageParent extends DefinitionStage {

    private FluentMethod existingParentMethod;

    public DefinitionStageParent(String name) {
        super(name);
    }

    @Override
    public String getDescription(String modelName) {
        return String.format("The stage of the %1$s definition allowing to specify parent resource.", modelName);
    }

    @Override
    public List<FluentMethod> getMethods() {
        return Arrays.asList(existingParentMethod);
    }

    public void setExistingParentMethod(FluentMethod existingParentMethod) {
        this.existingParentMethod = existingParentMethod;
    }
}
