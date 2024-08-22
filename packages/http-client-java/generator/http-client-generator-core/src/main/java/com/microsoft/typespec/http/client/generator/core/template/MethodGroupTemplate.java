// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodGroupClient;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ServiceClientProperty;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaBlock;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaClass;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility;
import com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil;
import com.microsoft.typespec.http.client.generator.core.util.ModelNamer;
import com.microsoft.typespec.http.client.generator.core.util.TemplateUtil;
import com.azure.core.util.CoreUtils;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Writes a MethodGroupClient to a JavaFile.
 */
public class MethodGroupTemplate implements IJavaTemplate<MethodGroupClient, JavaFile> {
    private static final MethodGroupTemplate INSTANCE = new MethodGroupTemplate();

    protected MethodGroupTemplate() {
    }

    public static MethodGroupTemplate getInstance() {
        return INSTANCE;
    }

    public final void write(MethodGroupClient methodGroupClient, JavaFile javaFile) {
        JavaSettings settings = JavaSettings.getInstance();
        Set<String> imports = new HashSet<>();
        if (settings.isUseClientLogger()) {
            ClassType.CLIENT_LOGGER.addImportsTo(imports, false);
        }

        methodGroupClient.addImportsTo(imports, true, settings);

        String serviceClientPackageName =
            ClientModelUtil.getServiceClientPackageName(methodGroupClient.getServiceClientName());
        imports.add(String.format("%1$s.%2$s", serviceClientPackageName, methodGroupClient.getServiceClientName()));

        javaFile.declareImport(imports);

        List<String> interfaces = methodGroupClient.getSupportedInterfaces().stream()
                .map(IType::toString).collect(Collectors.toList());
        interfaces.addAll(methodGroupClient.getImplementedInterfaces());
        String parentDeclaration = !interfaces.isEmpty() ? String.format(" implements %1$s", String.join(", ", interfaces)) : "";

        final JavaVisibility visibility = methodGroupClient.getPackage().equals(serviceClientPackageName)
            ? JavaVisibility.PackagePrivate
            : JavaVisibility.Public;

        javaFile.javadocComment(comment -> {
            comment.description(String.format("An instance of this class provides access to all the operations defined in %1$s.", methodGroupClient.getInterfaceName()));
        });
        javaFile.publicFinalClass(String.format("%1$s%2$s", methodGroupClient.getClassName(), parentDeclaration), classBlock ->
        {
            final boolean hasProxy = methodGroupClient.getProxy() != null;

            if (hasProxy) {
                classBlock.javadocComment("The proxy service used to perform REST calls.");
                classBlock.privateFinalMemberVariable(methodGroupClient.getProxy().getName(), "service");
            }

            classBlock.javadocComment("The service client containing this operation class.");
            classBlock.privateFinalMemberVariable(methodGroupClient.getServiceClientName(), "client");

            classBlock.javadocComment(comment ->
            {
                comment.description(String.format("Initializes an instance of %1$s.", methodGroupClient.getClassName()));
                comment.param("client", "the instance of the service client containing this operation class.");
            });
            classBlock.constructor(visibility, String.format("%1$s(%2$s client)", methodGroupClient.getClassName(), methodGroupClient.getServiceClientName()), constructor ->
            {
                if (methodGroupClient.getProxy() != null) {
                    writeServiceProxyConstruction(constructor, methodGroupClient);
                }
                constructor.line("this.client = client;");
            });

            if (!CoreUtils.isNullOrEmpty(methodGroupClient.getProperties())) {
                for (ServiceClientProperty property : methodGroupClient.getProperties()) {
                    classBlock.javadocComment(comment ->
                    {
                        comment.description(String.format("Gets %1$s", property.getDescription()));
                        comment.methodReturns(String.format("the %1$s value.", property.getName()));
                    });
                    classBlock.method(property.getMethodVisibility(), null, String.format("%1$s %2$s()",
                            property.getType(), new ModelNamer().modelPropertyGetterName(property)), function ->
                    {
                        function.methodReturn(String.format("client.%1$s()", new ModelNamer().modelPropertyGetterName(property)));
                    });
                }
            }

            if (hasProxy) {
                Templates.getProxyTemplate().write(methodGroupClient.getProxy(), classBlock);
            }

            TemplateUtil.writeClientMethodsAndHelpers(classBlock, methodGroupClient.getClientMethods());

            writeAdditionalClassBlock(classBlock);

            if (settings.isUseClientLogger()) {
                TemplateUtil.addClientLogger(classBlock, methodGroupClient.getClassName(), javaFile.getContents());
            }
        });
    }

    protected void writeAdditionalClassBlock(JavaClass classBlock) {
    }

    protected void writeServiceProxyConstruction(JavaBlock constructor, MethodGroupClient methodGroupClient) {
        ClassType proxyType = ClassType.REST_PROXY;
        if (JavaSettings.getInstance().isBranded()) {
            constructor.line(String.format("this.service = %1$s.create(%2$s.class, client.getHttpPipeline(), client.getSerializerAdapter());",
                    proxyType.getName(), methodGroupClient.getProxy().getName()));
        } else {
            constructor.line(String.format("this.service = %1$s.create(%2$s.class, client.getHttpPipeline());",
                    proxyType.getName(), methodGroupClient.getProxy().getName()));
        }
    }
}
