// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.mapper;

import com.microsoft.typespec.http.client.generator.core.mapper.SealedChoiceMapper;

public class FluentSealedChoiceMapper extends SealedChoiceMapper {
    private static final FluentSealedChoiceMapper INSTANCE = new FluentSealedChoiceMapper();

    private FluentSealedChoiceMapper() {
    }

    public static FluentSealedChoiceMapper getInstance() {
        return INSTANCE;
    }

    @Override
    protected boolean useCodeModelNameForEnumMember() {
        return false;
    }
}
