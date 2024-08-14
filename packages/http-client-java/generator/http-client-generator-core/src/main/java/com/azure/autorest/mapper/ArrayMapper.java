// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.azure.autorest.mapper;

import com.azure.autorest.extension.base.model.codemodel.ArraySchema;
import com.azure.autorest.extension.base.plugin.JavaSettings;
import com.azure.autorest.model.clientmodel.IType;
import com.azure.autorest.model.clientmodel.IterableType;
import com.azure.autorest.model.clientmodel.ListType;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * A mapper that maps an {@link ArraySchema} to either an {@link IterableType} or {@link ListType}.
 */
public class ArrayMapper implements IMapper<ArraySchema, IType> {
    private static final ArrayMapper INSTANCE = new ArrayMapper();
    Map<ArraySchema, IType> parsed = new ConcurrentHashMap<>();

    private ArrayMapper() {
    }

    /**
     * Gets the global {@link ArrayMapper} instance.
     *
     * @return The global {@link ArrayMapper} instance.
     */
    public static ArrayMapper getInstance() {
        return INSTANCE;
    }

    @Override
    public IType map(ArraySchema sequenceType) {
        if (sequenceType == null) {
            return null;
        }

        IType arrayType = parsed.get(sequenceType);
        if (arrayType != null) {
            return arrayType;
        }

        IType mappedType = Mappers.getSchemaMapper().map(sequenceType.getElementType());

        // Choose IterableType or ListType depending on whether arrays should use Iterable.
        arrayType = JavaSettings.getInstance().isUseIterable()
            ? new IterableType(mappedType)
            : new ListType(mappedType);

        parsed.put(sequenceType, arrayType);
        return arrayType;
    }
}
