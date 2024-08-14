// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.azure.autorest.model.clientmodel;

/**
 * The details needed to create a Manager class for the client.
 */
public class Manager {
    private String packageName;
    /**
     * The name of the service client.
     */
    private String serviceClientName;
    /**
     * The name of the service.
     */
    private String serviceName;
    private ClientMethodParameter azureTokenCredentialsParameter;
    private ClientMethodParameter httpPipelineParameter;

    /**
     * Create a new Manager with the provided properties.
     * @param packageName The package of this manager class.
     * @param serviceClientName The name of the service client.
     * @param serviceName The name of the service.
     * @param azureTokenCredentialsParameter The credentials parameter.
     * @param httpPipelineParameter The HttpPipeline parameter.
     */
    public Manager(String packageName, String serviceClientName, String serviceName, ClientMethodParameter azureTokenCredentialsParameter, ClientMethodParameter httpPipelineParameter) {
        this.packageName = packageName;
        this.serviceClientName = serviceClientName;
        this.serviceName = serviceName;
        this.azureTokenCredentialsParameter = azureTokenCredentialsParameter;
        this.httpPipelineParameter = httpPipelineParameter;
    }

    public final String getPackage() {
        return packageName;
    }

    public final String getServiceClientName() {
        return serviceClientName;
    }

    public final String getServiceName() {
        return serviceName;
    }

    public final ClientMethodParameter getAzureTokenCredentialsParameter() {
        return azureTokenCredentialsParameter;
    }

    public final ClientMethodParameter getHttpPipelineParameter() {
        return httpPipelineParameter;
    }
}
