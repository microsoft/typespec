// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil;

import java.util.List;
import java.util.Set;

/**
 * The details of a ServiceClient.
 */
public class ServiceClient {
    private final String crossLanguageDefinitionId;
    /**
     * The package that this service client belongs to.
     */
    private String packageName;
    /**
     * Get the name of this client's class.
     */
    private String className;
    /**
     * Get the name of this client's interface.
     */
    private String interfaceName;
    /**
     * Get the REST API that this client will send requests to.
     */
    private Proxy proxy;
    /**
     * The MethodGroupClients that belong to this ServiceClient.
     */
    private List<MethodGroupClient> methodGroupClients;
    /**
     * The properties of this ServiceClient.
     */
    private List<ServiceClientProperty> properties;
    /**
     * The constructors for this ServiceClient.
     */
    private List<Constructor> constructors;
    /**
     * The client method overloads for this ServiceClient.
     */
    private List<ClientMethod> clientMethods;
    /**
     * The azure environment parameter.
     */
    private ClientMethodParameter azureEnvironmentParameter;
    /**
     * The default poll interval parameter.
     */
    private ClientMethodParameter defaultPollIntervalParameter;
    /**
     * The credentials parameter.
     */
    private ClientMethodParameter tokenCredentialParameter;
    /**
     * The HttpPipeline parameter.
     */
    private ClientMethodParameter httpPipelineParameter;

    private ClientMethodParameter serializerAdapterParameter;

    private String clientBaseName;

    private String defaultCredentialScopes;

    private boolean builderDisabled;
    private String builderPackageName;

    /**
     * The security configuration information.
     */
    private SecurityInfo securityInfo;

    private String baseUrl;

    private PipelinePolicyDetails pipelinePolicyDetails;

    /**
     * Create a new ServiceClient with the provided properties.
     * @param packageName The package that this service client belongs to.
     * @param className The name of the client's class.
     * @param interfaceName The name of the client's interface.
     * @param proxy The REST API that the client will send requests to.
     * @param methodGroupClients The MethodGroupClients that belong to this ServiceClient.
     * @param properties The properties of this ServiceClient
     * @param constructors The constructors for this ServiceClient.
     * @param clientMethods The client method overloads for this ServiceClient.
     * @param azureEnvironmentParameter The AzureEnvironment parameter.
     * @param tokenCredentialParameter The credentials parameter.
     * @param httpPipelineParameter The HttpPipeline parameter.
     * @param serializerAdapterParameter The SerializerAdapter parameter.
     * @param defaultPollIntervalParameter The default poll interval parameter.
     */
    protected ServiceClient(String packageName, String className, String interfaceName, Proxy proxy, List<MethodGroupClient> methodGroupClients, List<ServiceClientProperty> properties, List<Constructor> constructors, List<ClientMethod> clientMethods,
                            ClientMethodParameter azureEnvironmentParameter, ClientMethodParameter tokenCredentialParameter, ClientMethodParameter httpPipelineParameter, ClientMethodParameter serializerAdapterParameter, ClientMethodParameter defaultPollIntervalParameter, String defaultCredentialScopes,
                            boolean builderDisabled, String builderPackageName, SecurityInfo securityInfo, String baseUrl, PipelinePolicyDetails pipelinePolicyDetails, String crossLanguageDefinitionId) {
        this.packageName = packageName;
        this.className = className;
        this.interfaceName = interfaceName;
        this.proxy = proxy;
        this.methodGroupClients = methodGroupClients;
        this.properties = properties;
        this.constructors = constructors;
        this.clientMethods = clientMethods;
        this.azureEnvironmentParameter = azureEnvironmentParameter;
        this.tokenCredentialParameter = tokenCredentialParameter;
        this.httpPipelineParameter = httpPipelineParameter;
        this.serializerAdapterParameter = serializerAdapterParameter;
        this.defaultPollIntervalParameter = defaultPollIntervalParameter;
        this.clientBaseName = className.endsWith("Impl") ? className.substring(0, className.length() - 4) : className;
        this.defaultCredentialScopes = defaultCredentialScopes;
        this.builderDisabled = builderDisabled;
        this.builderPackageName = builderPackageName;
        this.securityInfo = securityInfo;
        this.baseUrl = baseUrl;
        this.pipelinePolicyDetails = pipelinePolicyDetails;
        this.crossLanguageDefinitionId = crossLanguageDefinitionId;
    }

