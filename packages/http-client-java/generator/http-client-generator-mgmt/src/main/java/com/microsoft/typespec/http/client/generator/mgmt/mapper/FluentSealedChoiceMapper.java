// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SealedChoiceSchema;
import com.microsoft.typespec.http.client.generator.core.mapper.MapperUtils;
import com.microsoft.typespec.http.client.generator.core.mapper.SealedChoiceMapper;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;

public class FluentSealedChoiceMapper extends SealedChoiceMapper {
    private static final FluentSealedChoiceMapper INSTANCE = new FluentSealedChoiceMapper();
    private FluentSealedChoiceMapper() {}

    public static FluentSealedChoiceMapper getInstance() {
        return INSTANCE;
    }

    @Override
    public IType map(SealedChoiceSchema enumType) {
        return MapperUtils.createEnumType(enumType, false, false);
    }
}
