package com.microsoft.typespec.http.client.generator.mapper;

import com.microsoft.typespec.http.client.generator.core.mapper.ClientMapper;
import com.microsoft.typespec.http.client.generator.core.mapper.PrimitiveMapper;
import com.microsoft.typespec.http.client.generator.core.mapper.azurevnext.AzureVNextMapperFactory;

public class TypeSpecAzureVNextMapperFactory extends AzureVNextMapperFactory {
    @Override
    public ClientMapper getClientMapper() {
        return TypeSpecClientMapper.getInstance();
    }

    @Override
    public PrimitiveMapper getPrimitiveMapper() {
        return TypeSpecPrimitiveMapper.getInstance();
    }
}
