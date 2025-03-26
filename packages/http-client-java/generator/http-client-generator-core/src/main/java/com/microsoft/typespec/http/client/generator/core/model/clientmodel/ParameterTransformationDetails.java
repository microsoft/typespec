// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import com.microsoft.typespec.http.client.generator.core.mapper.CollectionUtil;
import java.util.List;

/**
 * A class that holds the transformation details of a parameter.
 */
public final class ParameterTransformationDetails {
    private final ClientMethodParameter outParameter;
    private final List<ParameterMapping> parameterMappings;

    /**
     * Constructor for TransformationDetails describing the transformation mapping for
     * the given parameter.
     *
     * @param outParameter the outParameter to describe the mapping for.
     * @param parameterMappings the mappings.
     */
    public ParameterTransformationDetails(ClientMethodParameter outParameter,
        List<ParameterMapping> parameterMappings) {
        this.outParameter = outParameter;
        this.parameterMappings = CollectionUtil.toImmutableList(parameterMappings);
    }

    public ClientMethodParameter getOutParameter() {
        return outParameter;
    }

    public List<ParameterMapping> getParameterMappings() {
        return parameterMappings;
    }
}
