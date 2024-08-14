// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import java.util.Collections;
import java.util.List;

/**
 * A container for the types associated for accessing a specific service.
 */
public class Client {
    private final String crossLanguageDefinitionId;

    /**
     * The name of this service client.
     */
    private String clientName;
    /**
     * The description of this service.
     */
    private String clientDescription;
    /**
     * Get the enum types that are used by this service.
     */
    private List<EnumType> enums;
    /**
     * Get the exception types that are used by this service.
     */
    private List<ClientException> exceptions;
    /**
     * Get the XML sequence wrappers that are used by this service.
     */
    private List<XmlSequenceWrapper> xmlSequenceWrappers;
    /**
     * Get the response models which contain the response status code, headers and body for each service method.
     */
    private List<ClientResponse> responseModels;
    /**
     * Get the model types that are used by this service.
     */
    private List<ClientModel> models;
    /**
     * Get the package infos.
     */
    private List<PackageInfo> packageInfos;
    /**
     * Get the manager for this service.
     */
    private Manager manager;
    /**
     * The serviceClient for this service.
     */
    private ServiceClient serviceClient;
    private List<ServiceClient> serviceClients;
    /**
     * Get the module info.
     */
    private ModuleInfo moduleInfo;
    private final List<AsyncSyncClient> syncClients;

    private final List<AsyncSyncClient> asyncClients;
    private final List<ClientBuilder> clientBuilders;
    private final List<ProtocolExample> protocolExamples;
    private final List<LiveTests> liveTests;
    private final List<UnionModel> unionModels;
    private final List<ClientMethodExample> clientMethodExamples;
    private final GraalVmConfig graalVmConfig;

    /**
     * Create a new Client with the provided values.
     * @param clientName The name of the service client.
     * @param clientDescription The description of the service client.
     * @param enums The enum types that are used by the client.
     * @param exceptions The exception types that are used by the client.
     * @param xmlSequenceWrappers the xml wrapper types that are used by the client.
     * @param responseModels the models for response.
     * @param models the client models that are used by the client.
     * @param packageInfos the package-info classes that are used by the client.
     * @param manager the manager class that is used by the client.
     * @param serviceClient the service client that is used by the client.
     * @param moduleInfo the module-info.
     * @param syncClients sync service clients.
     * @param asyncClients async service clients.
     * @param clientBuilders service client builders.
     * @param protocolExamples examples for DPG.
     */
    private Client(String clientName, String clientDescription, List<EnumType> enums, List<ClientException> exceptions,
                   List<XmlSequenceWrapper> xmlSequenceWrappers, List<ClientResponse> responseModels,
                   List<ClientModel> models, List<PackageInfo> packageInfos, Manager manager,
                   ServiceClient serviceClient, List<ServiceClient> serviceClients, ModuleInfo moduleInfo,
                   List<AsyncSyncClient> syncClients, List<AsyncSyncClient> asyncClients,
                   List<ClientBuilder> clientBuilders, List<ProtocolExample> protocolExamples,
                   List<LiveTests> liveTests, List<UnionModel> unionModels, List<ClientMethodExample> clientMethodExamples, String crossLanguageDefinitionId,
                   GraalVmConfig graalVmConfig
    ) {
        this.clientName = clientName;
        this.clientDescription = clientDescription;
        this.enums = enums;
        this.exceptions = exceptions;
        this.xmlSequenceWrappers = xmlSequenceWrappers;
        this.responseModels = responseModels;
        this.models = models;
        this.packageInfos = packageInfos;
        this.manager = manager;
        this.serviceClient = serviceClient;
        this.serviceClients = serviceClients;
        this.moduleInfo = moduleInfo;
        this.syncClients = syncClients;
        this.asyncClients = asyncClients;
        this.clientBuilders = clientBuilders;
        this.protocolExamples = protocolExamples;
        this.liveTests = liveTests;
        this.unionModels = unionModels;
        this.clientMethodExamples = clientMethodExamples;
        this.crossLanguageDefinitionId = crossLanguageDefinitionId;
        this.graalVmConfig = graalVmConfig;
    }

    public String getCrossLanguageDefinitionId() {
        return crossLanguageDefinitionId;
    }

    public final String getClientName() {
        return clientName;
    }

