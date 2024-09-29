// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Client;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentClient;

public class FluentMapperAccessor {

    private final FluentMapper fluentMapper;

    public FluentMapperAccessor(FluentMapper fluentMapper) {
        this.fluentMapper = fluentMapper;
    }

    public FluentClient basicMap(CodeModel codeModel, Client client) {
        return fluentMapper.basicMap(codeModel, client);
    }
}
