// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.azure.core.http.HttpMethod;
import com.azure.core.util.CoreUtils;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Parameter;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Request;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ParameterSynthesizedOrigin;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodParameter;
import com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil;
import com.microsoft.typespec.http.client.generator.core.util.MethodUtil;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

final class ProxyMethodParameterProcessor {
    private static final String APPLICATION_JSON_PATCH = "application/json-patch+json";
    private final Operation operation;
    private final boolean operationHasSingleContentType;
    private final JavaSettings settings;

    ProxyMethodParameterProcessor(Operation operation, JavaSettings settings) {
        this.operation = operation;
        this.operationHasSingleContentType = MethodUtil.getContentTypeCount(operation.getRequests()) == 1;
        this.settings = settings;
    }

    /**
     * Processes the {@code operation} and the given request to create and organize proxy method parameters.
     *
     * @param request the request to process.
     * @param contentType the content type of the request.
     * @return a {@link Result} object containing the proxy method parameters.
     */
    Result process(Request request, String contentType) {
        final List<ProxyMethodParameter> parameters = new ArrayList<>();
        final List<ProxyMethodParameter> allParameters = new ArrayList<>();
        final List<String> specialHeaderParameterNames;

        // Content-Type Parameter.
        //
        if (settings.isDataPlaneClient()) {
            if (operationHasSingleContentType && !hasContentTypeHeader(request) && !hasRequiredBody(request)) {
                final Parameter contentTypeParameter = MethodUtil.createContentTypeParameter(request, operation);
                allParameters.add(toProxyMethodParameter(contentTypeParameter, false));
            }
        }

        // Http Parameters.
        //
        final boolean isJsonPatch = contentType.startsWith(APPLICATION_JSON_PATCH);
        for (Parameter parameter : getHttpParameters(request)) {
            parameter.setOperation(operation);
            final ProxyMethodParameter proxyMethodParameter = toProxyMethodParameter(parameter, isJsonPatch);
            allParameters.add(proxyMethodParameter);
            if (settings.isDataPlaneClient()) {
                // The protocol APIs (by Data Plane Generator) will put required path, body, query, header parameters
                // to method signature.
                if (parameter.isRequired()
                    || proxyMethodParameter.isConstant()
                    || proxyMethodParameter.isFromClient()
                    || isApiVersionParameter(parameter)) {
                    parameters.add(proxyMethodParameter);
                }
            } else {
                parameters.add(proxyMethodParameter);
            }
        }

        // Special Header Parameters.
        //
        final List<ProxyMethodParameter> specialHeaderParameters = getSpecialHeaderParameters(operation);
        if (!specialHeaderParameters.isEmpty()) {
            specialHeaderParameterNames = specialHeaderParameters.stream()
                .map(ProxyMethodParameter::getRequestParameterName)
                .collect(Collectors.toList());
        } else {
            specialHeaderParameterNames = null;
        }
        if (!settings.isDataPlaneClient()) {
            parameters.addAll(specialHeaderParameters);
        }
        allParameters.addAll(specialHeaderParameters);

        // RequestOptions Parameter.
        //
        if (settings.isDataPlaneClient()) {
            final ProxyMethodParameter requestOptionsParameter = ProxyMethodParameter.REQUEST_OPTIONS_PARAMETER;
            allParameters.add(requestOptionsParameter);
            parameters.add(requestOptionsParameter);
        }

        // Context Parameter.
        //
        if (settings.isBranded()) {
            final ProxyMethodParameter contextParameter = ProxyMethodParameter.CONTEXT_PARAMETER;
            allParameters.add(contextParameter);
            parameters.add(contextParameter);
        }

        return new Result(parameters, allParameters, specialHeaderParameterNames);
    }

    /**
     * Checks if the request has content-type header defined.
     *
     * @param request the request.
     * @return true if the request has content-type header, false otherwise.
     */
    private static boolean hasContentTypeHeader(Request request) {
        return request.getParameters()
            .stream()
            .anyMatch(p -> p.getProtocol() != null
                && p.getProtocol().getHttp() != null
                && p.getProtocol().getHttp().getIn() == RequestParameterLocation.HEADER
                && "content-type".equalsIgnoreCase(p.getLanguage().getDefault().getSerializedName()));
    }

