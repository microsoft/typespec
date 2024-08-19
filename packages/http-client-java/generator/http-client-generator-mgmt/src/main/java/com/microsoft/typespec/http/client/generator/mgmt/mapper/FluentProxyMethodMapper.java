// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.mgmt.model.FluentType;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentStatic;
import com.microsoft.typespec.http.client.generator.mgmt.util.Utils;
import com.microsoft.typespec.http.client.generator.core.mapper.ProxyMethodMapper;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.azure.core.util.CoreUtils;

import java.util.List;
import java.util.Objects;

public class FluentProxyMethodMapper extends ProxyMethodMapper {

    private static final FluentProxyMethodMapper INSTANCE = new FluentProxyMethodMapper();

    public static FluentProxyMethodMapper getInstance() {
        return INSTANCE;
    }

    @Override
    protected void buildUnexpectedResponseExceptionTypes(ProxyMethod.Builder builder,
                                                         Operation operation, List<Integer> expectedStatusCodes,
                                                         JavaSettings settings) {
        if (CoreUtils.isNullOrEmpty(operation.getExceptions())) {
            // use ManagementException
            builder.unexpectedResponseExceptionType(FluentType.MANAGEMENT_EXCEPTION);
        } else {
            super.buildUnexpectedResponseExceptionTypes(builder, operation, expectedStatusCodes, settings);
        }

        /*
        final HttpMethod httpMethod = HttpMethod.valueOf(operation.getRequests().get(0).getProtocol().getHttp().getMethod().toUpperCase());
        final boolean isResourceModify = httpMethod == HttpMethod.PUT || httpMethod == HttpMethod.POST || httpMethod == HttpMethod.PATCH || httpMethod == HttpMethod.DELETE;
        final boolean hasETagHeader = operation.getRequests().stream().flatMap(r -> r.getParameters().stream())
                .filter(p -> p.getImplementation() == Parameter.ImplementationLocation.METHOD)
                .filter(p -> p.getProtocol() != null && p.getProtocol().getHttp() != null && p.getProtocol().getHttp().getIn() == RequestParameterLocation.Header)
                .map(p -> p.getLanguage().getDefault().getSerializedName())
                .filter(Objects::nonNull)
                .anyMatch(sn -> sn.equalsIgnoreCase("If-Match") || sn.equalsIgnoreCase("If-None-Match"));

        builder.unexpectedResponseExceptionType(ClassType.HttpResponseException);
        Map<ClassType, List<HttpResponseStatus>> unexpectedResponseExceptionTypes = new HashMap<>();
        if (!expectedStatusCodes.contains(HttpResponseStatus.UNAUTHORIZED)) {
            unexpectedResponseExceptionTypes.put(ClassType.ClientAuthenticationException, Collections.singletonList(HttpResponseStatus.UNAUTHORIZED));
        }
        if (!expectedStatusCodes.contains(HttpResponseStatus.NOT_FOUND)) {
            unexpectedResponseExceptionTypes.put(ClassType.ResourceNotFoundException, Collections.singletonList(HttpResponseStatus.NOT_FOUND));
        }
        if (isResourceModify && !expectedStatusCodes.contains(HttpResponseStatus.CONFLICT)) {
            unexpectedResponseExceptionTypes.put(ClassType.ResourceModifiedException, Collections.singletonList(HttpResponseStatus.CONFLICT));
        }
        if (!expectedStatusCodes.contains(HttpResponseStatus.TOO_MANY_REQUESTS)) {
            unexpectedResponseExceptionTypes.put(ClassType.TooManyRedirectsException, Collections.singletonList(HttpResponseStatus.TOO_MANY_REQUESTS));
        }
        if (hasETagHeader && !expectedStatusCodes.contains(HttpResponseStatus.PRECONDITION_FAILED)) {
            unexpectedResponseExceptionTypes.put(ClassType.ResourceExistsException, Collections.singletonList(HttpResponseStatus.PRECONDITION_FAILED));
        }
        builder.unexpectedResponseExceptionTypes(unexpectedResponseExceptionTypes);
        */
    }

    @Override
    protected ClassType processExceptionClassType(ClassType errorType, JavaSettings settings) {
        if (!FluentType.nonManagementError(errorType)) {
            return FluentType.MANAGEMENT_EXCEPTION;
        } else {
            return super.processExceptionClassType(errorType, settings);
        }
    }

    @Override
    protected ClassType getHttpResponseExceptionType() {
        return FluentType.MANAGEMENT_EXCEPTION;
    }

    @Override
    protected boolean operationGroupNotNull(Operation operation, JavaSettings settings) {
        return super.operationGroupNotNull(operation, settings)
            // hack for Fluent, as Lite use "ResourceProvider" if operation group is unnamed
            && !(
                settings.isFluent()
                    && Objects.equals(Utils.getNameForUngroupedOperations(operation.getOperationGroup().getCodeModel(), FluentStatic.getFluentJavaSettings()), operation.getOperationGroup().getLanguage().getDefault().getName())
            );
    }
}
