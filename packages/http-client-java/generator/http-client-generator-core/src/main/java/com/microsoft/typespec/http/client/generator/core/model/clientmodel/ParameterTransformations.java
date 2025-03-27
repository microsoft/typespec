// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.examplemodel.MethodParameter;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * A type representing transformations applied for all parameters of a method.
 */
public final class ParameterTransformations {
    private final List<ParameterTransformation> transformations;

    ParameterTransformations(List<ParameterTransformation> parameterTransformations) {
        this.transformations = parameterTransformations;
    }

    /**
     * Gets a stream of all parameter transformations.
     *
     * @return the stream of parameter transformations.
     */
    public Stream<ParameterTransformation> stream() {
        return transformations.stream();
    }

    /**
     * Checks if there is a transformation defined for a parameter with the given name.
     *
     * @param name the name of the parameter.
     * @return true if there is a transformation for the parameter, false otherwise.
     */
    public boolean hasOutParameter(String name) {
        return stream().anyMatch(d -> d.getOutParameter().getName().equals(name));
    }

    /**
     * Gets name of all parameters for which transformations defined.
     *
     * @return the set of parameter names.
     */
    public Set<String> getOutParameterNames() {
        return transformations.stream().map(d -> d.getOutParameter().getName()).collect(Collectors.toSet());
    }

    public boolean isFlattenParameter(MethodParameter methodParameter) {
        if (transformations.size() != 1) {
            return false;
        }
        return transformations.stream()
            .anyMatch(t -> t.hasMappings()
                && t.getOutParameter() != null
                && t.getMappings()
                    .stream()
                    .allMatch(mapping -> mapping.getOutParameterPropertyName() != null
                        && mapping.getInParameterProperty() == null)
                && t.getMappings()
                    .stream()
                    .anyMatch(mapping -> Objects.equals(methodParameter.getClientMethodParameter().getName(),
                        mapping.getInParameter().getName())));
    }

    public ClientMethodParameter getOutParameterIfInParameterFlattened(MethodParameter inParameter) {
        if (isFlattenParameter(inParameter)) {
            return transformations.get(0).getOutParameter();
        } else {
            return null;
        }
    }
}
