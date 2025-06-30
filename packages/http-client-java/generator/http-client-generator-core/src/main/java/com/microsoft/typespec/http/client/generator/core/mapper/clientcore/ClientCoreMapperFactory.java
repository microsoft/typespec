// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper.clientcore;

import com.microsoft.typespec.http.client.generator.core.mapper.ClientMethodMapper;
import com.microsoft.typespec.http.client.generator.core.mapper.ClientParameterMapper;
import com.microsoft.typespec.http.client.generator.core.mapper.DefaultMapperFactory;
import com.microsoft.typespec.http.client.generator.core.mapper.PomMapper;
import com.microsoft.typespec.http.client.generator.core.mapper.ProxyMethodMapper;
import com.microsoft.typespec.http.client.generator.core.mapper.ProxyParameterMapper;

public class ClientCoreMapperFactory extends DefaultMapperFactory {
    @Override
    public ClientMethodMapper getClientMethodMapper() {
        return ClientCoreClientMethodMapper.getInstance();
    }

    @Override
    public ClientParameterMapper getClientParameterMapper() {
        return ClientCoreClientParameterMapper.getInstance();
    }

    @Override
    public PomMapper getPomMapper() {
        return ClientCorePomMapper.getInstance();
    }

    @Override
    public ProxyMethodMapper getProxyMethodMapper() {
        return ClientCoreProxyMethodMapper.getInstance();
    }

    @Override
    public ProxyParameterMapper getProxyParameterMapper() {
        return ClientCoreProxyParameterMapper.getInstance();
    }
}
