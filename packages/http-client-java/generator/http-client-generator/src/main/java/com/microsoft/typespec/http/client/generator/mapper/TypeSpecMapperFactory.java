// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mapper;

import com.azure.autorest.mapper.ClientMapper;
import com.azure.autorest.mapper.DefaultMapperFactory;
import com.azure.autorest.mapper.PrimitiveMapper;

public class TypeSpecMapperFactory extends DefaultMapperFactory {

    @Override
    public ClientMapper getClientMapper() {
        return TypeSpecClientMapper.getInstance();
    }

    @Override
    public PrimitiveMapper getPrimitiveMapper() {
        return TypeSpecPrimitiveMapper.getInstance();
    }
}
