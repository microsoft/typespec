// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ObjectSchema;
import com.microsoft.typespec.http.client.generator.core.mapper.ModelPropertyMapper;

public class FluentModelPropertyMapper extends ModelPropertyMapper {
    private static final FluentModelPropertyMapper INSTANCE = new FluentModelPropertyMapper();

    public static FluentModelPropertyMapper getInstance() {
        return INSTANCE;
    }

    @Override
    public boolean isPlainObject(ObjectSchema compositeType) {
        return false;
    }
}
