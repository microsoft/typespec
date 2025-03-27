// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import java.util.List;
import java.util.stream.Stream;

/**
 * A class that holds the transformation details of a parameter.
 *
 * @see ParameterMapping
 * @see ParameterTransformations
 * @see com.microsoft.typespec.http.client.generator.core.mapper.ParametersTransformationProcessor
 */
public final class ParameterTransformation {
    private final ClientMethodParameter outParameter;
    private final List<ParameterMapping> parameterMappings;

    /**
     * Constructor for TransformationDetails describing the transformation mappings for
     * the given parameter.
     *
     * @param outParameter the outParameter to describe the mappings for.
     * @param parameterMappings the mappings.
     */
    public ParameterTransformation(ClientMethodParameter outParameter, List<ParameterMapping> parameterMappings) {
        this.outParameter = outParameter;
        this.parameterMappings = parameterMappings;
    }

    /**
     * Gets the description of the "output parameter" that is transmitted to the service,
     * and {@link #getMappings()} describes the transformation mappings for this parameter.
     *
     * @return the out parameter.
     */
    public ClientMethodParameter getOutParameter() {
        return outParameter;
    }

    /**
     * Gets an immutable list of parameter mappings for {@link #getOutParameter()}.
     *
     * @return the parameter mappings.
     */
    public List<ParameterMapping> getMappings() {
        return parameterMappings;
    }

    /**
     * Checks if there is any parameter mappings defined.
     *
     * @return true if there are mappings, false otherwise.
     */
    public boolean hasMappings() {
        return !parameterMappings.isEmpty();
    }

    /**
     * Gets the mappings where it represents an optional SDK method argument.
     *
     * @return a stream of optional input parameter mappings.
     */
    public Stream<ParameterMapping> getOptionalInMappings() {
        return parameterMappings.stream().filter(m -> !m.getInParameter().isRequired());
    }

    /**
     * Checks if the transformation represents a group-by transformation in the spec.
     *
     * @return true if the transformation is group-by, false otherwise.
     */
    public boolean isGroupBy() {
        return hasMappings() && parameterMappings.iterator().next().getOutParameterPropertyName() == null;
    }

    /**
     * Gets the description of the group-by "input parameter" that SDK Method takes.
     *
     * @return the input parameter.
     * @throws IllegalStateException if the transformation is not a group-by transformation.
     */
    public ClientMethodParameter getGroupByInParameter() {
        if (!isGroupBy()) {
            throw new IllegalStateException("Not a group-by transformation.");
        }
        final ParameterMapping mapping = parameterMappings.iterator().next();
        return mapping.getInParameter();
    }

    /**
     * Gets the property within the group-by "input parameter" model, that gets flattened
     * (read from the "input parameter") then send to the service.
     *
     * @return the property.
     * @throws IllegalStateException if the transformation is not a group-by transformation.
     */
    public ClientModelProperty getGroupByInParameterProperty() {
        if (!isGroupBy()) {
            throw new IllegalStateException("Not a group-by transformation.");
        }
        final ParameterMapping mapping = parameterMappings.iterator().next();
        return mapping.getInParameterProperty();
    }
}
