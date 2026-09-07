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
import java.util.Map;
import java.util.Set;

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
        JavaSettings settings = JavaSettings.getInstance();
        String namespace = settings.getPackage();
        String lastIdentifier = namespace.substring(namespace.lastIndexOf('.') + 1);

        // Guard against accidental premium code generation for non-premium libraries
        if (!SUPPORTED_PREMIUM_PACKAGES.contains(lastIdentifier)) {
            throw new IllegalStateException("Package '" + namespace + "' is not supported by Fluent Premium");
        }

        String metadataSuffix = FluentStatic.getFluentJavaSettings().getMetadataSuffix().orElse(null);
        String serviceClientReference = getServiceClientReference(lastIdentifier, metadataSuffix);
        String methodGroupReference = "get" + CodeNamer.toPascalCase(methodGroup.getVariableName()) + "()";
        return serviceClientReference + "." + methodGroupReference;
    }

    static String getServiceClientReference(String packageIdentifier, String metadataSuffix) {
        if ("authorization".equals(packageIdentifier)) {
            return "roleServiceClient()";
        }
        if ("resources".equals(packageIdentifier) && metadataSuffix != null) {
            return RESOURCE_SERVICE_CLIENT_REFERENCES.getOrDefault(metadataSuffix,
                ModelNaming.METHOD_SERVICE_CLIENT + "()");
        }
        return ModelNaming.METHOD_SERVICE_CLIENT + "()";
    }

    @Override
    public String getMethodName() {
        return clientMethod.getName();
    }

    private static final Set<String> SUPPORTED_PREMIUM_PACKAGES
        = Set.of("appservice", "authorization", "cdn", "compute", "containerinstance", "containerregistry",
            "containerservice", "cosmos", "dns", "eventhubs", "keyvault", "monitor", "msi", "network", "privatedns",
            "redis", "resources", "search", "servicebus", "sql", "storage", "trafficmanager");

    private static final Map<String, String> RESOURCE_SERVICE_CLIENT_REFERENCES = Map.of("feature", "featureClient()",
        "policy", "policyClient()", "subscription", "subscriptionClient()", "lock", "managementLockClient()", "change",
        "resourceChangeClient()", "databoundary", "dataBoundaryClient()", "deployments", "deploymentClient()");
}
