// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

public interface MapperFactory {

    ChoiceMapper getChoiceMapper();

    SealedChoiceMapper getSealedChoiceMapper();

    PrimitiveMapper getPrimitiveMapper();

    SchemaMapper getSchemaMapper();

    ArrayMapper getArrayMapper();

    DictionaryMapper getDictionaryMapper();

    ObjectMapper getObjectMapper();

    ConstantMapper getConstantMapper();

    ModelPropertyMapper getModelPropertyMapper();

    ModelMapper getModelMapper();

    ProxyParameterMapper getProxyParameterMapper();

    ProxyMethodMapper getProxyMethodMapper();

    ProxyMethodExampleMapper getProxyMethodExampleMapper();

    MethodGroupMapper getMethodGroupMapper();

    ClientParameterMapper getClientParameterMapper();

    ClientMethodMapper getClientMethodMapper();

    ExceptionMapper getExceptionMapper();

    ServiceClientMapper getServiceClientMapper();

    ClientMapper getClientMapper();

    AnyMapper getAnyMapper();

    BinaryMapper getBinaryMapper();

    UnionMapper getUnionMapper();

    UnionModelMapper getUnionModelMapper();

    GraalVmConfigMapper getGraalVmConfigMapper();
}
