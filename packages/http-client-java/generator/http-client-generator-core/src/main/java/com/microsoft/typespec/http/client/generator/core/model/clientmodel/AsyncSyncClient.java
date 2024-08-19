// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import java.util.Collections;
import java.util.List;
import java.util.Set;

/**
 * An asynchronous and/or synchronous client.
 */
public class AsyncSyncClient {

    private final String className;
    private final String packageName;

    private final MethodGroupClient methodGroupClient;

    private final ServiceClient serviceClient;

    private final List<ConvenienceMethod> convenienceMethods;
    private final String crossLanguageDefinitionId;

    // There is also reference from Client to ClientBuilder via "@ServiceClient(builder = ClientBuilder.class)"
    // clientBuilder can be null, if builder is disabled via "disable-client-builder"
    private ClientBuilder clientBuilder;

    private AsyncSyncClient(String packageName, String className,
        MethodGroupClient methodGroupClient, ServiceClient serviceClient,
        List<ConvenienceMethod> convenienceMethods, String crossLanguageDefinitionId) {
        this.packageName = packageName;
        this.className = className;
        this.methodGroupClient = methodGroupClient;
        this.serviceClient = serviceClient;
        this.convenienceMethods = convenienceMethods;
        this.crossLanguageDefinitionId = crossLanguageDefinitionId;
    }

    public String getCrossLanguageDefinitionId() {
        return crossLanguageDefinitionId;
    }

    /**
     * Get the package name.
     *
     * @return the package name.
     */
    public String getPackageName() {
        return packageName;
    }

    /**
     * Get the class name.
     *
     * @return the class name.
     */
    public String getClassName() {
        return className;
    }

    /**
     * Get the method group client.
     *
     * @return the method group client.
     */
    public MethodGroupClient getMethodGroupClient() {
        return methodGroupClient;
    }

    /**
     * Get the service client.
     *
     * @return the service client.
     */
    public ServiceClient getServiceClient() {
        return serviceClient;
    }

    /**
     * Gets the list of convenience methods.
     *
     * @return the list of convenience methods.
     */
    public List<ConvenienceMethod> getConvenienceMethods() {
        return convenienceMethods;
    }

    /**
     * Adds the imports required by the client to the set of imports.
     *
     * @param imports The imports being added to.
     * @param includeImplementationImports Whether implementation imports should be included.
     */
    public void addImportsTo(Set<String> imports, boolean includeImplementationImports) {
        imports.add(packageName + "." + className);
    }

    /**
     * Gets the {@link Builder} associated with this client.
     *
     * @return The {@link Builder} associated with this client.
     */
    public ClientBuilder getClientBuilder() {
        return clientBuilder;
    }

    /**
     * Sets the {@link Builder} to associate with this client.
     *
     * @param clientBuilder The {@link Builder} to associate with this client.
     */
    public void setClientBuilder(ClientBuilder clientBuilder) {
        this.clientBuilder = clientBuilder;
    }

    /**
     * A builder that is used to create instance of {@link AsyncSyncClient}.
     */
    public static class Builder {

        private String className;
        private String packageName;

        private MethodGroupClient methodGroupClient;

        private ServiceClient serviceClient;

        private List<ConvenienceMethod> convenienceMethods = Collections.emptyList();
        private String crossLanguageDefinitionId;

        /**
         * Sets the class name.
         *
         * @param className The class name.
         * @return This builder.
         */
        public Builder className(String className) {
            this.className = className;
            return this;
        }

        /**
         * Sets the package name.
         *
         * @param packageName The package name.
         * @return This builder.
         */
        public Builder packageName(String packageName) {
            this.packageName = packageName;
            return this;
        }

        /**
         * Sets the {@link MethodGroupClient}.
         *
         * @param methodGroupClient The {@link MethodGroupClient}.
         * @return This builder.
         */
        public Builder methodGroupClient(MethodGroupClient methodGroupClient) {
            this.methodGroupClient = methodGroupClient;
            return this;
        }

        /**
         * Sets the {@link ServiceClient}.
         *
         * @param serviceClient The {@link ServiceClient}.
         * @return This builder.
         */
        public Builder serviceClient(ServiceClient serviceClient) {
            this.serviceClient = serviceClient;
            return this;
        }

        /**
         * Sets the list of {@link ConvenienceMethod ConvenienceMethods}.
         *
         * @param convenienceMethods The list of {@link ConvenienceMethod ConvenienceMethods}.
         * @return This builder.
         */
        public Builder convenienceMethods(List<ConvenienceMethod> convenienceMethods) {
            this.convenienceMethods = convenienceMethods;
            return this;
        }

        public Builder crossLanguageDefinitionId(String crossLanguageDefinitionId) {
            this.crossLanguageDefinitionId = crossLanguageDefinitionId;
            return this;
        }

        /**
         * Builds an instance of {@link AsyncSyncClient}.
         *
         * @return The instance of {@link AsyncSyncClient}.
         */
        public AsyncSyncClient build() {
            return new AsyncSyncClient(packageName, className, methodGroupClient, serviceClient, convenienceMethods, crossLanguageDefinitionId);
        }
    }
}
