// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;


import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodGroupClient;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ServiceClient;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ServiceClientProperty;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;
import com.microsoft.typespec.http.client.generator.core.util.ModelNamer;

import java.util.HashSet;

/**
 * Writes a ServiceClient to a JavaFile as an interface.
 */
public class ServiceClientInterfaceTemplate implements IJavaTemplate<ServiceClient, JavaFile> {

    private static final ServiceClientInterfaceTemplate INSTANCE = new ServiceClientInterfaceTemplate();

    private ServiceClientInterfaceTemplate() {
    }

    public static ServiceClientInterfaceTemplate getInstance() {
        return INSTANCE;
    }

    public final void write(ServiceClient serviceClient, JavaFile javaFile) {
        HashSet<String> imports = new HashSet<String>();
        serviceClient.addImportsTo(imports, false, false, JavaSettings.getInstance());
        javaFile.declareImport(imports);

        javaFile.javadocComment(comment ->
        {
            comment.description(String.format("The interface for %1$s class.", serviceClient.getInterfaceName()));
        });
        javaFile.publicInterface(serviceClient.getInterfaceName(), interfaceBlock ->
        {
            for (ServiceClientProperty property : serviceClient.getProperties()) {
                if (property.getMethodVisibility() == JavaVisibility.Public) {
                    interfaceBlock.javadocComment(comment ->
                    {
                        comment.description(String.format("Gets %1$s", property.getDescription()));
                        comment.methodReturns(String.format("the %1$s value", property.getName()));
                    });
                    interfaceBlock.publicMethod(String.format("%1$s %2$s()", property.getType(), new ModelNamer().modelPropertyGetterName(property)));

                    /* if (!property.isReadOnly()) {
                        interfaceBlock.javadocComment(comment ->
                        {
                            comment.description(String.format("Sets %1$s", property.getDescription()));
                            comment.param(property.getName(), String.format("the %1$s value", property.getName()));
                            comment.methodReturns("the service client itself");
                        });
                        interfaceBlock.publicMethod(String.format("%1$s set%2$s(%3$s %4$s)", serviceClient.getInterfaceName(), CodeNamer.toPascalCase(property.getName()), property.getType(), property.getName()));
                    } */
                }
            }

            for (MethodGroupClient methodGroupClient : serviceClient.getMethodGroupClients()) {
                interfaceBlock.javadocComment(comment ->
                {
                    comment.description(String.format("Gets the %1$s object to access its operations.", methodGroupClient.getInterfaceName()));
                    comment.methodReturns(String.format("the %1$s object.", methodGroupClient.getInterfaceName()));
                });
                interfaceBlock.publicMethod(String.format("%1$s get%2$s()", methodGroupClient.getInterfaceName(), CodeNamer.toPascalCase(methodGroupClient.getVariableName())));
            }

            for (ClientMethod clientMethod : serviceClient.getClientMethods()) {
                Templates.getClientMethodTemplate().write(clientMethod, interfaceBlock);
            }
        });
    }
}
