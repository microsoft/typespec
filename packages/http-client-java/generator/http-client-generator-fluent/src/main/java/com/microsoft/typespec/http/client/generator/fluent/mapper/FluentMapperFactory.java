// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.fluent.mapper;

import com.azure.autorest.mapper.ClientMethodMapper;
import com.azure.autorest.mapper.DefaultMapperFactory;
import com.azure.autorest.mapper.ExceptionMapper;
import com.azure.autorest.mapper.MethodGroupMapper;
import com.azure.autorest.mapper.ModelMapper;
import com.azure.autorest.mapper.ObjectMapper;
import com.azure.autorest.mapper.PrimitiveMapper;
import com.azure.autorest.mapper.ProxyMethodMapper;

public class FluentMapperFactory extends DefaultMapperFactory {

    @Override
    public ObjectMapper getObjectMapper() {
        return FluentObjectMapper.getInstance();
    }

    @Override
    public MethodGroupMapper getMethodGroupMapper() {
        return FluentMethodGroupMapper.getInstance();
    }

    @Override
    public ProxyMethodMapper getProxyMethodMapper() {
        return FluentProxyMethodMapper.getInstance();
    }

    @Override
    public ExceptionMapper getExceptionMapper() {
        return FluentExceptionMapper.getInstance();
    }

    @Override
    public ClientMethodMapper getClientMethodMapper() {
        return FluentClientMethodMapper.getInstance();
    }

    @Override
    public PrimitiveMapper getPrimitiveMapper() {
        return FluentPrimitiveMapper.getInstance();
    }

    @Override
    public ModelMapper getModelMapper() {
        return FluentModelMapper.getInstance();
    }
}
