// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Parameter;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Request;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodPageDetails;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ParameterTransformations;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Holds the details of the parameters for a {@link ClientMethod}, produced by
 * {@link ClientMethodParameterProcessor#process(Request, boolean, boolean)}.
 */
final class ClientMethodParametersDetails {
    /**
     * The list of parameter tuples, where each tuple contains a code model {@link Parameter}
     * and its corresponding {@link ClientMethodParameter}.
     */
    final List<ParametersTuple> parametersTuples;
    /**
     * The list of parameter access expressions for parameters that are required but nullable.
     * These expressions are used to generate checks for null values.
     */
    final List<String> requiredNullableParameterExpressions;
    /**
     * A map associating parameter access expressions with their corresponding validation expressions.
     * Each entry specifies how to generate validation checks for parameter.
     */
    final Map<String, String> validateParameterExpressions;
    /**
     * The set of parameter transformations that describe how input parameters are mapped or transformed
     * before being sent to the service.
     */
    final ParameterTransformations parameterTransformations;

    ClientMethodParametersDetails(List<ParametersTuple> parametersTuples,
        List<String> requiredNullableParameterExpressions, Map<String, String> validateParameterExpressions,
        ParameterTransformations parameterTransformations) {
        this.parametersTuples = parametersTuples;
        this.requiredNullableParameterExpressions = requiredNullableParameterExpressions;
        this.validateParameterExpressions = validateParameterExpressions;
        this.parameterTransformations = parameterTransformations;
    }

    /**
     * Gets a stream of all parameter tuples, each containing a code model {@link Parameter}
     * and its corresponding {@link ClientMethodParameter}.
     *
     * @return a stream of {@link ParametersTuple}.
     */
    Stream<ParametersTuple> getParameterTuples() {
        return this.parametersTuples.stream();
    }

    /**
     * Gets a list of all {@link ClientMethodParameter} instances.
     *
     * @return a list of {@link ClientMethodParameter} instances.
     */
    List<ClientMethodParameter> getClientMethodParameters() {
        return this.parametersTuples.stream().map(t -> t.clientMethodParameter).collect(Collectors.toList());
    }

    /**
     * Retrieves the {@link ClientMethodParameter} corresponding to the given code model {@link Parameter}.
     *
     * @param codeModelParameter the code model parameter to look up.
     * @return the matching {@link ClientMethodParameter}, or {@code null} if not found.
     */
    ClientMethodParameter getClientMethodParameter(Parameter codeModelParameter) {
        return this.parametersTuples.stream()
            .filter(t -> t.codeModelParameter == codeModelParameter)
            .map(t -> t.clientMethodParameter)
            .findFirst()
            .orElse(null);
    }

    /**
     * Determines if there are any parameters that are optional (neither required nor constant).
     *
     * @return {@code true} if at least one non-required, non-constant parameter exists; otherwise, {@code false}.
     */
    boolean hasNonRequiredParameters() {
        return this.parametersTuples.stream()
            .map(t -> t.clientMethodParameter)
            .anyMatch(p -> !p.isRequired() && !p.isConstant());
    }

    /**
     * Determines if there are any parameters that are optional (neither required nor constant),
     * excluding those that should be hidden according to the provided {@link MethodPageDetails}.
     *
     * @param pageDetails the page details used to determine which parameters to exclude.
     * @return {@code true} if at least one non-required, non-constant, non-hidden parameter exists; otherwise,
     * {@code false}.
     */
    boolean hasNonRequiredParameters(MethodPageDetails pageDetails) {
        return this.parametersTuples.stream()
            .map(t -> t.clientMethodParameter)
            .filter(p -> !pageDetails.shouldHideParameter(p))
            .anyMatch(p -> !p.isRequired() && !p.isConstant());
    }
}