    /**
     * Checks if the request has required body defined.
     *
     * @param request the request.
     * @return true if the request body is required, false if there is no body defined or is optional.
     */
    private static boolean hasRequiredBody(Request request) {
        return request.getParameters()
            .stream()
            .filter(p -> p.getProtocol() != null
                && p.getProtocol().getHttp() != null
                && p.getProtocol().getHttp().getIn() == RequestParameterLocation.BODY)
            .map(Parameter::isRequired)
            .findFirst()
            .orElse(false);
    }

    /**
     * Get the http parameters defined for the request.
     *
     * @param request the request.
     * @return the list of http parameters.
     */
    private static List<Parameter> getHttpParameters(Request request) {
        return request.getParameters()
            .stream()
            .filter(p -> p.getProtocol() != null && p.getProtocol().getHttp() != null)
            .collect(Collectors.toList());
    }

    /**
     * Obtain the client model parameter for the code model parameter.
     *
     * @param parameter the code model parameter.
     * @param isJsonPatch true if the request to which the parameter belongs is a json patch request.
     *
     * @return the client model parameter.
     */
    private static ProxyMethodParameter toProxyMethodParameter(Parameter parameter, boolean isJsonPatch) {
        if (isJsonPatch) {
            return CustomProxyParameterMapper.getInstance().map(parameter);
        } else {
            return Mappers.getProxyParameterMapper().map(parameter);
        }
    }

    /**
     * Check if the parameter is an API version parameter.
     *
     * @param parameter the parameter to check.
     * @return true if the parameter is an API version parameter, false otherwise.
     */
    private static boolean isApiVersionParameter(Parameter parameter) {
        if (ClientModelUtil.getClientDefaultValueOrConstantValue(parameter) == null) {
            return false;
        }
        return ParameterSynthesizedOrigin.fromValue(parameter.getOrigin()) == ParameterSynthesizedOrigin.API_VERSION;
    }

    /**
     * Gets the special parameters.
     *
     * @param operation the operation
     * @return the special parameters.
     */
    private static List<ProxyMethodParameter> getSpecialHeaderParameters(Operation operation) {
        if (!supportsRepeatabilityRequest(operation)) {
            return Collections.emptyList();
        }
        final List<ProxyMethodParameter> parameters = new ArrayList<>();
        parameters.add(ProxyMethodParameter.REPEATABILITY_REQUEST_ID_PARAMETER);
        parameters.add(ProxyMethodParameter.REPEATABILITY_FIRST_SENT_PARAMETER);
        return parameters;
    }

    /**
     * Check if the operation supports repeatability request.
     *
     * @param operation the operation.
     * @return true if the operation supports repeatability request, false otherwise.
     */
    private static boolean supportsRepeatabilityRequest(Operation operation) {
        if (CoreUtils.isNullOrEmpty(operation.getSpecialHeaders())) {
            return false;
        }
        if (CoreUtils.isNullOrEmpty(operation.getRequests())) {
            return false;
        }
        final HttpMethod httpMethod = MethodUtil.getHttpMethod(operation);
        if (!MethodUtil.isHttpMethodSupportRepeatableRequestHeaders(httpMethod)) {
            return false;
        }
        return operation.getSpecialHeaders()
            .stream()
            .map(s -> s.toLowerCase(Locale.ROOT))
            .anyMatch(MethodUtil.REPEATABILITY_REQUEST_ID_HEADER::equals);
    }

    /**
     * Result of the processing by {@link ProxyMethodParameterProcessor#process(Request, String)}.
     */
    static final class Result {
        final List<ProxyMethodParameter> parameters;
        final List<ProxyMethodParameter> allParameters;
        final List<String> specialHeaderParameterNames;

        private Result(List<ProxyMethodParameter> parameters, List<ProxyMethodParameter> allParameters,
            List<String> specialHeaderParameterNames) {
            this.parameters = CollectionUtil.toImmutableList(parameters);
            this.allParameters = CollectionUtil.toImmutableList(allParameters);
            this.specialHeaderParameterNames = CollectionUtil.toImmutableList(specialHeaderParameterNames);
        }
    }
}