    public final String getPackage() {
        return packageName;
    }

    public final String getClassName() {
        return className;
    }

    public final String getInterfaceName() {
        return interfaceName;
    }

    public final Proxy getProxy() {
        return proxy;
    }

    public final List<MethodGroupClient> getMethodGroupClients() {
        return methodGroupClients;
    }

    public final List<ServiceClientProperty> getProperties() {
        return properties;
    }

    public final List<Constructor> getConstructors() {
        return constructors;
    }

    public final List<ClientMethod> getClientMethods() {
        return clientMethods;
    }

    public final ClientMethodParameter getAzureEnvironmentParameter() {
        return azureEnvironmentParameter;
    }

    public final ClientMethodParameter getDefaultPollIntervalParameter() {
        return defaultPollIntervalParameter;
    }

    public final ClientMethodParameter getTokenCredentialParameter() {
        return tokenCredentialParameter;
    }

    public final ClientMethodParameter getHttpPipelineParameter() {
        return httpPipelineParameter;
    }

    public final ClientMethodParameter getSerializerAdapterParameter() {
        return serializerAdapterParameter;
    }

    public final String getClientBaseName() {
        return clientBaseName;
    }

    public final String getDefaultCredentialScopes() {
        return defaultCredentialScopes;
    }

    public final boolean isBuilderDisabled() {
        return builderDisabled;
    }

    /**
     * Gets the package name for builder and wrapper classes.
     * <p>
     * It can be {@code null}, if no specific value provided.
     * In such case, usually the package name from "namespace" option is used.
     *
     * @return the package name for builder and wrapper classes.
     */
    public String getBuilderPackageName() {
        return builderPackageName;
    }

    public SecurityInfo getSecurityInfo() {
        return securityInfo;
    }

    /**
     * @return the base URL, includes scheme, host (and maybe basePath)
     */
    public String getBaseUrl() {
        return baseUrl;
    }

    /**
     * @return the configuration for HttpPipelinePolicy
     */
    public PipelinePolicyDetails getPipelinePolicyDetails() {
        return pipelinePolicyDetails;
    }

    public String getCrossLanguageDefinitionId() {
        return crossLanguageDefinitionId;
    }

    /**
     * Add this property's imports to the provided set of imports.
     * @param imports The set of imports to add to.
     * @param includeImplementationImports Whether to include imports that are only necessary for method implementations.
     */
    public final void addImportsTo(Set<String> imports, boolean includeImplementationImports, boolean includeBuilderImports, JavaSettings settings) {
        if (!includeBuilderImports) {
            for (ClientMethod clientMethod : getClientMethods()) {
                clientMethod.addImportsTo(imports, includeImplementationImports, settings);
            }
        }

        for (ServiceClientProperty serviceClientProperty : getProperties()) {
            serviceClientProperty.addImportsTo(imports, includeImplementationImports);
        }

        if (includeImplementationImports) {
            if (settings.isFluent()) {
                ClassType.HTTP_HEADER_NAME.addImportsTo(imports, includeImplementationImports);
            }
            if (settings.isFluentPremium()) {
                imports.add("com.azure.resourcemanager.resources.fluentcore.AzureServiceClient");
            }
            if (!getClientMethods().isEmpty()) {
                addRestProxyImport(imports);
            }

            for (Constructor constructor : getConstructors()) {
                constructor.addImportsTo(imports, includeImplementationImports);
            }

            if (!settings.isGenerateClientInterfaces()) {
                for (MethodGroupClient methodGroupClient : getMethodGroupClients()) {
                    imports.add(String.format("%1$s.%2$s", methodGroupClient.getPackage(), methodGroupClient.getClassName()));
                }
            } else {
                String interfacePackage = ClientModelUtil.getServiceClientInterfacePackageName();
                imports.add(String.format("%1$s.%2$s", interfacePackage, this.getInterfaceName()));
                for (MethodGroupClient methodGroupClient : this.getMethodGroupClients()) {
                    imports.add(String.format("%1$s.%2$s", interfacePackage, methodGroupClient.getInterfaceName()));
                }
            }
        }

        if (includeBuilderImports || includeImplementationImports) {
            if (!settings.isFluent() && settings.isGenerateClientInterfaces()) {
                imports.add(String.format("%1$s.%2$s", settings.getPackage(), getInterfaceName()));
                for (MethodGroupClient methodGroupClient : getMethodGroupClients()) {
                    imports.add(String.format("%1$s.%2$s", settings.getPackage(), methodGroupClient.getInterfaceName()));
                }
            }

            addPipelineBuilderImport(imports);
            addHttpPolicyImports(imports);
        }

        if (includeBuilderImports) {
            imports.add(String.format("%1$s.%2$s", getPackage(), getClassName()));
        }

        Proxy proxy = getProxy();
        if (proxy != null) {
            proxy.addImportsTo(imports, includeImplementationImports, settings);
        }
    }

