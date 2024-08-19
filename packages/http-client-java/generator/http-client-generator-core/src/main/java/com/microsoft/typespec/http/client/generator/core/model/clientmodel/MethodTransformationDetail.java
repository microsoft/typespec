// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import java.util.List;

/**
 * A transformation class that contains mappings from input parameters to proxy method parameters.
 */
public class MethodTransformationDetail {
    private ClientMethodParameter outParameter;
    private List<ParameterMapping> parameterMappings;

    public MethodTransformationDetail(ClientMethodParameter outParameter, List<ParameterMapping> parameterMappings) {
        this.outParameter = outParameter;
        this.parameterMappings = parameterMappings;
    }

    public final ClientMethodParameter getOutParameter() {
        return outParameter;
    }

    public final List<ParameterMapping> getParameterMappings() {
        return parameterMappings;
    }
}
