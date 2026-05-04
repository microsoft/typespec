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
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
        if (!MANAGER_REFERENCE.containsKey(lastIdentifier)) {
            throw new IllegalStateException("Package '" + namespace + "' is not supported by Fluent Premium");
        }

        String serviceClientReference = ModelNaming.METHOD_SERVICE_CLIENT + "()";
        String methodGroupReference = "get" + CodeNamer.toPascalCase(methodGroup.getVariableName()) + "()";
        return serviceClientReference + "." + methodGroupReference;
    }

    @Override
    public String getMethodName() {
        return clientMethod.getName();
    }

    private static final Map<String, String> MANAGER_REFERENCE = new HashMap<>();
    static {
        MANAGER_REFERENCE.put("appplatform", "springServices()");
        MANAGER_REFERENCE.put("appservice", "webApps()");
        MANAGER_REFERENCE.put("authorization", "accessManagement().roleAssignments()");
        MANAGER_REFERENCE.put("cdn", "cdnProfiles()");
        MANAGER_REFERENCE.put("compute", "virtualMachines()");
        MANAGER_REFERENCE.put("containerinstance", "containerGroups()");
        MANAGER_REFERENCE.put("containerregistry", "containerRegistries()");
        MANAGER_REFERENCE.put("containerservice", "kubernetesClusters()");
        MANAGER_REFERENCE.put("cosmos", "cosmosDBAccounts()");
        MANAGER_REFERENCE.put("dns", "dnsZones()");
        MANAGER_REFERENCE.put("eventhubs", "eventHubs()");
        MANAGER_REFERENCE.put("keyvault", "vaults()");
        MANAGER_REFERENCE.put("monitor", "diagnosticSettings()");
        MANAGER_REFERENCE.put("msi", "identities()");
        MANAGER_REFERENCE.put("network", "networks()");
        MANAGER_REFERENCE.put("privatedns", "privateDnsZones()");
        MANAGER_REFERENCE.put("redis", "redisCaches()");
        MANAGER_REFERENCE.put("resources", "genericResources()");
        MANAGER_REFERENCE.put("search", "searchServices()");
        MANAGER_REFERENCE.put("servicebus", "serviceBusNamespaces()");
        MANAGER_REFERENCE.put("sql", "sqlServers()");
        MANAGER_REFERENCE.put("storage", "storageAccounts()");
        MANAGER_REFERENCE.put("trafficmanager", "trafficManagerProfiles()");
    }
}
