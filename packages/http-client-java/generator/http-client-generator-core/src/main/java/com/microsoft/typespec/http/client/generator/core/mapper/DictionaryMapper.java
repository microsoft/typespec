// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.DictionarySchema;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MapType;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class DictionaryMapper implements IMapper<DictionarySchema, IType> {
    private static final DictionaryMapper INSTANCE = new DictionaryMapper();
    Map<DictionarySchema, IType> parsed = new ConcurrentHashMap<>();

    private DictionaryMapper() {
    }

    public static DictionaryMapper getInstance() {
        return INSTANCE;
    }

    @Override
    public IType map(DictionarySchema dictionaryType) {
        if (dictionaryType == null) {
            return null;
        }

        IType dictType = parsed.get(dictionaryType);
        if (dictType != null) {
            return dictType;
        }

        IType elementType = Mappers.getSchemaMapper().map(dictionaryType.getElementType());
        boolean elementNullable = dictionaryType.getNullableItems() != null && dictionaryType.getNullableItems();
        if (elementNullable) {
            elementType = elementType.asNullable();
        }
        dictType = new MapType(elementType, elementNullable);
        parsed.put(dictionaryType, dictType);

        return dictType;
    }
}
