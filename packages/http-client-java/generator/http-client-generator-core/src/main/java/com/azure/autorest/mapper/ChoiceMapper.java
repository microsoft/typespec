// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.azure.autorest.mapper;

import com.azure.autorest.extension.base.model.codemodel.ChoiceSchema;
import com.azure.autorest.model.clientmodel.EnumType;
import com.azure.autorest.model.clientmodel.IType;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * A mapper that maps a {@link ChoiceSchema} to an {@link EnumType}.
 */
public class ChoiceMapper implements IMapper<ChoiceSchema, IType> {
    private static final ChoiceMapper INSTANCE = new ChoiceMapper();
    Map<ChoiceSchema, IType> parsed = new ConcurrentHashMap<>();

    private ChoiceMapper() {
    }

    /**
     * Gets the global {@link ChoiceMapper} instance.
     *
     * @return The global {@link ChoiceMapper} instance.
     */
    public static ChoiceMapper getInstance() {
        return INSTANCE;
    }

    @Override
    public IType map(ChoiceSchema enumType) {
        if (enumType == null) {
            return null;
        }

        IType choiceType = parsed.get(enumType);
        if (choiceType != null) {
            return choiceType;
        }

        choiceType = createChoiceType(enumType);
        parsed.put(enumType, choiceType);

        return choiceType;
    }

    private IType createChoiceType(ChoiceSchema enumType) {
        return MapperUtils.createEnumType(enumType, true);
    }
}
