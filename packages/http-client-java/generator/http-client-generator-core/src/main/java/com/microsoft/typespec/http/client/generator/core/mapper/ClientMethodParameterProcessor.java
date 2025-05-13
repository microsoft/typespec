// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Parameter;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Request;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ParameterTransformations;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodParameter;
import com.microsoft.typespec.http.client.generator.core.util.MethodUtil;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

final class ClientMethodParameterProcessor {

    static ClientMethodParameterProcessor.Result process(Request request, List<Parameter> codeModelParameters,
        boolean mapFluxByteBufferToBinaryData, boolean isProtocolMethod) {

        final List<ClientMethodParameter> parameters = new ArrayList<>();
        final List<String> requiredParameterExpressions = new ArrayList<>();
        final Map<String, String> validateParameterExpressions = new HashMap<>();
        final boolean isJsonPatch = MethodUtil.isContentTypeInRequest(request, "application/json-patch+json");

        final ParametersTransformationProcessor transformationProcessor
            = new ParametersTransformationProcessor(isProtocolMethod);
        for (Parameter parameter : codeModelParameters) {
            final ClientMethodParameter clientMethodParameter
                = toClientMethodParameter(parameter, isJsonPatch, mapFluxByteBufferToBinaryData, isProtocolMethod);
            if (request.getSignatureParameters().contains(parameter)) {
                parameters.add(clientMethodParameter);
            }
            transformationProcessor.addParameter(clientMethodParameter, parameter);

            if (!parameter.isConstant() && parameter.getGroupedBy() == null) {
                final MethodParameter methodParameter;
                final String expression;
                if (parameter.getImplementation() != Parameter.ImplementationLocation.CLIENT) {
                    methodParameter = clientMethodParameter;
                    expression = methodParameter.getName();
                } else {
                    ProxyMethodParameter proxyParameter = Mappers.getProxyParameterMapper().map(parameter);
                    methodParameter = proxyParameter;
                    expression = proxyParameter.getParameterReference();
                }

                if (methodParameter.isRequired() && methodParameter.isReferenceClientType()) {
                    requiredParameterExpressions.add(expression);
                }
                final String validation = methodParameter.getClientType().validate(expression);
                if (validation != null) {
                    validateParameterExpressions.put(expression, validation);
                }
            }
        }
        final ParameterTransformations parameterTransformations = transformationProcessor.process(request);

        return new ClientMethodParameterProcessor.Result(parameters, requiredParameterExpressions,
            validateParameterExpressions, parameterTransformations, hasNonRequiredParameters(parameters));
    }

    private static ClientMethodParameter toClientMethodParameter(Parameter parameter, boolean isJsonPatch,
        boolean mapFluxByteBufferToBinaryData, boolean isProtocolMethod) {
        final ClientMethodParameter clientMethodParameter;
        if (isJsonPatch) {
            clientMethodParameter = CustomClientParameterMapper.getInstance().map(parameter, isProtocolMethod);
        } else {
            clientMethodParameter = Mappers.getClientParameterMapper().map(parameter, isProtocolMethod);
        }

        if (mapFluxByteBufferToBinaryData && clientMethodParameter.getClientType() == GenericType.FLUX_BYTE_BUFFER) {
            return clientMethodParameter.newBuilder()
                .rawType(ClassType.BINARY_DATA)
                .wireType(ClassType.BINARY_DATA)
                .build();
        } else {
            return clientMethodParameter;
        }
    }

    private static boolean hasNonRequiredParameters(List<ClientMethodParameter> parameters) {
        return parameters.stream().anyMatch(p -> !p.isRequired() && !p.isConstant());
    }

    static final class Result {
        final List<ClientMethodParameter> parameters;
        final List<String> requiredParameterExpressions;
        final Map<String, String> validateParameterExpressions;
        final ParameterTransformations parameterTransformations;
        final boolean hasNonRequiredParameters;

        private Result(List<ClientMethodParameter> parameters, List<String> requiredParameterExpressions,
            Map<String, String> validateParameterExpressions, ParameterTransformations parameterTransformations,
            boolean hasNonRequiredParameters) {
            this.parameters = parameters;
            this.requiredParameterExpressions = requiredParameterExpressions;
            this.validateParameterExpressions = validateParameterExpressions;
            this.parameterTransformations = parameterTransformations;
            this.hasNonRequiredParameters = hasNonRequiredParameters;
        }
    }
}
