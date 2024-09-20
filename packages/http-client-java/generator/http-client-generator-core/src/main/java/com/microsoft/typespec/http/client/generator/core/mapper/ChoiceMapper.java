// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ChoiceSchema;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.EnumType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * A mapper that maps a {@link ChoiceSchema} to an {@link EnumType}.
 */
public class ChoiceMapper implements IMapper<ChoiceSchema, IType> {
    private static final ChoiceMapper INSTANCE = new ChoiceMapper();
    Map<ChoiceSchema, IType> parsed = new ConcurrentHashMap<>();

    protected ChoiceMapper() {
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
        return MapperUtils.createEnumType(enumType, true, true);
    }
}
