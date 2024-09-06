// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper.android;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.mapper.ClientMethodMapper;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ReturnValue;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.android.AndroidClientMethod;

public class AndroidClientMethodMapper extends ClientMethodMapper {
    private static final ClientMethodMapper INSTANCE = new AndroidClientMethodMapper();

    private static final ClientMethodParameter ANDROID_CONTEXT_PARAM = new ClientMethodParameter.Builder()
            .description("The context to associate with this operation.")
            .wireType(ClassType.ANDROID_CONTEXT)
            .name("context")
            .annotations(new java.util.ArrayList<>())
            .constant(false)
            .defaultValue(null)
            .fromClient(false)
            .finalParameter(false)
            .required(false)
            .build();

    protected AndroidClientMethodMapper() {
    }

    public static ClientMethodMapper getInstance() {
        return INSTANCE;
    }

    @Override
    protected ClientMethod.Builder getClientMethodBuilder() {
        return new AndroidClientMethod.Builder();
    }

    @Override
    protected ClientMethodParameter getContextParameter(boolean isProtocolMethod) {
        return ANDROID_CONTEXT_PARAM;
    }

    @Override
    protected IType getContextType() {
        return ClassType.ANDROID_CONTEXT;
    }

    @Override
    protected IType createPagedRestResponseReturnType(IType elementType) {
        return GenericType.AndroidCompletableFuture(GenericType.AndroidPagedResponse(elementType));
    }

    @Override
    protected IType createPagedAsyncReturnType(IType elementType) {
        return GenericType.AndroidPagedResponse(elementType);
    }

    @Override
    protected IType createPagedSyncReturnType(IType elementType) {
        return GenericType.AndroidPagedResponse(elementType);
    }

    @Override
    protected IType createAsyncBinaryReturnType() {
        return null;
    }

    @Override
    protected IType createAsyncBodyReturnType(IType restAPIMethodReturnBodyClientType) {
        return GenericType.AndroidCompletableFuture(restAPIMethodReturnBodyClientType);
    }

    @Override
    protected IType createAsyncVoidReturnType() {
        return GenericType.AndroidCompletableFuture(ClassType.VOID);
    }

    @Override
    protected IType createSyncReturnWithResponseType(IType syncReturnType, Operation operation, boolean isProtocolMethod, JavaSettings settings) {
        return GenericType.AndroidResponse(syncReturnType);
    }

    @Override
    protected boolean shouldGeneratePagingMethods() {
        return true;
    }

    @Override
    protected ReturnValue createSimpleSyncRestResponseReturnValue(Operation operation, IType syncReturnWithResponse, IType syncReturnType) {
        return new ReturnValue(returnTypeDescription(operation, syncReturnWithResponse, syncReturnType), syncReturnWithResponse);
    }

    @Override
    protected ReturnValue createSimpleAsyncRestResponseReturnValue(Operation operation, IType asyncRestResponseReturnType, IType syncReturnType) {
        IType asyncWithResponseType = GenericType.AndroidCompletableFuture(GenericType.AndroidResponse(syncReturnType));
        return new ReturnValue(returnTypeDescription(operation, asyncWithResponseType, syncReturnType),
                asyncWithResponseType);
    }

    @Override
    protected ReturnValue createSimpleSyncReturnValue(Operation operation, IType syncReturnType) {
        return new ReturnValue(returnTypeDescription(operation, syncReturnType, syncReturnType), syncReturnType);
    }

    @Override
    protected ReturnValue createSimpleAsyncReturnValue(Operation operation, IType asyncReturnType, IType syncReturnType) {
        return new ReturnValue(returnTypeDescription(operation, asyncReturnType, syncReturnType), asyncReturnType);
    }

}
