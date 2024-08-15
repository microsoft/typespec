// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.fluent;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ObjectSchema;
import com.microsoft.typespec.http.client.generator.mgmt.mapper.FluentObjectMapper;

public class TypeSpecFluentObjectMapper extends FluentObjectMapper {
    private static final TypeSpecFluentObjectMapper INSTANCE = new TypeSpecFluentObjectMapper();
    public static TypeSpecFluentObjectMapper getInstance() {
        return INSTANCE;
    }

    @Override
    public boolean isPlainObject(ObjectSchema compositeType) {
        return false;
    }
}
