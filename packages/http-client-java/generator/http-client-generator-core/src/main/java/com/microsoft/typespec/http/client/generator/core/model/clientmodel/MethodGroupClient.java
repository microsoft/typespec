// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil;
import com.azure.core.util.CoreUtils;

import java.util.List;
import java.util.Set;

/**
 * The details of a group of methods within a ServiceClient.
 */
public class MethodGroupClient {
    /**
     * The name of the package.
     */
    private String packageName;
    /**
     * The name of this client's class.
     */
    private String className;
    /**
     * The name of this client's interface.
     */
    private String interfaceName;
    /**
     * The interfaces that the client implements.
     */
    private List<String> implementedInterfaces;
    /**
     * The REST API that this client will send requests to.
     */
    private Proxy proxy;
    /**
     * The name of the ServiceClient that contains this MethodGroupClient.
     */
    private String serviceClientName;
    /**
     * The type of this MethodGroupClient when it is used as a variable.
     */
    private String variableType;
    /**
     * The variable name for any instances of this MethodGroupClient.
     */
    private String variableName;
    /**
     * The client method overloads for this MethodGroupClient.
     */
    private List<ClientMethod> clientMethods;
    /**
     * The interfaces that the client supports.
     */
    private List<IType> supportedInterfaces;

    private String classBaseName;

    private List<ServiceClientProperty> properties;

