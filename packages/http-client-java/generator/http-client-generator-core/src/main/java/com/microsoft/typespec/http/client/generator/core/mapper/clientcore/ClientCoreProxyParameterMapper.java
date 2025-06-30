// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper.clientcore;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Parameter;
import com.microsoft.typespec.http.client.generator.core.mapper.ProxyParameterMapper;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;

public class ClientCoreProxyParameterMapper extends ProxyParameterMapper {
    private static final ClientCoreProxyParameterMapper INSTANCE = new ClientCoreProxyParameterMapper();

    private ClientCoreProxyParameterMapper() {
    }

    public static ClientCoreProxyParameterMapper getInstance() {
        return INSTANCE;
    }

    @Override
    protected boolean isRemoveModelFromParameter(Parameter parameter, IType clientType) {
        return false;
    }
}
