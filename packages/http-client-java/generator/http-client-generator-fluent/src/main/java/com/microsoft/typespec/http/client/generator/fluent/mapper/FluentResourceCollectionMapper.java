// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.fluent.mapper;

import com.azure.autorest.extension.base.model.codemodel.OperationGroup;
import com.microsoft.typespec.http.client.generator.fluent.model.clientmodel.FluentResourceCollection;
import com.azure.autorest.mapper.IMapper;
import com.azure.autorest.mapper.Mappers;
import com.azure.autorest.model.clientmodel.MethodGroupClient;

public class FluentResourceCollectionMapper implements IMapper<OperationGroup, FluentResourceCollection> {

    private static final FluentResourceCollectionMapper INSTANCE = new FluentResourceCollectionMapper();

    public static FluentResourceCollectionMapper getInstance() {
        return INSTANCE;
    }

    @Override
    public FluentResourceCollection map(OperationGroup operationGroup) {
        FluentResourceCollection fluentResourceCollection = null;

        MethodGroupClient groupClient = Mappers.getMethodGroupMapper().map(operationGroup);
        if (groupClient != null && !groupClient.getClassBaseName().isEmpty()) {
            fluentResourceCollection = new FluentResourceCollection(groupClient);
        }

        return fluentResourceCollection;
    }
}
