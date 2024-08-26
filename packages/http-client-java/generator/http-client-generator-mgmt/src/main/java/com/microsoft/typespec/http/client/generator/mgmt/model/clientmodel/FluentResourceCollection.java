// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.mgmt.model.WellKnownMethodName;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.create.ResourceCreate;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.delete.ResourceDelete;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.get.ResourceRefresh;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.update.ResourceUpdate;
import com.microsoft.typespec.http.client.generator.mgmt.util.FluentUtils;
import com.microsoft.typespec.http.client.generator.mgmt.util.Utils;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodGroupClient;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility;
import com.microsoft.typespec.http.client.generator.core.template.prototype.MethodTemplate;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Model for Azure resource collection.
 */
// Fluent resource collection API. E.g. StorageAccounts.
public class FluentResourceCollection {

    // implementation client. E.g. StorageAccountsClientImpl.
    private final MethodGroupClient groupClient;

    // class type for inner client. E.g. StorageAccountsClient (which is a layer over StorageAccountsClientImpl).
    private final ClassType innerClientType;

    // class type for interface and implementation
    private final ClassType interfaceType;
    private final ClassType implementationType;

    // API methods
    private final List<FluentCollectionMethod> methods = new ArrayList<>();

    // resource models
    private final List<ResourceCreate> resourceCreates = new ArrayList<>();
    private final List<ResourceUpdate> resourceUpdates = new ArrayList<>();
    private final List<ResourceRefresh> resourceRefreshes = new ArrayList<>();
    private final List<ResourceDelete> resourceDeletes = new ArrayList<>();
    private final List<MethodTemplate> additionalMethods = new ArrayList<>();

    public FluentResourceCollection(MethodGroupClient groupClient) {
        JavaSettings settings = JavaSettings.getInstance();

        this.groupClient = groupClient;

        String baseClassName = CodeNamer.getPlural(groupClient.getClassBaseName());

        this.interfaceType = new ClassType.Builder()
            .packageName(settings.getPackage(settings.getModelsSubpackage()))
            .name(baseClassName)
            .build();
        this.implementationType = new ClassType.Builder()
            .packageName(settings.getPackage(settings.getImplementationSubpackage()))
            .name(baseClassName + ModelNaming.COLLECTION_IMPL_SUFFIX)
            .build();

        this.innerClientType = new ClassType.Builder()
            .packageName(settings.getPackage(settings.getFluentSubpackage()))
            .name(groupClient.getInterfaceName())
            .build();

        Set<String> existingMethodNames = this.groupClient.getClientMethods().stream()
            .filter(m -> !m.isImplementationOnly() && m.getMethodVisibility() == JavaVisibility.Public)
            .map(ClientMethod::getName)
            .collect(Collectors.toSet());

        for (ClientMethod clientMethod : this.groupClient.getClientMethods()) {
            if (clientMethod.isImplementationOnly() || clientMethod.getMethodVisibility() != JavaVisibility.Public) {
                continue;
            }

            ClientMethodType methodType = clientMethod.getType();
            boolean isSyncMethod = (methodType == ClientMethodType.SimpleSync
                || methodType == ClientMethodType.PagingSync
                || methodType == ClientMethodType.LongRunningSync
                || methodType == ClientMethodType.SimpleSyncRestResponse);
//            boolean isAsyncMethod = (methodType == ClientMethodType.SimpleAsync
//                || methodType == ClientMethodType.PagingAsync
//                || methodType == ClientMethodType.LongRunningAsync
//                || methodType == ClientMethodType.SimpleAsyncRestResponse);

            if (!isSyncMethod /*&& (!isAsyncMethod && FluentStatic.getFluentJavaSettings().isGenerateAsyncMethods())*/) {
                continue;
            }

            // map "delete" in client to "deleteByResourceGroup" in collection
            String methodName = clientMethod.getName();
            List<ClientMethodParameter> methodParameters = clientMethod.getMethodParameters();

            FluentCollectionMethod fluentMethod;
            if (WellKnownMethodName.DELETE.getMethodName().equals(methodName)
                && (methodType == ClientMethodType.SimpleSync || methodType == ClientMethodType.LongRunningSync)
                && !existingMethodNames.contains(WellKnownMethodName.DELETE_BY_RESOURCE_GROUP.getMethodName())
                && methodParameters.size() == 2
                && methodParameters.get(0).getClientType() == ClassType.STRING
                && methodParameters.get(1).getClientType() == ClassType.STRING) {
                // Transform "delete(String, String)" into "deleteByResourceGroup(String, String)"
                fluentMethod = new FluentCollectionMethod(clientMethod, WellKnownMethodName.DELETE_BY_RESOURCE_GROUP.getMethodName());
                existingMethodNames.add(fluentMethod.getMethodName());
            } else if ((WellKnownMethodName.DELETE.getMethodName() + Utils.METHOD_POSTFIX_WITH_RESPONSE).equals(methodName)
                && methodType == ClientMethodType.SimpleSyncRestResponse
                && !existingMethodNames.contains(WellKnownMethodName.DELETE_BY_RESOURCE_GROUP.getMethodName() + Utils.METHOD_POSTFIX_WITH_RESPONSE)
                && methodParameters.size() == 3
                && methodParameters.get(0).getClientType() == ClassType.STRING
                && methodParameters.get(1).getClientType() == ClassType.STRING) {
                // Transform "deleteWithResponse(String, String, ?)" into "deleteByResourceGroupWithResponse(String, String, ?)"
                fluentMethod = new FluentCollectionMethod(clientMethod, WellKnownMethodName.DELETE_BY_RESOURCE_GROUP.getMethodName() + Utils.METHOD_POSTFIX_WITH_RESPONSE);
                existingMethodNames.add(fluentMethod.getMethodName());
            } else {
                fluentMethod = new FluentCollectionMethod(clientMethod);
            }

            this.methods.add(fluentMethod);
        }
    }

