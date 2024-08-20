// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.method;

import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentCollectionMethod;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceCollection;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceModel;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.ResourceLocalVariables;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;

import java.util.List;

public class FluentApplyMethod extends FluentBaseMethod {

    public FluentApplyMethod(FluentResourceModel model, FluentMethodType type,
                             List<ClientMethodParameter> parameters, ResourceLocalVariables resourceLocalVariables,
                             FluentResourceCollection collection, FluentCollectionMethod collectionMethod,
                             ResourceLocalVariables resourceLocalVariablesDefinedInClass) {

        super(model, type, "apply", "Executes the update request.", "the updated resource.",
                parameters, resourceLocalVariables, collection, collectionMethod, resourceLocalVariablesDefinedInClass, false);
    }
}
