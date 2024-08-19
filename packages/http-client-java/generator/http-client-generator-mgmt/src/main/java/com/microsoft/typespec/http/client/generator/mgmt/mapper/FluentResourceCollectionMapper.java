// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.OperationGroup;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceCollection;
import com.microsoft.typespec.http.client.generator.core.mapper.IMapper;
import com.microsoft.typespec.http.client.generator.core.mapper.Mappers;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodGroupClient;

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
