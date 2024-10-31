// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.mapper;

import com.microsoft.typespec.http.client.generator.core.mapper.ChoiceMapper;

public class FluentChoiceMapper extends ChoiceMapper {
    private static final FluentChoiceMapper INSTANCE = new FluentChoiceMapper();

    private FluentChoiceMapper() {
    }

    public static FluentChoiceMapper getInstance() {
        return INSTANCE;
    }

    @Override
    protected boolean useCodeModelNameForEnumMember() {
        return false;
    }
}
