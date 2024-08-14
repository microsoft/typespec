// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ConstantSchema;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * A mapper that maps a {@link ConstantSchema} to a type.
 */
public class ConstantMapper implements IMapper<ConstantSchema, IType> {
    private static final ConstantMapper INSTANCE = new ConstantMapper();
    Map<ConstantSchema, IType> parsed = new ConcurrentHashMap<>();

    private ConstantMapper() {
    }

    /**
     * Gets the global {@link ConstantMapper} instance.
     *
     * @return The global {@link ConstantMapper} instance.
     */
    public static ConstantMapper getInstance() {
        return INSTANCE;
    }

    @Override
    public IType map(ConstantSchema constantSchema) {
        if (constantSchema == null) {
            return null;
        }

        IType constantType = parsed.get(constantSchema);
        if (constantType != null) {
            return constantType;
        }

        constantType = Mappers.getSchemaMapper().map(constantSchema.getValueType());
        parsed.put(constantSchema, constantType);

        return constantType;
    }
}