    public final String getClientDescription() {
        return clientDescription;
    }

    public final List<EnumType> getEnums() {
        return enums;
    }

    public final List<ClientException> getExceptions() {
        return exceptions;
    }

    public final List<XmlSequenceWrapper> getXmlSequenceWrappers() {
        return xmlSequenceWrappers;
    }

    public final List<ClientResponse> getResponseModels() {
        return responseModels;
    }

    public final List<ClientModel> getModels() {
        return models;
    }

    public final List<PackageInfo> getPackageInfos() {
        return packageInfos;
    }

    public final ModuleInfo getModuleInfo() {
        return moduleInfo;
    }

    public final Manager getManager() {
        return manager;
    }

    public final ServiceClient getServiceClient() {
        return serviceClient;
    }

    public final List<ServiceClient> getServiceClients() {
        return serviceClients;
    }

    /** @return the sync service clients */
    public List<AsyncSyncClient> getSyncClients() {
        return syncClients;
    }

    /** @return the async service clients */
    public List<AsyncSyncClient> getAsyncClients() {
        return asyncClients;
    }

    /** @return the service client builders */
    public List<ClientBuilder> getClientBuilders() {
        return clientBuilders;
    }

    /** @return the examples for DPG */
    public List<ProtocolExample> getProtocolExamples() {
        return protocolExamples;
    }

    /** @return the live tests */
    public List<LiveTests> getLiveTests() {
        return liveTests;
    }

    public List<UnionModel> getUnionModels() {
        return unionModels;
    }

    /** @return the examples for vanilla client methods */
    public List<ClientMethodExample> getClientMethodExamples() {
        return clientMethodExamples;
    }

    /** @return the Graal VM config */
    public GraalVmConfig getGraalVmConfig() {
        return graalVmConfig;
    }

    public static class Builder {
        private String clientName;
        private String clientDescription;
        private List<EnumType> enums;
        private List<ClientException> exceptions;
        private List<XmlSequenceWrapper> xmlSequenceWrappers;
        private List<ClientResponse> responseModels;
        private List<ClientModel> models;
        private List<PackageInfo> packageInfos;
        private Manager manager;
        private ServiceClient serviceClient;
        private List<ServiceClient> serviceClients = Collections.emptyList();
        private ModuleInfo moduleInfo;
        private List<AsyncSyncClient> syncClients = Collections.emptyList();
        private List<AsyncSyncClient> asyncClients = Collections.emptyList();
        private List<ClientBuilder> clientBuilders = Collections.emptyList();
        private List<ProtocolExample> protocolExamples = Collections.emptyList();
        private List<LiveTests> liveTests = Collections.emptyList();
        private List<UnionModel> unionModels = Collections.emptyList();
        private List<ClientMethodExample> clientMethodExamples = Collections.emptyList();
        private GraalVmConfig graalVmConfig;
        private String crossLanguageDefinitionId;


        public Builder crossLanguageDefinitionId(String crossLanguageDefinitionId) {
            this.crossLanguageDefinitionId = crossLanguageDefinitionId;
            return this;
        }

        /**
         * Sets the name of this service client.
         * @param clientName the name of this service client
         * @return the Builder itself
         */
        public Builder clientName(String clientName) {
            this.clientName = clientName;
            return this;
        }

        /**
         * Sets the description of this service.
         * @param clientDescription the description of this service
         * @return the Builder itself
         */
        public Builder clientDescription(String clientDescription) {
            this.clientDescription = clientDescription;
            return this;
        }

        /**
         * Sets the enum types that are used by this service.
         * @param enums the enum types that are used by this service
         * @return the Builder itself
         */
        public Builder enums(List<EnumType> enums) {
            this.enums = enums;
            return this;
        }

        /**
         * Sets the exception types that are used by this service.
         * @param exceptions the exception types that are used by this service
         * @return the Builder itself
         */
        public Builder exceptions(List<ClientException> exceptions) {
            this.exceptions = exceptions;
            return this;
        }

        /**
         * Sets the XML sequence wrappers that are used by this service.
         * @param xmlSequenceWrappers the XML sequence wrappers that are used by this service
         * @return the Builder itself
         */
        public Builder xmlSequenceWrappers(List<XmlSequenceWrapper> xmlSequenceWrappers) {
            this.xmlSequenceWrappers = xmlSequenceWrappers;
            return this;
        }

