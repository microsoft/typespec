// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.update;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;

public class UpdateStageMisc extends UpdateStage {

    public UpdateStageMisc(String name, ClientMethodParameter parameter) {
        super(name);
        this.parameter = parameter;
    }

    public String getDescription(String modelName) {
        return String.format("The stage of the %1$s update allowing to specify %2$s.", modelName, parameter.getName());
    }

    public ClientMethodParameter getMethodParameter() {
        return parameter;
    }
}
