// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.examplemodel;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodGroupClient;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentStatic;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.ModelNaming;
import com.microsoft.typespec.http.client.generator.mgmt.util.FluentUtils;
import java.util.ArrayList;
import java.util.List;

/**
 * Model of example for service client method (usually for Fluent Premium).
 */
public class FluentClientMethodExample implements FluentMethodExample {

    private final String name;
    private final String originalFileName;
    private final MethodGroupClient methodGroup;
    private final ClientMethod clientMethod;
    private final List<ParameterExample> parameters = new ArrayList<>();
    private final ClassType managerType;

    public FluentClientMethodExample(String name, String originalFileName, MethodGroupClient methodGroup,
        ClientMethod clientMethod) {
        this.name = name;
        this.originalFileName = originalFileName;
        this.methodGroup = methodGroup;
        this.clientMethod = clientMethod;

        String clientName = FluentStatic.getClient().getServiceClient().getClientBaseName();
        String serviceName = FluentUtils.getServiceName(clientName);
        JavaSettings settings = JavaSettings.getInstance();
        this.managerType = new ClassType.Builder().packageName(settings.getPackage())
            .name(CodeNamer.toPascalCase(serviceName) + "Manager")
            .build();
    }

    public MethodGroupClient getMethodGroup() {
        return methodGroup;
    }

    public ClientMethod getClientMethod() {
        return clientMethod;
    }

    @Override
    public String getName() {
        return name;
    }

    @Override
    public String getOriginalFileName() {
        return originalFileName;
    }

    @Override
    public ClassType getEntryType() {
        return managerType;
    }

    @Override
    public String getEntryName() {
        return "manager";
    }

    @Override
    public String getEntryDescription() {
        return String.format("Entry point to %1$s.", managerType.getName());
    }

    @Override
    public List<ParameterExample> getParameters() {
        return parameters;
    }

    @Override
    public String getMethodReference() {
        String serviceClientReference = ModelNaming.METHOD_SERVICE_CLIENT + "()";
        String methodGroupReference = "get" + CodeNamer.toPascalCase(methodGroup.getVariableName()) + "()";
        return serviceClientReference + "." + methodGroupReference;
    }

    @Override
    public String getMethodName() {
        return clientMethod.getName();
    }

}
