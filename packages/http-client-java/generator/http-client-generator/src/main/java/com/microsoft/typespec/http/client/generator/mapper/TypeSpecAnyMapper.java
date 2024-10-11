// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.AnySchema;
import com.microsoft.typespec.http.client.generator.core.mapper.AnyMapper;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;

public class TypeSpecAnyMapper extends AnyMapper {

    private static final AnyMapper INSTANCE = new TypeSpecAnyMapper();

    protected TypeSpecAnyMapper() {
    }

    /**
     * Gets the global {@link AnyMapper} instance.
     *
     * @return The global {@link AnyMapper} instance.
     */
    public static AnyMapper getInstance() {
        return INSTANCE;
    }

    @Override
    public IType map(AnySchema anySchema) {
        return ClassType.BINARY_DATA;
    }
}
