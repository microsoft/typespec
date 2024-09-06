// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper.android;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import com.microsoft.typespec.http.client.generator.core.mapper.ProxyMethodMapper;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PrimitiveType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.android.AndroidProxyMethod;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class AndroidProxyMethodMapper extends ProxyMethodMapper {
    private static final ProxyMethodMapper INSTANCE = new AndroidProxyMethodMapper();

    protected AndroidProxyMethodMapper() {
    }

    public static ProxyMethodMapper getInstance() {
        return INSTANCE;
    }

    @Override
    protected ProxyMethod.Builder createProxyMethodBuilder() {
        return new AndroidProxyMethod.Builder();
    }

    @Override
    protected IType createBinaryContentAsyncReturnType() {
        return PrimitiveType.VOID;
    }

    @Override
    protected IType createStreamContentAsyncReturnType() {
        return PrimitiveType.VOID;
    }

    @Override
    protected IType createClientResponseAsyncReturnType(ClassType clientResponseClassType) {
        return PrimitiveType.VOID; // return GenericType.CompletableFuture(clientResponseClassType);
    }

    @Override
    protected IType createSingleValueAsyncReturnType(IType singleValueType) {
        return PrimitiveType.VOID; // return GenericType.CompletableFuture(singleValueType);
    }

    @Override
    protected ClassType getContextClass() {
        return ClassType.ANDROID_CONTEXT;
    }

    @Override
    protected Map<Integer, ClassType> getDefaultHttpStatusCodeToExceptionTypeMapping() {
        return new HashMap<>();
    }

    @Override
    protected ClassType getHttpResponseExceptionType() {
        return ClassType.ANDROID_HTTP_RESPONSE_EXCEPTION;
    }

    @Override
    protected void appendCallbackParameter(List<ProxyMethodParameter> parameters, IType responseBodyType) {
        ProxyMethodParameter callbackParameter = new ProxyMethodParameter.Builder()
                .description("The async callback associated with this operation.")
                .wireType(GenericType.AndroidCallback(GenericType.AndroidResponse(responseBodyType)))
                .clientType(GenericType.AndroidCallback(GenericType.AndroidResponse(responseBodyType)))
                .name("callback")
                .requestParameterLocation(RequestParameterLocation.NONE)
                .requestParameterName("callback")
                .alreadyEncoded(true)
                .constant(false)
                .required(false)
                .nullable(false)
                .fromClient(false)
                .parameterReference("callback")
                .build();
        parameters.add(callbackParameter);
    }
}
