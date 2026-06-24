// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mapper;

import com.microsoft.typespec.http.client.generator.core.mapper.DefaultMapperFactory;
import com.microsoft.typespec.http.client.generator.core.mapper.MethodGroupMapper;

public class AzureDataPlaneMapperFactory extends DefaultMapperFactory {

    @Override
    public MethodGroupMapper getMethodGroupMapper() {
        return AzureDataPlaneMethodGroupMapper.getInstance();
    }
}
