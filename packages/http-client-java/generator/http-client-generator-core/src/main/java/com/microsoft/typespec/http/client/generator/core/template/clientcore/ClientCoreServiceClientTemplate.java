// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template.clientcore;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodGroupClient;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ServiceClient;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ServiceClientProperty;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaBlock;
import com.microsoft.typespec.http.client.generator.core.template.ServiceClientTemplate;
import java.util.function.Consumer;
import java.util.stream.Collectors;

public class ClientCoreServiceClientTemplate extends ServiceClientTemplate {
    private static final ClientCoreServiceClientTemplate INSTANCE = new ClientCoreServiceClientTemplate();

    private ClientCoreServiceClientTemplate() {

    }

    public static ClientCoreServiceClientTemplate getInstance() {
        return INSTANCE;
    }

    protected void writeMaxOverloadedDataPlaneConstructorImplementation(JavaBlock constructorBlock,
        ServiceClient serviceClient, Consumer<JavaBlock> constructorParametersCodes) {
        constructorBlock.line("this.httpPipeline = httpPipeline;");
        constructorParametersCodes.accept(constructorBlock);

        for (ServiceClientProperty serviceClientProperty : serviceClient.getProperties()
            .stream()
            .filter(ServiceClientProperty::isReadOnly)
            .collect(Collectors.toList())) {
            if (serviceClientProperty.getDefaultValueExpression() != null) {
                constructorBlock.line("this.%s = %s;", serviceClientProperty.getName(),
                    serviceClientProperty.getDefaultValueExpression());
            }
        }

        for (MethodGroupClient methodGroupClient : serviceClient.getMethodGroupClients()) {
            constructorBlock.line("this.%s = new %s(this);", methodGroupClient.getVariableName(),
                methodGroupClient.getClassName());
        }

        if (serviceClient.getProxy() != null) {
            if (JavaSettings.getInstance().useRestProxy()) {
                constructorBlock.line(String.format("this.service = %1$s.create(%2$s.class, this.httpPipeline);",
                    ClassType.REST_PROXY.getName(), serviceClient.getProxy().getName()));
            } else {
                constructorBlock.line("this.service = %s.getNewInstance(this.httpPipeline);",
                    serviceClient.getProxy().getName());
            }
        }
    }
}
