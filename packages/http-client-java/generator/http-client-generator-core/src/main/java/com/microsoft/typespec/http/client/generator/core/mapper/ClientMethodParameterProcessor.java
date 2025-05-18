// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Parameter;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Request;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
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
import java.util.stream.Collectors;
import java.util.stream.Stream;

final class ClientMethodParameterProcessor {

    static ClientMethodParametersDetails process(Request request, boolean mapFluxByteBufferToBinaryData,
        boolean isProtocolMethod) {

        final List<Parameter> codeModelParameters = getCodeModelParameters(request, isProtocolMethod);
        final List<ParametersTuple> parametersTuples = new ArrayList<>();
        final List<String> requiredNullableParameterExpressions = new ArrayList<>();
        final Map<String, String> validateParameterExpressions = new HashMap<>();
        final boolean isJsonPatch = MethodUtil.isContentTypeInRequest(request, "application/json-patch+json");

        final ParametersTransformationProcessor transformationProcessor
            = new ParametersTransformationProcessor(isProtocolMethod);
        for (Parameter codeModelParameter : codeModelParameters) {
            final ClientMethodParameter clientMethodParameter = toClientMethodParameter(codeModelParameter, isJsonPatch,
                mapFluxByteBufferToBinaryData, isProtocolMethod);
            final ParametersTuple tuple = new ParametersTuple(codeModelParameter, clientMethodParameter);
            if (request.getSignatureParameters().contains(codeModelParameter)) {
                parametersTuples.add(tuple);
            }
            transformationProcessor.addParameter(tuple);

            if (!codeModelParameter.isConstant() && codeModelParameter.getGroupedBy() == null) {
                final MethodParameter methodParameter;
                final String expression;
                if (codeModelParameter.getImplementation() != Parameter.ImplementationLocation.CLIENT) {
                    methodParameter = clientMethodParameter;
                    expression = methodParameter.getName();
                } else {
                    ProxyMethodParameter proxyParameter = Mappers.getProxyParameterMapper().map(codeModelParameter);
                    methodParameter = proxyParameter;
                    expression = proxyParameter.getParameterReference();
                }

                if (methodParameter.isRequired() && methodParameter.isReferenceClientType()) {
                    requiredNullableParameterExpressions.add(expression);
                }
                final String validation = methodParameter.getClientType().validate(expression);
                if (validation != null) {
                    validateParameterExpressions.put(expression, validation);
                }
            }
        }
        final ParameterTransformations parameterTransformations = transformationProcessor.process(request);

        return new ClientMethodParametersDetails(parametersTuples, requiredNullableParameterExpressions,
            validateParameterExpressions, parameterTransformations);
    }

    private static List<Parameter> getCodeModelParameters(Request request, boolean isProtocolMethod) {
        final Stream<Parameter> codeModelParameters;
        if (isProtocolMethod) {
            // Required path, body, header and query parameters are allowed
            codeModelParameters = request.getParameters().stream().filter(p -> {
                RequestParameterLocation location = p.getProtocol().getHttp().getIn();
                return p.isRequired()
                    && (location == RequestParameterLocation.PATH
                        || location == RequestParameterLocation.BODY
                        || location == RequestParameterLocation.HEADER
                        || location == RequestParameterLocation.QUERY);
            });
        } else {
            codeModelParameters = request.getParameters().stream().filter(p -> !p.isFlattened());
        }
        return codeModelParameters.collect(Collectors.toList());
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
}
