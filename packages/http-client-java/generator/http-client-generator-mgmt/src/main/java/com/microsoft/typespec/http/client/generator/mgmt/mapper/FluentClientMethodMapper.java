// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.mapper.ClientMethodMapper;
import com.microsoft.typespec.http.client.generator.core.mapper.ClientMethodsReturnDescription;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodPollingDetails;
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
        CreateMethodArgs createMethodArgs) {
        createLroGetFinalResultClientMethods(false, lroBaseMethod, methods, createMethodArgs);
        createLroGetFinalResultClientMethods(true, lroBaseMethod, methods, createMethodArgs);
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

    private void createLroGetFinalResultClientMethods(boolean isSync, ClientMethod baseMethod,
        List<ClientMethod> methods, CreateMethodArgs createMethodArgs) {
        // Fluent provides simple LRO method variants that wait for LRO to complete and produces the final result.
        // Note that these variants does not include '[Operation]WithResponse' style methods returning Response<T>,
        // as Response data is not included in an LRO API.

        final boolean isProtocolMethod = createMethodArgs.isProtocolMethod;
        final MethodOverloadType defaultOverloadType = createMethodArgs.methodOverloadType;
        final ClientMethodsReturnDescription methodsReturnDescription = createMethodArgs.methodsReturnDescription;
        final boolean generateRequiredOnlyParametersOverload
            = createMethodArgs.generateRequiredOnlyParamsMethodOverload;
        final ProxyMethod proxyMethod = baseMethod.getProxyMethod();

        final String methodName;
        final ClientMethodType clientMethodType;
        if (isSync) {
            methodName = proxyMethod.getName();
            clientMethodType = ClientMethodType.LongRunningSync;
        } else {
            methodName = proxyMethod.getSimpleAsyncMethodName();
            clientMethodType = ClientMethodType.LongRunningAsync;
        }
        final JavaVisibility methodVisibility
            = methodVisibility(clientMethodType, defaultOverloadType, false, isProtocolMethod);
        final JavaVisibility methodWithRequiredOnlyParametersVisibility
            = methodVisibility(clientMethodType, MethodOverloadType.OVERLOAD_MINIMUM, false, isProtocolMethod);
        final JavaVisibility methodWithContextVisibility
            = methodVisibility(clientMethodType, defaultOverloadType, true, isProtocolMethod);
        final MethodPollingDetails methodPollingDetails = baseMethod.getMethodPollingDetails();

        final ClientMethod lroGetFinalResultMethod = baseMethod.newBuilder()
            .returnValue(methodsReturnDescription.getReturnValue(clientMethodType, methodPollingDetails))
            .name(methodName)
            .onlyRequiredParameters(false)
            .type(clientMethodType)
            .groupedParameterRequired(false)
            .methodVisibility(methodVisibility)
            .build();
        methods.add(lroGetFinalResultMethod);

        if (generateRequiredOnlyParametersOverload) {
            final ClientMethod lroGetFinalResultMethodWithRequiredOnlyParameters = lroGetFinalResultMethod.newBuilder()
                .onlyRequiredParameters(true)
                .methodVisibility(methodWithRequiredOnlyParametersVisibility)
                .build();
            methods.add(lroGetFinalResultMethodWithRequiredOnlyParameters);
        }

        addClientMethodWithContext(methods, lroGetFinalResultMethod, methodWithContextVisibility, isProtocolMethod);
    }
}
