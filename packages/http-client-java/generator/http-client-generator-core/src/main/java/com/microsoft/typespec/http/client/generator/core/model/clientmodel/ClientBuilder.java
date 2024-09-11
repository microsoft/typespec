// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Set;

public class ClientBuilder {

    private final String packageName;
    private final String className;
    private final ServiceClient serviceClient;

    // There is naturally ClientBuilder to Client reference, via "buildClient" method and via "@ServiceClientBuilder(serviceClients = {Client.class, AsyncClient.class})"
    // syncClients and asyncClients can be empty. In this case, ClientBuilder build serviceClient directly. Note this usually is only used for internal implementation, as this pattern does not match Java guidelines.
    private final List<AsyncSyncClient> syncClients;
    private final List<AsyncSyncClient> asyncClients;
    private final List<ClientBuilderTrait> builderTraits = new ArrayList<>();
    private String crossLanguageDefinitionId;

    public ClientBuilder(String packageName, String className,
                         ServiceClient serviceClient,
                         List<AsyncSyncClient> syncClients, List<AsyncSyncClient> asyncClients, String crossLanguageDefinitionId) {
        this.packageName = Objects.requireNonNull(packageName);
        this.className = Objects.requireNonNull(className);
        this.serviceClient = Objects.requireNonNull(serviceClient);
        this.syncClients = Objects.requireNonNull(syncClients);
        this.asyncClients = Objects.requireNonNull(asyncClients);
        this.crossLanguageDefinitionId = crossLanguageDefinitionId;
    }

    public String getPackageName() {
        return packageName;
    }

    public String getClassName() {
        return className;
    }

    public ServiceClient getServiceClient() {
        return serviceClient;
    }

    public List<AsyncSyncClient> getSyncClients() {
        return syncClients;
    }

    public List<AsyncSyncClient> getAsyncClients() {
        return asyncClients;
    }

    public String getBuilderMethodNameForSyncClient(AsyncSyncClient syncClient) {
        boolean singleClient = asyncClients.size() == 1 || syncClient.getMethodGroupClient() == null;
        return singleClient
                ? "buildClient"
                : ("build" + syncClient.getClassName());
    }

    public String getBuilderMethodNameForAsyncClient(AsyncSyncClient asyncClient) {
        boolean singleClient = asyncClients.size() == 1 || asyncClient.getMethodGroupClient() == null;
        return singleClient
                ? "buildAsyncClient"
                : ("build" + asyncClient.getClassName());
    }

    public void addImportsTo(Set<String> imports, boolean includeImplementationImports) {
        JavaSettings settings = JavaSettings.getInstance();
        imports.add(String.format("%1$s.%2$s", getPackageName(), getClassName()));
        serviceClient.addImportsTo(imports, includeImplementationImports, true, settings);
        getSyncClients().forEach(c -> c.addImportsTo(imports, includeImplementationImports));
        getAsyncClients().forEach(c -> c.addImportsTo(imports, includeImplementationImports));
    }

    public void addBuilderTrait(ClientBuilderTrait trait) {
        this.builderTraits.add(trait);
    }

    public List<ClientBuilderTrait> getBuilderTraits() {
        return this.builderTraits;
    }

    public String getCrossLanguageDefinitionId() {
        return this.crossLanguageDefinitionId;
    }
}