    /**
     * Create a new MethodGroupClient with the provided properties.
     * @param className The name of the client's class.
     * @param interfaceName The name of the client's interface.
     * @param implementedInterfaces The interfaces that the client implements.
     * @param supportedInterfaces The interfaces that the client supports.
     * @param proxy The REST API that the client will send requests to.
     * @param serviceClientName The name of the ServiceClient that contains this MethodGroupClient.
     * @param variableType The type of this MethodGroupClient when it is used as a variable.
     * @param variableName The variable name for any instances of this MethodGroupClient.
     * @param clientMethods The ClientMethods for this MethodGroupClient.
     */
    protected MethodGroupClient(
            String packageKeyword, String className, String interfaceName, List<String> implementedInterfaces,
            Proxy proxy, String serviceClientName, String variableType, String variableName,
            List<ClientMethod> clientMethods, List<IType> supportedInterfaces, String classBaseName,
            List<ServiceClientProperty> properties) {
        packageName = packageKeyword;
        this.className = className;
        this.interfaceName = interfaceName;
        this.implementedInterfaces = implementedInterfaces;
        this.supportedInterfaces = supportedInterfaces;
        this.proxy = proxy;
        this.serviceClientName = serviceClientName;
        this.variableType = variableType;
        this.variableName = variableName;
        this.clientMethods = clientMethods;
        this.classBaseName = classBaseName != null
                ? classBaseName
                : (className.endsWith("Impl") ? className.substring(0, className.length() - 4) : className);
        this.properties = properties;
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

    public final List<String> getImplementedInterfaces() {
        return implementedInterfaces;
    }

    public List<IType> getSupportedInterfaces() {
        return supportedInterfaces;
    }

    public final Proxy getProxy() {
        return proxy;
    }

    public final String getServiceClientName() {
        return serviceClientName;
    }

    public final String getVariableType() {
        return variableType;
    }

    public final String getVariableName() {
        return variableName;
    }

    public final List<ClientMethod> getClientMethods() {
        return clientMethods;
    }

    public final String getClassBaseName() {
        return classBaseName;
    }

    public List<ServiceClientProperty> getProperties() {
        return properties;
    }

    /**
     * Add this property's imports to the provided set of imports.
     * @param imports The set of imports to add to.
     * @param includeImplementationImports Whether to include imports that are only necessary for method implementations.
     */
    public final void addImportsTo(Set<String> imports, boolean includeImplementationImports, JavaSettings settings) {
        if (!settings.isFluent() && settings.isGenerateClientInterfaces()) {
            imports.add(String.format("%1$s.%2$s", settings.getPackage(), getInterfaceName()));
        }

        for (IType type : supportedInterfaces) {
            type.addImportsTo(imports, false);
        }

        if (includeImplementationImports) {
            //ClassType proxyType = settings.isAzureOrFluent() ? ClassType.AzureProxy : ClassType.RestProxy;
            ClassType proxyType = getProxyClassType();
            imports.add(proxyType.getFullName());

            if (settings.isGenerateClientInterfaces()) {
                String interfacePackage = ClientModelUtil.getServiceClientInterfacePackageName();
                imports.add(String.format("%1$s.%2$s", interfacePackage, this.getInterfaceName()));
            }
        }

        Proxy proxy = getProxy();
        if (proxy != null) {
            proxy.addImportsTo(imports, includeImplementationImports, settings);
        }

        for (ClientMethod clientMethod : getClientMethods()) {
            clientMethod.addImportsTo(imports, includeImplementationImports, settings);
        }

        if (includeImplementationImports && !CoreUtils.isNullOrEmpty(getProperties())) {
            for (ServiceClientProperty property : getProperties()) {
                property.addImportsTo(imports, includeImplementationImports);
            }
        }
    }

    protected ClassType getProxyClassType() {
        return ClassType.REST_PROXY;
    }

    public static class Builder {
        protected String packageName;
        protected String className;
        protected String interfaceName;
        protected List<String> implementedInterfaces;
        protected Proxy proxy;
        protected String serviceClientName;
        protected String variableType;
        protected String variableName;
        protected List<ClientMethod> clientMethods;
        protected List<IType> supportedInterfaces;
        protected String classBaseName;
        private List<ServiceClientProperty> properties;

        /**
         * Sets the name of the package.
         * @param packageName the name of the package
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
         * Sets the interfaces that the client implements.
         * @param implementedInterfaces the interfaces that the client implements
         * @return the Builder itself
         */
        public Builder implementedInterfaces(List<String> implementedInterfaces) {
            this.implementedInterfaces = implementedInterfaces;
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
         * Sets the name of the ServiceClient that contains this MethodGroupClient.
         * @param serviceClientName the name of the ServiceClient that contains this MethodGroupClient
         * @return the Builder itself
         */
        public Builder serviceClientName(String serviceClientName) {
            this.serviceClientName = serviceClientName;
            return this;
        }

        /**
         * Sets the type of this MethodGroupClient when it is used as a variable.
         * @param variableType the type of this MethodGroupClient when it is used as a variable
         * @return the Builder itself
         */
        public Builder variableType(String variableType) {
            this.variableType = variableType;
            return this;
        }

        /**
         * Sets the variable name for any instances of this MethodGroupClient.
         * @param variableName the variable name for any instances of this MethodGroupClient
         * @return the Builder itself
         */
        public Builder variableName(String variableName) {
            this.variableName = variableName;
            return this;
        }

        /**
         * Sets the client method overloads for this MethodGroupClient.
         * @param clientMethods the client method overloads for this MethodGroupClient
         * @return the Builder itself
         */
        public Builder clientMethods(List<ClientMethod> clientMethods) {
            this.clientMethods = clientMethods;
            return this;
        }

        /**
         * Sets the interfaces that the client supports.
         * @param supportedInterfaces the interfaces that the client supports
         * @return the Builder itself
         */
        public Builder supportedInterfaces(List<IType> supportedInterfaces) {
            this.supportedInterfaces = supportedInterfaces;
            return this;
        }

        /**
         * Sets the class base name.
         * @param classBaseName class base name.
         * @return the Builder itself
         */
        public Builder classBaseName(String classBaseName) {
            this.classBaseName = classBaseName;
            return this;
        }

        /**
         * Sets properties.
         *
         * @param properties the properties from ServiceClient.
         * @return the Builder itself
         */
        public Builder properties(List<ServiceClientProperty> properties) {
            this.properties = properties;
            return this;
        }

        public MethodGroupClient build() {
            return new MethodGroupClient(packageName,
                    className,
                    interfaceName,
                    implementedInterfaces,
                    proxy,
                    serviceClientName,
                    variableType,
                    variableName,
                    clientMethods,
                    supportedInterfaces,
                    classBaseName,
                    properties);
        }
    }
}
