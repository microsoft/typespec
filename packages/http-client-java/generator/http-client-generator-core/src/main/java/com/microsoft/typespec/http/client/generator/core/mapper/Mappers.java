// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

public class Mappers {

    private static MapperFactory factory = new DefaultMapperFactory();

    public static void setFactory(MapperFactory mapperFactory) {
        factory = mapperFactory;
    }

    public static ChoiceMapper getChoiceMapper() {
        return factory.getChoiceMapper();
    }

    public static SealedChoiceMapper getSealedChoiceMapper() {
        return factory.getSealedChoiceMapper();
    }

    public static PrimitiveMapper getPrimitiveMapper() {
        return factory.getPrimitiveMapper();
    }

    public static SchemaMapper getSchemaMapper() {
        return factory.getSchemaMapper();
    }

    public static ArrayMapper getArrayMapper() {
        return factory.getArrayMapper();
    }

    public static DictionaryMapper getDictionaryMapper() {
        return factory.getDictionaryMapper();
    }

    public static ObjectMapper getObjectMapper() {
        return factory.getObjectMapper();
    }

    public static ConstantMapper getConstantMapper() {
        return factory.getConstantMapper();
    }

    public static ModelPropertyMapper getModelPropertyMapper() {
        return factory.getModelPropertyMapper();
    }

    public static ModelMapper getModelMapper() {
        return factory.getModelMapper();
    }

    public static ProxyParameterMapper getProxyParameterMapper() {
        return factory.getProxyParameterMapper();
    }

    public static ProxyMethodMapper getProxyMethodMapper() {
        return factory.getProxyMethodMapper();
    }

    public static ProxyMethodExampleMapper getProxyMethodExampleMapper() {
        return factory.getProxyMethodExampleMapper();
    }

    public static MethodGroupMapper getMethodGroupMapper() {
        return factory.getMethodGroupMapper();
    }

    public static ClientParameterMapper getClientParameterMapper() {
        return factory.getClientParameterMapper();
    }

    public static ClientMethodMapper getClientMethodMapper() {
        return factory.getClientMethodMapper();
    }

    public static ExceptionMapper getExceptionMapper() {
        return factory.getExceptionMapper();
    }

    public static ServiceClientMapper getServiceClientMapper() {
        return factory.getServiceClientMapper();
    }

    public static ClientMapper getClientMapper() {
        return factory.getClientMapper();
    }

    public static AnyMapper getAnyMapper() {
        return factory.getAnyMapper();
    }

    public static BinaryMapper getBinaryMapper() {
        return factory.getBinaryMapper();
    }

    public static UnionMapper getUnionMapper() {
        return factory.getUnionMapper();
    }

    public static UnionModelMapper getUnionModelMapper() {
        return factory.getUnionModelMapper();
    }

    public static GraalVmConfigMapper getGraalVmConfigMapper() {
        return factory.getGraalVmConfigMapper();
    }
}
