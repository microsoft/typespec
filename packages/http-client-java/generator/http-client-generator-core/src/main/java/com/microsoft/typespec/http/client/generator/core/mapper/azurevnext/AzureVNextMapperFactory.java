// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper.azurevnext;

import com.microsoft.typespec.http.client.generator.core.mapper.PomMapper;
import com.microsoft.typespec.http.client.generator.core.mapper.clientcore.ClientCoreMapperFactory;

public class AzureVNextMapperFactory extends ClientCoreMapperFactory {

    @Override
    public PomMapper getPomMapper() {
        return AzureVNextPomMapper.getInstance();
    }
}
