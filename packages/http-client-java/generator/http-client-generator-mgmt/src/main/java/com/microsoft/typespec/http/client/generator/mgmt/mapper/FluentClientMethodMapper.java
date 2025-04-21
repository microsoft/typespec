// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.mapper.ClientMethodMapper;
import com.microsoft.typespec.http.client.generator.core.mapper.ClientMethodsReturnDescription;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentStatic;
import java.util.List;

public class FluentClientMethodMapper extends ClientMethodMapper {

    private static final FluentClientMethodMapper INSTANCE = new FluentClientMethodMapper();

    public static FluentClientMethodMapper getInstance() {
        return INSTANCE;
    }

    @Override
    protected void createAdditionalLroMethods(ClientMethod lroBaseMethod, List<ClientMethod> methods,
        boolean isProtocolMethod, ClientMethodsReturnDescription methodsReturnDescription,
        boolean generateClientMethodWithOnlyRequiredParameters, MethodOverloadType defaultOverloadType) {

        // Fluent provides simple LRO method variants that wait for LRO to complete and produces the final result.
        // Note that these variants does not include '[Operation]WithResponse' style methods returning Response<T>,
        // as Response data is not included in an LRO API.

        final ProxyMethod proxyMethod = lroBaseMethod.getProxyMethod();
        final List<ClientMethodParameter> parameters = lroBaseMethod.getParameters();

        // async
        //
        final ClientMethod longRunningFinalResultAsyncMethod = lroBaseMethod.newBuilder()
            .returnValue(methodsReturnDescription.getReturnValue(ClientMethodType.LongRunningAsync))
            .name(proxyMethod.getSimpleAsyncMethodName())
            .onlyRequiredParameters(false)
            .type(ClientMethodType.LongRunningAsync)
            .groupedParameterRequired(false)
            .methodVisibility(
                methodVisibility(ClientMethodType.LongRunningAsync, defaultOverloadType, false, isProtocolMethod))
            .build();

        methods.add(longRunningFinalResultAsyncMethod);

        if (generateClientMethodWithOnlyRequiredParameters) {
            final ClientMethod longRunningFinalResultAsyncMethodWithRequiredParameters
                = longRunningFinalResultAsyncMethod.newBuilder()
                    .onlyRequiredParameters(true)
                    .methodVisibility(methodVisibility(ClientMethodType.LongRunningAsync,
                        MethodOverloadType.OVERLOAD_MINIMUM, false, isProtocolMethod))
                    .build();
            methods.add(longRunningFinalResultAsyncMethodWithRequiredParameters);
        }

        final ClientMethod.Builder longRunningFinalResultAsyncWithContextBuilder
            = longRunningFinalResultAsyncMethod.newBuilder()
                .methodVisibility(
                    methodVisibility(ClientMethodType.LongRunningAsync, defaultOverloadType, true, isProtocolMethod));
        addClientMethodWithContext(methods, longRunningFinalResultAsyncWithContextBuilder, parameters,
            getContextParameter(isProtocolMethod));

        // sync
        //
        final ClientMethod longRunningFinalResultSyncMethod = lroBaseMethod.newBuilder()
            .returnValue(methodsReturnDescription.getReturnValue(ClientMethodType.LongRunningSync))
            .name(proxyMethod.getName())
            .onlyRequiredParameters(false)
            .type(ClientMethodType.LongRunningSync)
            .groupedParameterRequired(false)
            .onlyRequiredParameters(true)
            .methodVisibility(
                methodVisibility(ClientMethodType.LongRunningSync, defaultOverloadType, false, isProtocolMethod))
            .build();

        methods.add(longRunningFinalResultSyncMethod);

        if (generateClientMethodWithOnlyRequiredParameters) {
            final ClientMethod longRunningFinalResultSyncMethodWithRequiredParameters
                = longRunningFinalResultSyncMethod.newBuilder()
                    .onlyRequiredParameters(true)
                    .methodVisibility(methodVisibility(ClientMethodType.LongRunningSync,
                        MethodOverloadType.OVERLOAD_MINIMUM, false, isProtocolMethod))
                    .build();
            methods.add(longRunningFinalResultSyncMethodWithRequiredParameters);
        }

        final ClientMethod.Builder longRunningFinalResultSyncWithContextBuilder
            = longRunningFinalResultSyncMethod.newBuilder()
                .methodVisibility(
                    methodVisibility(ClientMethodType.LongRunningSync, defaultOverloadType, true, isProtocolMethod));

        addClientMethodWithContext(methods, longRunningFinalResultSyncWithContextBuilder, parameters,
            getContextParameter(isProtocolMethod));
    }

