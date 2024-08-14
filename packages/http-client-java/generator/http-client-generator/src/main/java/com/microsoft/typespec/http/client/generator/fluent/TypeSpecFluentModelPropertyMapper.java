// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.fluent;

import com.azure.autorest.extension.base.model.codemodel.ObjectSchema;
import com.azure.autorest.mapper.ModelPropertyMapper;

public class TypeSpecFluentModelPropertyMapper extends ModelPropertyMapper {
    private static final TypeSpecFluentModelPropertyMapper INSTANCE = new TypeSpecFluentModelPropertyMapper();

    public static TypeSpecFluentModelPropertyMapper getInstance() {
        return INSTANCE;
    }

    @Override
    public boolean isPlainObject(ObjectSchema compositeType) {
        return false;
    }
}