    protected void addRestProxyImport(Set<String> imports) {
        ClassType.REST_PROXY.addImportsTo(imports, false);
    }

    protected void addHttpPolicyImports(Set<String> imports) {
        if (JavaSettings.getInstance().isBranded()) {
            imports.add("com.azure.core.http.policy.RetryPolicy");
            imports.add("com.azure.core.http.policy.UserAgentPolicy");
        }
    }

    protected void addPipelineBuilderImport(Set<String> imports) {
        ClassType.HTTP_PIPELINE_BUILDER.addImportsTo(imports, false);
    }

    public static class Builder {
        protected String packageName;
        protected String className;
        protected String interfaceName;
        protected Proxy proxy;
        protected List<MethodGroupClient> methodGroupClients;
        protected List<ServiceClientProperty> properties;
        protected List<Constructor> constructors;
        protected List<ClientMethod> clientMethods;
        protected ClientMethodParameter azureEnvironmentParameter;
        protected ClientMethodParameter tokenCredentialParameter;
        protected ClientMethodParameter httpPipelineParameter;
        protected ClientMethodParameter serializerAdapterParameter;
        protected ClientMethodParameter defaultPollIntervalParameter;
        protected String defaultCredentialScopes;
        protected boolean builderDisabled;
        protected String builderPackageName;
        protected SecurityInfo securityInfo;
        protected String baseUrl;
        protected PipelinePolicyDetails pipelinePolicyDetails;
        private String crossLanguageDefinitionId;

        /**
         * Sets the package that this service client belongs to.
         * @param packageName the package that this service client belongs to
         * @return the Builder itself
         */
        public Builder packageName(String packageName) {
            this.packageName = packageName;
            return this;
        }

        /**
         * Sets the name of this client's class.
         * @param className the name of this client's class
         * @return the Builder itself
         */
        public Builder className(String className) {
            this.className = className;
            return this;
        }

        /**
         * Sets the name of this client's interface.
         * @param interfaceName the name of this client's interface
         * @return the Builder itself
         */
        public Builder interfaceName(String interfaceName) {
            this.interfaceName = interfaceName;
            return this;
        }

        /**
         * Sets the REST API that this client will send requests to.
         * @param proxy the REST API that this client will send requests to
         * @return the Builder itself
         */
        public Builder proxy(Proxy proxy) {
            this.proxy = proxy;
            return this;
        }

        /**
         * Sets the MethodGroupClients that belong to this ServiceClient.
         * @param methodGroupClients the MethodGroupClients that belong to this ServiceClient
         * @return the Builder itself
         */
        public Builder methodGroupClients(List<MethodGroupClient> methodGroupClients) {
            this.methodGroupClients = methodGroupClients;
            return this;
        }

        /**
         * Sets the properties of this ServiceClient.
         * @param properties the properties of this ServiceClient
         * @return the Builder itself
         */
        public Builder properties(List<ServiceClientProperty> properties) {
            this.properties = properties;
            return this;
        }

        /**
         * Sets the constructors for this ServiceClient.
         * @param constructors the constructors for this ServiceClient
         * @return the Builder itself
         */
        public Builder constructors(List<Constructor> constructors) {
            this.constructors = constructors;
            return this;
        }

        /**
         * Sets the client method overloads for this ServiceClient.
         * @param clientMethods the client method overloads for this ServiceClient
         * @return the Builder itself
         */
        public Builder clientMethods(List<ClientMethod> clientMethods) {
            this.clientMethods = clientMethods;
            return this;
        }

