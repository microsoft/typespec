// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import java.util.List;
import java.util.stream.Stream;

/**
 * A class that holds the transformation details of a parameter.
 *
 * @see ParameterMapping
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
     * Gets the name of the "output parameter".
     *
     * @return the name of the out parameter.
     */
    public String getOutParameterName() {
        return outParameter.getName();
    }

    /**
     * Gets the model type of the "output parameter".
     *
     * @return the out parameter model type.
     */
    public IType getOutParameterClientType() {
        return outParameter.getClientType();
    }

    /**
     * Gets the location of the "output parameter" in the service call request.
     *
     * @return the out parameter location.
     */
    public RequestParameterLocation getOutParameterLocation() {
        return outParameter.getRequestParameterLocation();
    }

    /**
     * Checks if the out parameter is of type ClassType and is required.
     *
     * @return true if the out parameter is of type ClassType and is required, false otherwise.
     */
    public boolean isOutParameterClassTypeAndRequired() {
        return outParameter.isRequired() && outParameter.getClientType() instanceof ClassType;
    }

    /**
     * Gets the input parameter mappings where it represents an optional SDK method argument.
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
        return !parameterMappings.isEmpty()
            && parameterMappings.iterator().next().getOutParameterPropertyName() == null;
    }

    /**
     * Gets the description of an "input parameter" that SDK Method takes.
     *
     * @return the input parameter, or null if there are no mappings.
     */
    public ClientMethodParameter getInParameter() {
        if (parameterMappings.isEmpty()) {
            return null;
        }
        final ParameterMapping mapping = parameterMappings.iterator().next();
        return mapping.getInParameter();
    }
}
