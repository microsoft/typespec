// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.azure.autorest.mapper;

import com.azure.autorest.extension.base.model.codemodel.SealedChoiceSchema;
import com.azure.autorest.model.clientmodel.IType;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class SealedChoiceMapper implements IMapper<SealedChoiceSchema, IType> {
    private static final SealedChoiceMapper INSTANCE = new SealedChoiceMapper();
    Map<SealedChoiceSchema, IType> parsed = new ConcurrentHashMap<>();

    private SealedChoiceMapper() {
    }

    public static SealedChoiceMapper getInstance() {
        return INSTANCE;
    }

    @Override
    public IType map(SealedChoiceSchema enumType) {
        if (enumType == null) {
            return null;
        }

        IType sealedChoiceType = parsed.get(enumType);
        if (sealedChoiceType != null) {
            return sealedChoiceType;
        }

        sealedChoiceType = createSealedChoiceType(enumType);
        parsed.put(enumType, sealedChoiceType);

        return sealedChoiceType;
    }

    private IType createSealedChoiceType(SealedChoiceSchema enumType) {
        return MapperUtils.createEnumType(enumType, false);
    }
}