        /**
         * Sets the response models which contain the response status code, headers and body for each service method.
         * @param responseModels the response models which contain the response status code, headers and body for each service method
         * @return the Builder itself
         */
        public Builder responseModels(List<ClientResponse> responseModels) {
            this.responseModels = responseModels;
            return this;
        }

        /**
         * Sets the model types that are used by this service.
         * @param models the model types that are used by this service
         * @return the Builder itself
         */
        public Builder models(List<ClientModel> models) {
            this.models = models;
            return this;
        }

        public Builder unionModels(List<UnionModel> unionModels) {
            this.unionModels = unionModels;
            return this;
        }

        /**
         * Sets the package infos.
         * @param packageInfos the package infos
         * @return the Builder itself
         */
        public Builder packageInfos(List<PackageInfo> packageInfos) {
            this.packageInfos = packageInfos;
            return this;
        }

        /**
         * Sets the manager for this service.
         * @param manager the manager for this service
         * @return the Builder itself
         */
        public Builder manager(Manager manager) {
            this.manager = manager;
            return this;
        }

        /**
         * Sets the serviceClient for this service.
         * @param serviceClient the serviceClient for this service
         * @return the Builder itself
         */
        public Builder serviceClient(ServiceClient serviceClient) {
            this.serviceClient = serviceClient;
            return this;
        }

        public Builder serviceClients(List<ServiceClient> serviceClients) {
            this.serviceClients = serviceClients;
            return this;
        }

        /**
         * Sets the module info for this client.
         * @param moduleInfo the module info
         * @return the Builder itself
         */
        public Builder moduleInfo(ModuleInfo moduleInfo) {
            this.moduleInfo = moduleInfo;
            return this;
        }

        /**
         * Sets the module info for this client.
         * @param syncClients the sync service clients
         * @return the Builder itself
         */
        public Builder syncClients(List<AsyncSyncClient> syncClients) {
            this.syncClients = syncClients;
            return this;
        }

        /**
         * Sets the module info for this client.
         * @param asyncClients async service clients
         * @return the Builder itself
         */
        public Builder asyncClients(List<AsyncSyncClient> asyncClients) {
            this.asyncClients = asyncClients;
            return this;
        }

        /**
         * Sets the module info for this client.
         * @param clientBuilders the service client builders
         * @return the Builder itself
         */
        public Builder clientBuilders(List<ClientBuilder> clientBuilders) {
            this.clientBuilders = clientBuilders;
            return this;
        }

        /**
         * Sets the examples for this client.
         * @param protocolExamples the examples for DPG
         * @return the Builder itself
         */
        public Builder protocolExamples(List<ProtocolExample> protocolExamples) {
            this.protocolExamples = protocolExamples;
            return this;
        }

        /**
         * Sets the client method examples for this client.
         * @param clientMethodExamples the examples for vanilla client methods
         * @return the Builder itself
         */
        public Builder clientMethodExamples(List<ClientMethodExample> clientMethodExamples) {
            this.clientMethodExamples = clientMethodExamples;
            return this;
        }

        /**
         * Sets the live tests for this client.
         * @param liveTests live tests
         * @return the Builder itself
         */
        public Builder liveTests(List<LiveTests> liveTests) {
            this.liveTests = liveTests;
            return this;
        }

        public Builder graalVmConfig(GraalVmConfig graalVmConfig) {
            this.graalVmConfig = graalVmConfig;
            return this;
        }

        public Client build() {
            if (serviceClient == null && !serviceClients.isEmpty()) {
                serviceClient = serviceClients.iterator().next();
            }
            return new Client(clientName,
                    clientDescription,
                    enums,
                    exceptions,
                    xmlSequenceWrappers,
                    responseModels,
                    models,
                    packageInfos,
                    manager,
                    serviceClient,
                    serviceClients,
                    moduleInfo,
                    syncClients,
                    asyncClients,
                    clientBuilders,
                    protocolExamples,
                    liveTests,
                    unionModels,
                    clientMethodExamples,
                    crossLanguageDefinitionId,
                    graalVmConfig
                );
        }
    }
}
