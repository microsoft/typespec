// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Parameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ParameterTransformations;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

final class ClientMethodParametersDetails {
    final List<ParameterTuple> parameterTuples;
    final List<String> requiredParameterExpressions;
    final Map<String, String> validateParameterExpressions;
    final ParameterTransformations parameterTransformations;

    ClientMethodParametersDetails(List<ParameterTuple> parameterTuples, List<String> requiredParameterExpressions,
        Map<String, String> validateParameterExpressions, ParameterTransformations parameterTransformations) {
        this.parameterTuples = parameterTuples;
        this.requiredParameterExpressions = requiredParameterExpressions;
        this.validateParameterExpressions = validateParameterExpressions;
        this.parameterTransformations = parameterTransformations;
    }

    Stream<ParameterTuple> getParameterTuples() {
        return this.parameterTuples.stream();
    }

    boolean hasNonRequiredParameters() {
        return this.parameterTuples.stream().map(t -> t.parameter).anyMatch(p -> !p.isRequired() && !p.isConstant());
    }

    List<ClientMethodParameter> getClientMethodParameters() {
        return this.parameterTuples.stream().map(t -> t.parameter).collect(Collectors.toList());
    }

    ClientMethodParameter getClientMethodParameter(Parameter codeModelParameter) {
        return this.parameterTuples.stream()
            .filter(t -> t.codeModelParameter == codeModelParameter)
            .map(t -> t.parameter)
            .findFirst()
            .orElse(null);
    }

    static final class ParameterTuple {
        final Parameter codeModelParameter;
        final ClientMethodParameter parameter;

        ParameterTuple(Parameter codeModelParameter, ClientMethodParameter parameter) {
            this.codeModelParameter = codeModelParameter;
            this.parameter = parameter;
        }
    }
}
