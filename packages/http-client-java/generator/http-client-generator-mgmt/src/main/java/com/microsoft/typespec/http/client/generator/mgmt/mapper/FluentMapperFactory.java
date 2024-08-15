// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.mapper;

import com.microsoft.typespec.http.client.generator.core.mapper.ClientMethodMapper;
import com.microsoft.typespec.http.client.generator.core.mapper.DefaultMapperFactory;
import com.microsoft.typespec.http.client.generator.core.mapper.ExceptionMapper;
import com.microsoft.typespec.http.client.generator.core.mapper.MethodGroupMapper;
import com.microsoft.typespec.http.client.generator.core.mapper.ModelMapper;
import com.microsoft.typespec.http.client.generator.core.mapper.ObjectMapper;
import com.microsoft.typespec.http.client.generator.core.mapper.PrimitiveMapper;
import com.microsoft.typespec.http.client.generator.core.mapper.ProxyMethodMapper;

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
