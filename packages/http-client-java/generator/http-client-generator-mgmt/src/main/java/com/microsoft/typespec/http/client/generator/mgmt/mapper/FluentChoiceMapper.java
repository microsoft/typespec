// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ChoiceSchema;
import com.microsoft.typespec.http.client.generator.core.mapper.ChoiceMapper;
import com.microsoft.typespec.http.client.generator.core.mapper.MapperUtils;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;

public class FluentChoiceMapper extends ChoiceMapper {
    private static final FluentChoiceMapper INSTANCE = new FluentChoiceMapper();
    private FluentChoiceMapper() {}

    public static FluentChoiceMapper getInstance() {
        return INSTANCE;
    }

    @Override
    public IType map(ChoiceSchema enumType) {
        return MapperUtils.createEnumType(enumType, true, false);
    }
}
