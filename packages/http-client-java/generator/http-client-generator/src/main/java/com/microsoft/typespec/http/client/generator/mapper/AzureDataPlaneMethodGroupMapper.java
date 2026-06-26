// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Client;
import com.microsoft.typespec.http.client.generator.core.mapper.MethodGroupMapper;
import com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil;
import com.microsoft.typespec.http.client.generator.core.util.SchemaUtil;

/**
 * Mapper entry point for Azure data-plane method group customizations.
 */
public class AzureDataPlaneMethodGroupMapper extends MethodGroupMapper {
    private static final AzureDataPlaneMethodGroupMapper INSTANCE = new AzureDataPlaneMethodGroupMapper();

    protected AzureDataPlaneMethodGroupMapper() {
        super();
    }

    public static AzureDataPlaneMethodGroupMapper getInstance() {
        return INSTANCE;
    }

    @Override
    protected String getServiceClientName(Client client) {
        // TypeSpec will not automatically append "Client" to the service client name.
        String baseName = SchemaUtil.getJavaName(client);
        return ClientModelUtil.getClientImplementClassName(baseName);
    }
}
