// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

public class DefaultMapperFactory implements MapperFactory {
    @Override
    public ChoiceMapper getChoiceMapper() {
        return ChoiceMapper.getInstance();
    }

    @Override
    public SealedChoiceMapper getSealedChoiceMapper() {
        return SealedChoiceMapper.getInstance();
    }

    @Override
    public PrimitiveMapper getPrimitiveMapper() {
        return PrimitiveMapper.getInstance();
    }

    @Override
    public SchemaMapper getSchemaMapper() {
        return SchemaMapper.getInstance();
    }

    @Override
    public ArrayMapper getArrayMapper() {
        return ArrayMapper.getInstance();
    }

    @Override
    public DictionaryMapper getDictionaryMapper() {
        return DictionaryMapper.getInstance();
    }

    @Override
    public ObjectMapper getObjectMapper() {
        return ObjectMapper.getInstance();
    }

    @Override
    public ConstantMapper getConstantMapper() {
        return ConstantMapper.getInstance();
    }

    @Override
    public ModelPropertyMapper getModelPropertyMapper() {
        return ModelPropertyMapper.getInstance();
    }

    @Override
    public ModelMapper getModelMapper() {
        return ModelMapper.getInstance();
    }

    @Override
    public ProxyParameterMapper getProxyParameterMapper() {
        return ProxyParameterMapper.getInstance();
    }

    @Override
    public ProxyMethodMapper getProxyMethodMapper() {
        return ProxyMethodMapper.getInstance();
    }

    @Override
    public ProxyMethodExampleMapper getProxyMethodExampleMapper() {
        return ProxyMethodExampleMapper.getInstance();
    }

    @Override
    public MethodGroupMapper getMethodGroupMapper() {
        return MethodGroupMapper.getInstance();
    }

    @Override
    public ClientParameterMapper getClientParameterMapper() {
        return ClientParameterMapper.getInstance();
    }

    @Override
    public ClientMethodMapper getClientMethodMapper() {
        return ClientMethodMapper.getInstance();
    }

    @Override
    public ExceptionMapper getExceptionMapper() {
        return ExceptionMapper.getInstance();
    }

    @Override
    public ServiceClientMapper getServiceClientMapper() {
        return ServiceClientMapper.getInstance();
    }

    @Override
    public ClientMapper getClientMapper() {
        return ClientMapper.getInstance();
    }

    @Override
    public AnyMapper getAnyMapper() {
        return AnyMapper.getInstance();
    }

    @Override
    public BinaryMapper getBinaryMapper() {
        return BinaryMapper.getInstance();
    }

    @Override
    public UnionMapper getUnionMapper() {
        return UnionMapper.getInstance();
    }

    @Override
    public UnionModelMapper getUnionModelMapper() {
        return UnionModelMapper.getInstance();
    }

    @Override
    public GraalVmConfigMapper getGraalVmConfigMapper() {
        return GraalVmConfigMapper.getInstance();
    }
}
