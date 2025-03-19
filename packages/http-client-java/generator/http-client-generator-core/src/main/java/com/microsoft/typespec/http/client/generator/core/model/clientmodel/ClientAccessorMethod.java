// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
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

    private List<ClientMethodParameter> clientMethodParameters;

    /**
     * Initializes the ClientAccessorMethod.
     *
     * @param subClient the ServiceClient of the sub client
     */
    public ClientAccessorMethod(ServiceClient subClient) {
        this.subClient = subClient;
    }

    /**
     * Sets the ServiceClient containing this accessor method.
     *
     * @param serviceClient the ServiceClient containing this accessor method
     */
    public void setServiceClient(ServiceClient serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * Gets the ServiceClient containing this accessor method.
     *
     * @return the ServiceClient containing this accessor method
     */
    public ServiceClient getServiceClient() {
        return serviceClient;
    }

    /**
     * Gets the sub ServiceClient.
     *
     * @return the sub ServiceClient
     */
    public ServiceClient getSubClient() {
        return subClient;
    }

    /**
     * Gets the ServiceClient properties that should be on accessor method signature.
     *
     * @return the method parameters for accessor method parameters.
     */
    public List<ClientMethodParameter> getMethodParameters() {
        if (clientMethodParameters == null) {
            clientMethodParameters = new ArrayList<>();
            for (ServiceClientProperty property : subClient.getProperties()) {
                String name = property.getName();
                if (serviceClient.getProperties().stream().noneMatch(p -> name.equals(p.getName()))) {
                    ClientMethodParameter methodParameter
                        = new ClientMethodParameter.Builder().description(property.getDescription())
                            .finalParameter(false)
                            .wireType(property.getType())
                            .name(property.getName())
                            .required(property.isRequired())
                            .constant(false)
                            .fromClient(true)
                            .build();
                    clientMethodParameters.add(methodParameter);
                }
            }
        }
        return clientMethodParameters;
    }

    public void addImportsTo(Set<String> imports, boolean includeImplementationImports) {
        JavaSettings settings = JavaSettings.getInstance();

        subClient.addImportsTo(imports, false, false, settings);

        // wrapper classes
        if (subClient.getSyncClient() != null) {
            subClient.getSyncClient().addImportsTo(imports, false);
        }
        if (subClient.getAsyncClient() != null) {
            subClient.getAsyncClient().addImportsTo(imports, false);
        }

        // properties
        for (ServiceClientProperty property : subClient.getProperties()) {
            property.addImportsTo(imports, false);
        }
    }

    /**
     * Gets the method name for ServiceClient.
     *
     * @return the method name for ServiceClient
     */
    public String getName() {
        return "get" + subClient.getClientBaseName();
    }

    /**
     * Gets the method declaration for ServiceClient.
     *
     * @return the method declaration for ServiceClient
     */
    public String getDeclaration() {
        String subClientClassName = subClient.getClassName();
        List<ClientMethodParameter> additionalProperties = this.getMethodParameters();

        return subClientClassName + " " + getName() + "("
            + additionalProperties.stream()
                .map(p -> p.getClientType() + " " + p.getName())
                .collect(Collectors.joining(", "))
            + ")";
    }

    /**
     * Gets the client class name of AsyncSyncClient.
     *
     * @param isAsync whether it is sync client or async client
     * @return the client class name of AsyncSyncClient
     */
    public String getAsyncSyncClientName(boolean isAsync) {
        return isAsync ? subClient.getAsyncClient().getClassName() : subClient.getSyncClient().getClassName();
    }

    /**
     * Gets the method declaration for AsyncSyncClient.
     *
     * @param isAsync whether it is sync client or async client
     * @return the method declaration for AsyncSyncClient
     */
    public String getAsyncSyncClientDeclaration(boolean isAsync) {
        String subClientClassName = getAsyncSyncClientName(isAsync);
        List<ClientMethodParameter> additionalProperties = this.getMethodParameters();

        return subClientClassName + " get" + subClientClassName + "( "
            + additionalProperties.stream()
                .map(p -> p.getClientType() + " " + p.getName())
                .collect(Collectors.joining(", "))
            + ")";
    }
}