    @Override
    protected JavaVisibility methodVisibility(ClientMethodType methodType, MethodOverloadType methodOverloadType,
        boolean hasContextParameter, boolean isProtocolMethod) {

        boolean syncStack = JavaSettings.getInstance().isSyncStackEnabled();

        JavaVisibility visibility
            = super.methodVisibility(methodType, methodOverloadType, hasContextParameter, isProtocolMethod);
        if (methodType == ClientMethodType.PagingAsyncSinglePage) {
            if (syncStack && hasContextParameter) {
                // in async-stack, single page method + context is for pagingAsync + context implementation, which
                // is for pagingSync + context implementation
                // sync-stack doesn't need it
                visibility = NOT_GENERATE;
            } else {
                // utility methods
                // in async-stack, single page method is not visible, but the method is required for other client
                // methods
                visibility = NOT_VISIBLE;
            }
        } else if (methodType == ClientMethodType.PagingSyncSinglePage) {
            visibility = syncStack ? NOT_VISIBLE : NOT_GENERATE;
        } else if (!syncStack
            && hasContextParameter
            && (methodType == ClientMethodType.SimpleAsyncRestResponse
                || methodType == ClientMethodType.PagingAsync
                || methodType == ClientMethodType.LongRunningBeginAsync
                || methodType == ClientMethodType.LongRunningAsync)) {
            // utility methods
            // for async-stack, async + Context method is not visible, but the method is required for sync method
            // implementation
            visibility = NOT_VISIBLE;
        } else {
            if (!methodType.isSync() && hasContextParameter) {
                // async method has both minimum overload and maximum overload, but no overload with Context parameter
                visibility = NOT_GENERATE;
            } else if (methodType == ClientMethodType.SimpleSync && hasContextParameter) {
                // SimpleSync with Context is covered by SimpleSyncRestResponse with Context
                visibility = NOT_GENERATE;
            } else if (methodType == ClientMethodType.SimpleAsync
                && methodOverloadType == MethodOverloadType.OVERLOAD_MAXIMUM) {
                // SimpleAsync with maximum overload is covered by SimpleAsyncRestResponse
                visibility = NOT_GENERATE;
            } else if (methodType.isSync()
                && !hasContextParameter
                && (methodOverloadType.value() & MethodOverloadType.OVERLOAD_MINIMUM.value())
                    != MethodOverloadType.OVERLOAD_MINIMUM.value()) {
                if (syncStack && methodType == ClientMethodType.LongRunningBeginSync) {
                    // In sync-stack, LongRunningSync calls LongRunningBeginSync for implementation.
                    visibility = NOT_VISIBLE;
                } else {
                    // sync method has both minimum overload and maximum overload + Context parameter, but not maximum
                    // overload without Context parameter
                    visibility = NOT_GENERATE;
                }
            }
        }

        if (JavaSettings.getInstance().isFluentLite()
            && !FluentStatic.getFluentJavaSettings().isGenerateAsyncMethods()) {
            // by default, Fluent lite disable all async method
            if (visibility == JavaVisibility.Public && methodType.name().contains("Async")) {
                visibility = JavaVisibility.Private;
            }
        }
        return visibility;
    }
}