        /**
         * Sets the azure environment parameter.
         * @param azureEnvironmentParameter the azure environment
         * @return the Builder itself
         */
        public Builder azureEnvironmentParameter(ClientMethodParameter azureEnvironmentParameter) {
            this.azureEnvironmentParameter = azureEnvironmentParameter;
            return this;
        }

        /**
         * Sets the serializer adapter parameter.
         * @param serializerAdapterParameter the serializer adapter
         * @return the Builder itself
         */
        public Builder serializerAdapterParameter(ClientMethodParameter serializerAdapterParameter) {
            this.serializerAdapterParameter = serializerAdapterParameter;
            return this;
        }

        /**
         * Sets the default poll interval parameter.
         * @param defaultPollIntervalParameter the poll interval
         * @return the Builder itself
         */
        public Builder defaultPollIntervalParameter(ClientMethodParameter defaultPollIntervalParameter) {
            this.defaultPollIntervalParameter = defaultPollIntervalParameter;
            return this;
        }

        /**
         * Sets the credentials parameter.
         * @param tokenCredentialParameter the credentials parameter
         * @return the Builder itself
         */
        public Builder tokenCredentialParameter(ClientMethodParameter tokenCredentialParameter) {
            this.tokenCredentialParameter = tokenCredentialParameter;
            return this;
        }

        /**
         * Sets the HttpPipeline parameter.
         * @param httpPipelineParameter the HttpPipeline parameter
         * @return the Builder itself
         */
        public Builder httpPipelineParameter(ClientMethodParameter httpPipelineParameter) {
            this.httpPipelineParameter = httpPipelineParameter;
            return this;
        }

        /**
         * Sets the defaultCredentialScopes parameter.
         * @param defaultCredentialScopes the default credential scopes
         * @return the Builder itself
         */
        public Builder defaultCredentialScopes(String defaultCredentialScopes) {
            this.defaultCredentialScopes = defaultCredentialScopes;
            return this;
        }

        /**
         * Sets the builderDisabled parameter.
         * @param builderDisabled whether to disable ClientBuilder class
         * @return the Builder itself
         */
        public Builder builderDisabled(boolean builderDisabled) {
            this.builderDisabled = builderDisabled;
            return this;
        }

        /**
         * Sets the builderPackageName parameter.
         * @param builderPackageName the package name for builder and wrapper classes
         * @return the Builder itself
         */
        public Builder builderPackageName(String builderPackageName) {
            this.builderPackageName = builderPackageName;
            return this;
        }

        /**
         * Sets the security configuration information.
         * @param securityInfo the security configuration information
         * @return the Builder itself
         */
        public Builder securityInfo(SecurityInfo securityInfo) {
            this.securityInfo = securityInfo;
            return this;
        }

        /**
         * Sets the base URL.
         * @param baseUrl the base URL
         * @return the Builder itself
         */
        public Builder baseUrl(String baseUrl) {
            this.baseUrl = baseUrl;
            return this;
        }

        /**
         * Configures the HttpPipelinePolicy
         *
         * @param pipelinePolicyDetails the configuration of HttpPipelinePolicy
         * @return the Builder itself
         */
        public Builder pipelinePolicyDetails(PipelinePolicyDetails pipelinePolicyDetails) {
            this.pipelinePolicyDetails = pipelinePolicyDetails;
            return this;
        }

        public ServiceClient build() {
            return new ServiceClient(packageName,
                    className,
                    interfaceName,
                    proxy,
                    methodGroupClients,
                    properties,
                    constructors,
                    clientMethods,
                    azureEnvironmentParameter,
                    tokenCredentialParameter,
                    httpPipelineParameter,
                    serializerAdapterParameter,
                    defaultPollIntervalParameter,
                    defaultCredentialScopes,
                    builderDisabled,
                    builderPackageName,
                    securityInfo,
                    baseUrl,
                    pipelinePolicyDetails,
                    crossLanguageDefinitionId);
        }

        public Builder crossLanguageDefinitionId(String crossLanguageDefinitionId) {
            this.crossLanguageDefinitionId = crossLanguageDefinitionId;
            return this;
        }
    }
}
