package com.microsoft.typespec.http.client.generator.core.template.clientcore;

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
        constructor.line("this.service = %s.getNewInstance(client.getHttpPipeline());",
            methodGroupClient.getProxy().getName());
    }
}
