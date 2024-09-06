// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper.android;

import com.microsoft.typespec.http.client.generator.core.mapper.ClientMethodMapper;
import com.microsoft.typespec.http.client.generator.core.mapper.DefaultMapperFactory;
import com.microsoft.typespec.http.client.generator.core.mapper.ExceptionMapper;
import com.microsoft.typespec.http.client.generator.core.mapper.MethodGroupMapper;
import com.microsoft.typespec.http.client.generator.core.mapper.ModelMapper;
import com.microsoft.typespec.http.client.generator.core.mapper.PrimitiveMapper;
import com.microsoft.typespec.http.client.generator.core.mapper.ProxyMethodMapper;
import com.microsoft.typespec.http.client.generator.core.mapper.ProxyParameterMapper;
import com.microsoft.typespec.http.client.generator.core.mapper.ServiceClientMapper;

public class AndroidMapperFactory extends DefaultMapperFactory {

    @Override
    public PrimitiveMapper getPrimitiveMapper() { return AndroidPrimitiveMapper.getInstance(); }

    @Override
    public ClientMethodMapper getClientMethodMapper() {
        return AndroidClientMethodMapper.getInstance();
    }

    @Override
    public ProxyMethodMapper getProxyMethodMapper() {
        return AndroidProxyMethodMapper.getInstance();
    }

    @Override
    public ProxyParameterMapper getProxyParameterMapper() {
        return AndroidProxyParameterMapper.getInstance();
    }

    @Override
    public MethodGroupMapper getMethodGroupMapper() {
        return AndroidMethodGroupMapper.getInstance();
    }

    @Override
    public ServiceClientMapper getServiceClientMapper() {
        return AndroidServiceClientMapper.getInstance();
    }

    @Override
    public ModelMapper getModelMapper() {
        return AndroidModelMapper.getInstance();
    }

    @Override
    public ExceptionMapper getExceptionMapper() {
        return AndroidExceptionMapper.getInstance();
    }
}
