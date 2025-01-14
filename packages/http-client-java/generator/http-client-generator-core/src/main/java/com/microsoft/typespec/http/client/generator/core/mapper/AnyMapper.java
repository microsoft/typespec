// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.AnySchema;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;

/**
 * A mapper that maps an {@link AnySchema} to {@link ClassType#OBJECT}, always.
 */
public class AnyMapper implements IMapper<AnySchema, IType> {

    private static final AnyMapper INSTANCE = new AnyMapper();

    protected AnyMapper() {
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
        if (JavaSettings.getInstance().isUseObjectForUnknown()) {
            return ClassType.OBJECT;
        } else {
            return ClassType.BINARY_DATA;
        }
    }
}
