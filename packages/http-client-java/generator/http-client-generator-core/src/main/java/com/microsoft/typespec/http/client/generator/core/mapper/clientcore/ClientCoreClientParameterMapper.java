// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper.clientcore;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Parameter;
import com.microsoft.typespec.http.client.generator.core.mapper.ClientParameterMapper;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;

public class ClientCoreClientParameterMapper extends ClientParameterMapper {
    private static final ClientCoreClientParameterMapper INSTANCE = new ClientCoreClientParameterMapper();

    private ClientCoreClientParameterMapper() {

    }

    public static ClientCoreClientParameterMapper getInstance() {
        return INSTANCE;
    }

    @Override
    public ClientMethodParameter map(Parameter parameter) {
        return map(parameter, false);
    }
}
