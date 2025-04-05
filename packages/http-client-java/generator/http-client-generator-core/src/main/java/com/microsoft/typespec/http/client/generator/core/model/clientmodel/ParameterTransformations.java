// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import com.microsoft.typespec.http.client.generator.core.mapper.CollectionUtil;
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
        this.transformations = CollectionUtil.toImmutableList(parameterTransformations);
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
        return asStream().map(d -> d.getOutParameter().getName()).collect(Collectors.toSet());
    }

    /**
     * Checks if this transformation is a group-by transformation with the given parameter representing
     * the grouped parameter that SDK Method would take.
     *
     * @param methodParameter the method parameter to check.
     * @return true if the transformation is a group-by transformation, false otherwise.
     */
    public boolean isGroupingParameter(MethodParameter methodParameter) {
        if (transformations.isEmpty() || transformations.size() == 1) {
            return false;
        }
        return transformations.stream()
            .allMatch(t -> t.hasMappings()
                && t.getMappings().stream().allMatch(mapping -> matches(mapping.getInParameter(), methodParameter)));
    }

    /**
     * Checks if the transformation represents a spread transformation with the given parameter as one of the
     * spread-ed (flattened) parameter that SDK method takes.
     * <p>
     * An example an operation using spread operator (...) in the spec is -
     * op add(...User): void
     * where 'User' is a model with properties 'name' and 'age', The SDK Method with flattened parameter would look
     * like:
     * public void add(String name, int age) { ... }
     * </p>
     *
     * @return true if the transformation is spread with the given parameter flattened, false otherwise.
     */
    public boolean isFlattenParameter(MethodParameter methodParameter) {
        if (transformations.size() != 1) {
            return false;
        }
        final ParameterTransformation transformation = transformations.get(0);
        if (!transformation.hasMappings()) {
            return false;
        }

        final List<ParameterMapping> mappings = transformation.getMappings();
        final boolean b = mappings.stream()
            .allMatch(
                mapping -> mapping.getOutParameterPropertyName() != null && mapping.getInParameterProperty() == null);
        if (b) {
            return mappings.stream().anyMatch(mapping -> matches(mapping.getInParameter(), methodParameter));
        }
        return false;
    }

    /**
     * Gets the transformation mapping if the given parameter is an input parameter.
     *
     * @param methodParameter the method parameter to check.
     * @return the input parameter mapping if found, null otherwise.
     */
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

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || this.getClass() != o.getClass()) {
            return false;
        }

        final int s = this.transformations.size();
        final ParameterTransformations t = (ParameterTransformations) o;
        if (s != t.transformations.size()) {
            return false;
        }
        for (int i = 0; i < s; i++) {
            if (!this.transformations.get(i).equals(t.transformations.get(i))) {
                return false;
            }
        }
        return true;
    }

    @Override
    public int hashCode() {
        return transformations.stream()
            .filter(Objects::nonNull)
            .mapToInt(Objects::hashCode)
            .reduce(1, (a, b) -> a * 31 + b);
    }
}
