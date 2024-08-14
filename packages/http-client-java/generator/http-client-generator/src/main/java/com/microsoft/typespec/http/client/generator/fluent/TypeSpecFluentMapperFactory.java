// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.fluent;

import com.microsoft.typespec.http.client.generator.fluent.mapper.FluentMapperFactory;
import com.azure.autorest.mapper.ClientMapper;
import com.azure.autorest.mapper.ModelMapper;
import com.azure.autorest.mapper.ModelPropertyMapper;
import com.azure.autorest.mapper.ObjectMapper;
import com.azure.autorest.mapper.PrimitiveMapper;
import com.microsoft.typespec.http.client.generator.mapper.TypeSpecClientMapper;
import com.microsoft.typespec.http.client.generator.mapper.TypeSpecPrimitiveMapper;

public class TypeSpecFluentMapperFactory extends FluentMapperFactory {
    @Override
    public ClientMapper getClientMapper() {
        return TypeSpecClientMapper.getInstance();
    }

    @Override
    public PrimitiveMapper getPrimitiveMapper() {
        return TypeSpecPrimitiveMapper.getInstance();
    }

    @Override
    public ObjectMapper getObjectMapper() {
        return TypeSpecFluentObjectMapper.getInstance();
    }

    @Override
    public ModelMapper getModelMapper() {
        return TypeSpecFluentModelMapper.getInstance();
    }

    @Override
    public ModelPropertyMapper getModelPropertyMapper() {
        return TypeSpecFluentModelPropertyMapper.getInstance();
    }
}
