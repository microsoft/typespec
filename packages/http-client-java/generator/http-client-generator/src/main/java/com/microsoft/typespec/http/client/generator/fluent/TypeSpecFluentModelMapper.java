// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.fluent;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ObjectSchema;
import com.microsoft.typespec.http.client.generator.mgmt.mapper.FluentModelMapper;

public class TypeSpecFluentModelMapper extends FluentModelMapper {
    private static final TypeSpecFluentModelMapper INSTANCE = new TypeSpecFluentModelMapper();

    public static TypeSpecFluentModelMapper getInstance() {
        return INSTANCE;
    }

    @Override
    public boolean isPlainObject(ObjectSchema compositeType) {
        return false;
    }
}
