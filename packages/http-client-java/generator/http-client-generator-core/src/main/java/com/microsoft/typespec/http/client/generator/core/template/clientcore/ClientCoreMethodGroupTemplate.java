// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template.clientcore;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodGroupClient;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaBlock;
import com.microsoft.typespec.http.client.generator.core.template.MethodGroupTemplate;

public class ClientCoreMethodGroupTemplate extends MethodGroupTemplate {

    private static final ClientCoreMethodGroupTemplate INSTANCE = new ClientCoreMethodGroupTemplate();

    private ClientCoreMethodGroupTemplate() {

    }

    public static ClientCoreMethodGroupTemplate getInstance() {
        return INSTANCE;
    }

    @Override
    protected void writeServiceProxyConstruction(JavaBlock constructor, MethodGroupClient methodGroupClient) {
        if (JavaSettings.getInstance().useRestProxy()) {
            constructor.line(String.format("this.service = %1$s.create(%2$s.class, client.getHttpPipeline());",
                ClassType.REST_PROXY.getName(), methodGroupClient.getProxy().getName()));
        } else {
            constructor.line("this.service = %s.getNewInstance(client.getHttpPipeline());",
                methodGroupClient.getProxy().getName());
        }
    }
}
