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
import com.microsoft.typespec.http.client.generator.core.util.SchemaUtil;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

final class ClientMethodParameterProcessor {

    static ClientMethodParametersDetails process(Request request, Request convenienceRequest,
        boolean mapFluxByteBufferToBinaryData, boolean isProtocolMethod) {

        final List<Parameter> protocolParameterGroups
            = getProtocolParameterGroups(request, convenienceRequest, isProtocolMethod);
        final List<Parameter> codeModelParameters
            = getCodeModelParameters(request, protocolParameterGroups, isProtocolMethod);
        final Set<Parameter> signatureParameters
            = getSignatureParameters(request, protocolParameterGroups, isProtocolMethod);
        final List<ParametersTuple> parametersTuples = new ArrayList<>();
        final List<String> requiredNullableParameterExpressions = new ArrayList<>();
        final Map<String, String> validateParameterExpressions = new LinkedHashMap<>();
        final boolean isJsonPatch = MethodUtil.isContentTypeInRequest(request, "application/json-patch+json");

        final ParametersTransformationProcessor transformationProcessor
            = new ParametersTransformationProcessor(isProtocolMethod);
        for (Parameter codeModelParameter : codeModelParameters) {
            final ClientMethodParameter clientMethodParameter = toClientMethodParameter(codeModelParameter, isJsonPatch,
                mapFluxByteBufferToBinaryData, isProtocolMethod);
            final ParametersTuple tuple = new ParametersTuple(codeModelParameter, clientMethodParameter);
            if (signatureParameters.contains(codeModelParameter)) {
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

    private static List<Parameter> getCodeModelParameters(Request request, List<Parameter> protocolParameterGroups,
        boolean isProtocolMethod) {
        final Stream<Parameter> codeModelParameters;
        if (isProtocolMethod) {
            // Required path, body, header and query parameters are allowed. Query and header parameters grouped by an
            // override are also needed to transform the group back into the HTTP request.
            codeModelParameters = request.getParameters().stream().filter(p -> {
                RequestParameterLocation location = getRequestParameterLocation(p);
                return isProtocolParameterLocation(location)
                    && (p.isRequired() || findProtocolParameterGroup(p, protocolParameterGroups) != null);
            });
        } else {
            codeModelParameters = request.getParameters().stream().filter(p -> !p.isFlattened());
        }
        List<Parameter> parameters = codeModelParameters.collect(Collectors.toList());
        parameters.addAll(protocolParameterGroups);
        return parameters;
    }

    private static Set<Parameter> getSignatureParameters(Request request, List<Parameter> protocolParameterGroups,
        boolean isProtocolMethod) {
        if (!isProtocolMethod) {
            return new LinkedHashSet<>(request.getSignatureParameters());
        }

        Set<Parameter> signatureParameters = new LinkedHashSet<>();
        for (Parameter parameter : request.getParameters()) {
            Parameter groupParameter = findProtocolParameterGroup(parameter, protocolParameterGroups);
            if (groupParameter != null) {
                signatureParameters.add(groupParameter);
            } else if (parameter.isRequired()
                && !parameter.isConstant()
                && parameter.getImplementation() != Parameter.ImplementationLocation.CLIENT
                && isProtocolParameterLocation(getRequestParameterLocation(parameter))) {
                signatureParameters.add(parameter);
            }
        }
        return signatureParameters;
    }

    private static List<Parameter> getProtocolParameterGroups(Request request, Request convenienceRequest,
        boolean isProtocolMethod) {
        if (!isProtocolMethod || convenienceRequest == null || convenienceRequest.getSignatureParameters() == null) {
            return List.of();
        }

        return convenienceRequest.getSignatureParameters().stream().filter(groupParameter -> {
            List<Parameter> groupedParameters = request.getParameters()
                .stream()
                .filter(parameter -> isSameParameterGroup(parameter.getGroupedBy(), groupParameter))
                .collect(Collectors.toList());
            return !groupedParameters.isEmpty()
                && groupedParameters.stream().allMatch(ClientMethodParameterProcessor::isQueryOrHeaderParameter);
        }).collect(Collectors.toList());
    }

    private static Parameter findProtocolParameterGroup(Parameter parameter, List<Parameter> protocolParameterGroups) {
        return protocolParameterGroups.stream()
            .filter(groupParameter -> isSameParameterGroup(parameter.getGroupedBy(), groupParameter))
            .findFirst()
            .orElse(null);
    }

    private static boolean isSameParameterGroup(Parameter left, Parameter right) {
        if (left == null || right == null || left.getSchema() == null || right.getSchema() == null) {
            return false;
        }

        String leftSchemaName = SchemaUtil.getJavaName(left.getSchema());
        String rightSchemaName = SchemaUtil.getJavaName(right.getSchema());
        String leftParameterName = SchemaUtil.getJavaName(left);
        String rightParameterName = SchemaUtil.getJavaName(right);
        return leftSchemaName != null
            && rightSchemaName != null
            && leftParameterName != null
            && rightParameterName != null
            && Objects.equals(leftSchemaName, rightSchemaName)
            && Objects.equals(left.getSchema().getLanguage().getJava().getNamespace(),
                right.getSchema().getLanguage().getJava().getNamespace())
            && Objects.equals(leftParameterName, rightParameterName);
    }

    private static boolean isQueryOrHeaderParameter(Parameter parameter) {
        RequestParameterLocation location = getRequestParameterLocation(parameter);
        return location == RequestParameterLocation.QUERY || location == RequestParameterLocation.HEADER;
    }

    private static boolean isProtocolParameterLocation(RequestParameterLocation location) {
        return location == RequestParameterLocation.PATH
            || location == RequestParameterLocation.BODY
            || location == RequestParameterLocation.HEADER
            || location == RequestParameterLocation.QUERY;
    }

    private static RequestParameterLocation getRequestParameterLocation(Parameter parameter) {
        return parameter.getProtocol() == null || parameter.getProtocol().getHttp() == null
            ? null
            : parameter.getProtocol().getHttp().getIn();
    }

    private static ClientMethodParameter toClientMethodParameter(Parameter parameter, boolean isJsonPatch,
        boolean mapFluxByteBufferToBinaryData, boolean isProtocolMethod) {
        final ClientMethodParameter clientMethodParameter;
        boolean mapAsProtocolParameter
            = isProtocolMethod && parameter.getGroupedBy() == null && getRequestParameterLocation(parameter) != null;
        if (isJsonPatch) {
            clientMethodParameter = CustomClientParameterMapper.getInstance().map(parameter, mapAsProtocolParameter);
        } else {
            clientMethodParameter = Mappers.getClientParameterMapper().map(parameter, mapAsProtocolParameter);
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
