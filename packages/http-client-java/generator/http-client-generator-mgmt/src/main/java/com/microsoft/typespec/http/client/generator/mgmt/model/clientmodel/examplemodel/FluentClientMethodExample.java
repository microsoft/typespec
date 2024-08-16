// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.examplemodel;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.mgmt.model.FluentType;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.ModelNaming;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodGroupClient;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Model of example for service client method (usually for Fluent Premium).
 */
public class FluentClientMethodExample implements FluentMethodExample {

    private final String name;
    private final String originalFileName;
    private final MethodGroupClient methodGroup;
    private final ClientMethod clientMethod;
    private final List<ParameterExample> parameters = new ArrayList<>();

    public FluentClientMethodExample(String name, String originalFileName,
                                     MethodGroupClient methodGroup, ClientMethod clientMethod) {
        this.name = name;
        this.originalFileName = originalFileName;
        this.methodGroup = methodGroup;
        this.clientMethod = clientMethod;
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
        return FluentType.AZURE_RESOURCE_MANAGER;
    }

    @Override
    public String getEntryName() {
        return "azure";
    }

    @Override
    public String getEntryDescription() {
        return "The entry point for accessing resource management APIs in Azure.";
    }

    @Override
    public List<ParameterExample> getParameters() {
        return parameters;
    }

    @Override
    public String getMethodReference() {
        JavaSettings settings = JavaSettings.getInstance();

        String namespace = settings.getPackage();
        String[] identifiers = namespace.split(Pattern.quote("."));
        String lastIdentifier = identifiers[identifiers.length - 1];

        if (!MANAGER_REFERENCE.containsKey(lastIdentifier)) {
            throw new IllegalStateException("Package '" + namespace + "' is not supported by Fluent Premium");
        }

        String managerReference = MANAGER_REFERENCE.get(lastIdentifier) + "." + ModelNaming.METHOD_MANAGER + "()";
        String serviceClientReference = ModelNaming.METHOD_SERVICE_CLIENT + "()";
        if ("authorization".equals(lastIdentifier)) {
            serviceClientReference = "roleServiceClient()";
        } else if ("resources".equals(lastIdentifier)) {
            String tag = settings.getAutorestSettings().getTag();
            if (tag.contains("feature")) {
                serviceClientReference = "featureClient()";
            } else if (tag.contains("policy")) {
                serviceClientReference = "policyClient()";
            } else if (tag.contains("subscriptions")) {
                serviceClientReference = "subscriptionClient()";
            } else if (tag.contains("locks")) {
                serviceClientReference = "managementLockClient()";
            } else if (tag.contains("changes")) {
                serviceClientReference = "resourceChangeClient()";
            } else if (tag.contains("deploymentstacks")) {
                serviceClientReference = "deploymentStackClient()";
            }
        }

        String methodGroupReference =  "get" + CodeNamer.toPascalCase(methodGroup.getVariableName()) + "()";
        return managerReference + "." + serviceClientReference + "." + methodGroupReference;
    }

    @Override
    public String getMethodName() {
        return clientMethod.getName();
    }

    private final static Map<String, String> MANAGER_REFERENCE = new HashMap<>();
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