    public MethodGroupClient getInnerGroupClient() {
        return groupClient;
    }

    public ClassType getInterfaceType() {
        return interfaceType;
    }

    public ClassType getImplementationType() {
        return implementationType;
    }

    public List<FluentCollectionMethod> getMethodsForTemplate() {
        List<FluentCollectionMethod> fluentMethods = new ArrayList<>(methods);

        Set<FluentCollectionMethod> excludeMethods = new HashSet<>();
        excludeMethods.addAll(this.getResourceCreates().stream().flatMap(rc -> rc.getMethodReferences().stream()).collect(Collectors.toSet()));
        excludeMethods.addAll(this.getResourceUpdates().stream().flatMap(ru -> ru.getMethodReferences().stream()).collect(Collectors.toSet()));
        fluentMethods.removeAll(excludeMethods);

        return fluentMethods;
    }

    public List<FluentCollectionMethod> getMethods() {
        return this.methods;
    }

    public String getDescription() {
        return String.format("Resource collection API of %s.", interfaceType.getName());
    }

    public ClassType getInnerClientType() {
        return innerClientType;
    }

    // method signature for inner client
    public String getInnerMethodSignature() {
        return String.format("%1$s %2$s()", this.getInnerClientType().getName(), FluentUtils.getGetterName(ModelNaming.METHOD_SERVICE_CLIENT));
    }

    public List<ResourceCreate> getResourceCreates() {
        return resourceCreates;
    }

    public List<ResourceUpdate> getResourceUpdates() {
        return resourceUpdates;
    }

    public List<ResourceRefresh> getResourceGets() {
        return resourceRefreshes;
    }

    public List<ResourceDelete> getResourceDeletes() {
        return resourceDeletes;
    }

    public List<MethodTemplate> getAdditionalMethods() {
        return additionalMethods;
    }

    public void addImportsTo(Set<String> imports, boolean includeImplementationImports) {
        innerClientType.addImportsTo(imports, false);

        this.getMethods().forEach(m -> m.addImportsTo(imports, includeImplementationImports));

        if (includeImplementationImports) {
            interfaceType.addImportsTo(imports, false);
        }

        additionalMethods.forEach(m -> m.addImportsTo(imports));
    }
}
