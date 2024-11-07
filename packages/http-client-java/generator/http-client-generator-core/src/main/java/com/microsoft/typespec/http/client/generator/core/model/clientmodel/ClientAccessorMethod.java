// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Class containing the details of a client accessor method.
 */
public class ClientAccessorMethod {

    private final ServiceClient subClient;

    // serviceClient is guaranteed to be set
    private ServiceClient serviceClient;

    /**
     * Initializes the ClientAccessorMethod
     *
     * @param subClient the ServiceClient of the sub client
     */
    public ClientAccessorMethod(ServiceClient subClient) {
        this.subClient = subClient;
    }

    /**
     * Sets the ServiceClient
     *
     * @param serviceClient the ServiceClient containing this accessor method
     */
    public void setServiceClient(ServiceClient serviceClient) {
        this.serviceClient = serviceClient;
    }

    public List<ServiceClientProperty> getAccessorProperties() {
        List<ServiceClientProperty> additionalProperties = new ArrayList<>();
        for (ServiceClientProperty property : subClient.getProperties()) {
            String name = property.getName();
            if (serviceClient.getProperties().stream().noneMatch(p -> name.equals(p.getName()))) {
                additionalProperties.add(property);
            }
        }
        return additionalProperties;
    }

    public void addImportsTo(Set<String> imports, boolean includeImplementationImports) {
        JavaSettings settings = JavaSettings.getInstance();

        subClient.addImportsTo(imports, false, false, settings);

        // wrapper classes
        final String packageName = ClientModelUtil.getAsyncSyncClientPackageName(subClient);
        final String subClientAsyncClassName = getAsyncSyncClientName(true);
        final String subClientClassName = getAsyncSyncClientName(false);
        imports.add(packageName + "." + subClientClassName);
        imports.add(packageName + "." + subClientAsyncClassName);

        // properties
        for (ServiceClientProperty property : subClient.getProperties()) {
            property.addImportsTo(imports, false);
        }
    }

    public String getDeclaration() {
        return null;
    }

    public String getAsyncSyncClientName(boolean isAsync) {
        return isAsync
            ? ClientModelUtil.clientNameToAsyncClientName(subClient.getClientBaseName())
            : subClient.getClientBaseName();
    }

    public String getAsyncSyncClientDeclaration(boolean isAsync) {
        String subClientClassName = getAsyncSyncClientName(isAsync);
        List<ServiceClientProperty> additionalProperties = this.getAccessorProperties();

        return subClientClassName + " get" + subClientClassName + "( "
            + additionalProperties.stream().map(p -> p.getType() + " " + p.getName()).collect(Collectors.joining(", "))
            + ")";
    }
}
