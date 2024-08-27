// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodGroupClient;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;

import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Writes a MethodGroupClient to a JavaFile as an interface.
 */
public class MethodGroupInterfaceTemplate implements IJavaTemplate<MethodGroupClient, JavaFile> {
    private static final MethodGroupInterfaceTemplate INSTANCE = new MethodGroupInterfaceTemplate();

    private MethodGroupInterfaceTemplate() {
    }

    public static MethodGroupInterfaceTemplate getInstance() {
        return INSTANCE;
    }

    public final void write(MethodGroupClient methodGroupClient, JavaFile javaFile) {
        JavaSettings settings = JavaSettings.getInstance();
        HashSet<String> imports = new HashSet<String>();
        methodGroupClient.addImportsTo(imports, false, settings);
        javaFile.declareImport(imports);

        List<String> interfaces = methodGroupClient.getSupportedInterfaces().stream()
                .map(IType::toString).collect(Collectors.toList());
        String parentDeclaration = !interfaces.isEmpty() ? String.format(" extends %1$s", String.join(", ", interfaces)) : "";

        javaFile.javadocComment((comment) -> {
            comment.description(String.format("An instance of this class provides access to all the operations defined in %1$s.", methodGroupClient.getInterfaceName()));
        });
        javaFile.publicInterface(String.format("%1$s%2$s", methodGroupClient.getInterfaceName(), parentDeclaration), interfaceBlock ->
        {
            for (ClientMethod clientMethod : methodGroupClient.getClientMethods()) {
                Templates.getClientMethodTemplate().write(clientMethod, interfaceBlock);
            }
        });
    }
}
