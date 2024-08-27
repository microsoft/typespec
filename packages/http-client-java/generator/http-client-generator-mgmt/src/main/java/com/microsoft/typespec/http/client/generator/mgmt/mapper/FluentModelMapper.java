// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.mapper;

import com.microsoft.typespec.http.client.generator.mgmt.model.FluentType;
import com.microsoft.typespec.http.client.generator.core.mapper.ModelMapper;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;

import java.util.HashSet;
import java.util.Set;

public class FluentModelMapper extends ModelMapper {

    private static final FluentModelMapper INSTANCE = new FluentModelMapper();

    private final Set<String> removedModels = new HashSet<>();

    public static FluentModelMapper getInstance() {
        return INSTANCE;
    }

    @Override
    protected boolean isPredefinedModel(ClassType modelType) {
        return !FluentType.nonResourceType(modelType)
                || !FluentType.nonManagementError(modelType)
                || !FluentType.nonSystemData(modelType)
                || removedModels.contains(modelType.getName());
    }

    public void addRemovedModels(Set<String> models) {
        removedModels.addAll(models);
    }
}
