// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentStatic;
import com.microsoft.typespec.http.client.generator.core.mapper.ClientMethodMapper;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility;

import java.util.List;

public class FluentClientMethodMapper extends ClientMethodMapper {

    private static final FluentClientMethodMapper INSTANCE = new FluentClientMethodMapper();

    public static FluentClientMethodMapper getInstance() {
        return INSTANCE;
    }

    @Override
    protected void createAdditionalLroMethods(
            Operation operation, ClientMethod.Builder builder, List<ClientMethod> methods, boolean isProtocolMethod,
            IType asyncReturnType, IType syncReturnType, ProxyMethod proxyMethod, List<ClientMethodParameter> parameters,
            boolean generateClientMethodWithOnlyRequiredParameters, MethodOverloadType defaultOverloadType) {

        // fluent provides the simple wrapper API for LRO
        // the difference is that it does not have a RestResponse overload, as Response data is not included in an LRO API

        // async
        methods.add(builder
                .returnValue(createLongRunningAsyncReturnValue(operation, asyncReturnType, syncReturnType))
                .name(proxyMethod.getSimpleAsyncMethodName())
                .onlyRequiredParameters(false)
                .type(ClientMethodType.LongRunningAsync)
                .groupedParameterRequired(false)
                .methodVisibility(methodVisibility(ClientMethodType.LongRunningAsync, defaultOverloadType, false, isProtocolMethod))
                .build());

        if (generateClientMethodWithOnlyRequiredParameters) {
            methods.add(builder
                    .onlyRequiredParameters(true)
                    .methodVisibility(methodVisibility(ClientMethodType.LongRunningAsync, MethodOverloadType.OVERLOAD_MINIMUM, false, isProtocolMethod))
                    .build());
        }

        addClientMethodWithContext(methods,
                builder.methodVisibility(methodVisibility(ClientMethodType.LongRunningAsync, defaultOverloadType, true, isProtocolMethod)),
                parameters, getContextParameter(isProtocolMethod));

        // sync
        methods.add(builder
                .returnValue(createLongRunningSyncReturnValue(operation, syncReturnType))
                .name(proxyMethod.getName())
                .onlyRequiredParameters(false)
                .type(ClientMethodType.LongRunningSync)
                .groupedParameterRequired(false)
                .onlyRequiredParameters(true)
                .methodVisibility(methodVisibility(ClientMethodType.LongRunningSync, defaultOverloadType, false, isProtocolMethod))
                .build());

        if (generateClientMethodWithOnlyRequiredParameters) {
            methods.add(builder
                    .onlyRequiredParameters(true)
                    .methodVisibility(methodVisibility(ClientMethodType.LongRunningSync, MethodOverloadType.OVERLOAD_MINIMUM, false, isProtocolMethod))
                    .build());
        }

        addClientMethodWithContext(methods,
                builder.methodVisibility(methodVisibility(ClientMethodType.LongRunningSync, defaultOverloadType, true, isProtocolMethod)),
                parameters, getContextParameter(isProtocolMethod));
    }

    @Override
    protected JavaVisibility methodVisibility(
            ClientMethodType methodType,
            MethodOverloadType methodOverloadType,
            boolean hasContextParameter,
            boolean isProtocolMethod) {

        JavaVisibility visibility;
        if (methodType == ClientMethodType.PagingAsyncSinglePage) {
            // utility methods
            // single page method is not visible, but the method is required for other client methods
            visibility = NOT_VISIBLE;
        } else if (methodType == ClientMethodType.PagingSyncSinglePage) {
            // wait for sync-stack to decide
            visibility = NOT_GENERATE;
        } else if (hasContextParameter && (methodType == ClientMethodType.SimpleAsyncRestResponse || methodType == ClientMethodType.PagingAsync || methodType == ClientMethodType.LongRunningBeginAsync || methodType == ClientMethodType.LongRunningAsync)) {
            // utility methods
            // async + Context method is not visible, but the method is required for other client methods
            visibility = NOT_VISIBLE;
        } else {
            if (methodType.name().contains("Async") && hasContextParameter) {
                // async method has both minimum overload and maximum overload, but no overload with Context parameter
                visibility = NOT_GENERATE;
            } else if (methodType == ClientMethodType.SimpleSync && hasContextParameter) {
                // SimpleSync with Context is covered by SimpleSyncRestResponse with Context
                visibility = NOT_GENERATE;
            } else if (methodType == ClientMethodType.SimpleAsync && methodOverloadType == MethodOverloadType.OVERLOAD_MAXIMUM) {
                // SimpleAsync with maximum overload is covered by SimpleAsyncRestResponse
                visibility = NOT_GENERATE;
            } else if (((methodType.name().contains("Sync") && !hasContextParameter))
                    && ((methodOverloadType.value() & MethodOverloadType.OVERLOAD_MINIMUM.value()) != MethodOverloadType.OVERLOAD_MINIMUM.value())) {
                // sync method has both minimum overload and maximum overload + Context parameter, but not maximum overload without Context parameter
                visibility = NOT_GENERATE;
            } else {
                visibility = super.methodVisibility(methodType, methodOverloadType, hasContextParameter, isProtocolMethod);
            }
        }

        if (JavaSettings.getInstance().isFluentLite() && !FluentStatic.getFluentJavaSettings().isGenerateAsyncMethods()) {
            // by default, Fluent lite disable all async method
            if (visibility == JavaVisibility.Public && methodType.name().contains("Async")) {
                visibility = JavaVisibility.Private;
            }
        }
        return visibility;
    }
}
