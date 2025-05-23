// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper.clientcore;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.mapper.ClientMethodMapper;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility;
import java.util.ArrayList;
import java.util.List;

public class ClientCoreClientMethodMapper extends ClientMethodMapper {

    private static final ClientCoreClientMethodMapper INSTANCE = new ClientCoreClientMethodMapper();

    private ClientCoreClientMethodMapper() {
    }

    public static ClientCoreClientMethodMapper getInstance() {
        return INSTANCE;
    }

    @Override
    public List<ClientMethod> map(Operation operation) {
        return super.map(operation, false);
    }

    @Override
    protected ClientMethodParameter getContextParameter(boolean isProtocolMethod) {
        return ClientMethodParameter.REQUEST_CONTEXT_PARAMETER;
    }

    @Override
    protected void addClientMethodWithContext(List<ClientMethod> methods, ClientMethod baseMethod,
        JavaVisibility visibility, boolean isProtocolMethod) {
        final ClientMethodParameter contextParameter = getContextParameter(isProtocolMethod);
        final List<ClientMethodParameter> parameters = new ArrayList<>(baseMethod.getParameters());
        if (contextParameter.getClientType().equals(ClassType.REQUEST_CONTEXT)) {
            parameters.add(contextParameter);
        }
        final ClientMethod withContextMethod = baseMethod.newBuilder()
            .methodVisibility(visibility)
            .parameters(parameters)
            .onlyRequiredParameters(false)
            .hasWithContextOverload(false)
            .build();
        methods.add(withContextMethod);
    }
}
