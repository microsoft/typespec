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

    public ParameterTransformations(List<ParameterTransformation> parameterTransformations) {
        this.transformations = parameterTransformations;
    }

    /**
     * Gets all parameter transformations as a stream.
     *
     * @return the stream of parameter transformations.
     */
    public Stream<ParameterTransformation> asStream() {
        return transformations.stream();
    }

    /**
     * Gets all parameter transformations as an immutable list.
     *
     * @return the list of parameter transformations.
     */
    public List<ParameterTransformation> asList() {
        return transformations;
    }

    /**
     * Checks if there are no transformations defined.
     *
     * @return true if there are no transformations, false otherwise.ß
     */
    public boolean isEmpty() {
        return transformations.isEmpty();
    }

    /**
     * Checks if there is a transformation defined for a parameter with the given name.
     *
     * @param name the name of the parameter.
     * @return true if there is a transformation for the parameter, false otherwise.
     */
    public boolean hasOutParameter(String name) {
        return asStream().anyMatch(d -> d.getOutParameter().getName().equals(name));
    }

    /**
     * Gets name of all parameters for which transformations defined.
     *
     * @return the set of parameter names.
     */
    public Set<String> getOutParameterNames() {
        return transformations.stream().map(d -> d.getOutParameter().getName()).collect(Collectors.toSet());
    }

    public ParameterMapping getInMapping(MethodParameter methodParameter) {
        if (transformations.isEmpty()) {
            return null;
        }
        return transformations.iterator()
            .next()
            .getMappings()
            .stream()
            .filter(mapping -> matches(mapping.getInParameter(), methodParameter))
            .findFirst()
            .orElse(null);
    }

    public boolean isGroupingParameter(MethodParameter methodParameter) {
        if (transformations.isEmpty() || transformations.size() == 1) {
            return false;
        }
        // TODO: anu : simplify this check
        return transformations.stream().allMatch(t -> !t.getMappings().isEmpty() && t.getOutParameter() != null &&
        // same name
            t.getMappings().stream().allMatch(mapping -> matches(mapping.getInParameter(), methodParameter)));
    }

    public boolean isFlattenParameter(MethodParameter methodParameter) {
        if (transformations.size() != 1) {
            return false;
        }
        // TODO: anu : simplify this check
        return transformations.stream()
            .anyMatch(t -> t.hasMappings()
                && t.getOutParameter() != null
                && t.getMappings()
                    .stream()
                    .allMatch(mapping -> mapping.getOutParameterPropertyName() != null
                        && mapping.getInParameterProperty() == null)
                && t.getMappings().stream().anyMatch(mapping -> matches(mapping.getInParameter(), methodParameter)));
    }

    public ClientMethodParameter getOutParameterIfInParameterFlattened(MethodParameter inParameter) {
        if (isFlattenParameter(inParameter)) {
            return transformations.get(0).getOutParameter();
        } else {
            return null;
        }
    }

    private static boolean matches(ClientMethodParameter param0, MethodParameter param1) {
        return Objects.equals(param0.getName(), param1.getClientMethodParameter().getName());
    }
}
