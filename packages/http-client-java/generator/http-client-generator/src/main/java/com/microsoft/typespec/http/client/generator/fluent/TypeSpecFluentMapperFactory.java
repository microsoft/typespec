// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.fluent;

import com.microsoft.typespec.http.client.generator.core.mapper.ChoiceMapper;
import com.microsoft.typespec.http.client.generator.core.mapper.SealedChoiceMapper;
import com.microsoft.typespec.http.client.generator.mgmt.mapper.FluentMapperFactory;
import com.microsoft.typespec.http.client.generator.core.mapper.ClientMapper;
import com.microsoft.typespec.http.client.generator.core.mapper.ModelMapper;
import com.microsoft.typespec.http.client.generator.core.mapper.ModelPropertyMapper;
import com.microsoft.typespec.http.client.generator.core.mapper.ObjectMapper;
import com.microsoft.typespec.http.client.generator.core.mapper.PrimitiveMapper;
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

    @Override
    public ChoiceMapper getChoiceMapper() {
        return ChoiceMapper.getInstance();
    }

    @Override
    public SealedChoiceMapper getSealedChoiceMapper() {
        return SealedChoiceMapper.getInstance();
    }
}
