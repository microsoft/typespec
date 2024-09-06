// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper.android;

import com.microsoft.typespec.http.client.generator.core.mapper.ModelMapper;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.android.AndroidClientModel;

public class AndroidModelMapper extends ModelMapper {
    private static final ModelMapper INSTANCE = new AndroidModelMapper();

    protected AndroidModelMapper() {
    }

    public static ModelMapper getInstance() {
        return INSTANCE;
    }

    @Override
    protected ClientModel.Builder createModelBuilder() {
        return new AndroidClientModel.Builder();
    }
}
