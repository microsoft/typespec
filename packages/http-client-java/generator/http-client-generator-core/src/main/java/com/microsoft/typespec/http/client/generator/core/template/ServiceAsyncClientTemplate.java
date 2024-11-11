// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.azure.core.client.traits.EndpointTrait;
import com.azure.core.util.CoreUtils;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Annotation;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.AsyncSyncClient;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientAccessorMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientBuilder;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ConvenienceMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodGroupClient;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ServiceClient;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaClass;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaContext;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility;
import com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil;
import com.microsoft.typespec.http.client.generator.core.util.ModelNamer;
import com.microsoft.typespec.http.client.generator.core.util.TemplateUtil;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Template to create an asynchronous client.
 */
public class ServiceAsyncClientTemplate implements IJavaTemplate<AsyncSyncClient, JavaFile> {

    private static final ServiceAsyncClientTemplate INSTANCE = new ServiceAsyncClientTemplate();

    protected ServiceAsyncClientTemplate() {
    }

    public static ServiceAsyncClientTemplate getInstance() {
        return INSTANCE;
    }

    @Override
    public final void write(AsyncSyncClient asyncClient, JavaFile javaFile) {
        ServiceClient serviceClient = asyncClient.getServiceClient();

        JavaSettings settings = JavaSettings.getInstance();
        String asyncClassName = asyncClient.getClassName();
        MethodGroupClient methodGroupClient = asyncClient.getMethodGroupClient();
        final boolean wrapServiceClient = methodGroupClient == null;
        final String builderPackageName = ClientModelUtil.getServiceClientBuilderPackageName(serviceClient);
        final String builderClassName = serviceClient.getInterfaceName() + ClientModelUtil.getBuilderSuffix();
        final boolean samePackageAsBuilder = builderPackageName.equals(asyncClient.getPackageName());
        final JavaVisibility constructorVisibility
            = samePackageAsBuilder ? JavaVisibility.PackagePrivate : JavaVisibility.Public;
        ClientBuilder rootClientBuilder = getClientBuilder(asyncClient);

        Set<String> imports = new HashSet<>();
        if (wrapServiceClient) {
            serviceClient.addImportsTo(imports, true, false, settings);
            imports.add(serviceClient.getPackage() + "." + serviceClient.getClassName());
        } else {
            methodGroupClient.addImportsTo(imports, true, settings);
            imports.add(methodGroupClient.getPackage() + "." + methodGroupClient.getClassName());
        }
        imports.add(builderPackageName + "." + builderClassName);
        if (rootClientBuilder != null) {
            rootClientBuilder.addImportsTo(imports, false);
        }
        addServiceClientAnnotationImports(imports);

        for (ClientAccessorMethod clientAccessorMethod : serviceClient.getClientAccessorMethods()) {
            clientAccessorMethod.addImportsTo(imports, false);
        }

        Templates.getConvenienceAsyncMethodTemplate().addImports(imports, asyncClient.getConvenienceMethods());

        javaFile.declareImport(imports);
        javaFile.javadocComment(comment -> comment.description(String
            .format("Initializes a new instance of the asynchronous %1$s type.", serviceClient.getInterfaceName())));

        if (rootClientBuilder != null) {
            javaFile.annotation(
                String.format("ServiceClient(builder = %s.class, isAsync = true)", rootClientBuilder.getClassName()));
        }
        javaFile.publicFinalClass(asyncClassName, classBlock -> {
            // Add service client member variable
            addGeneratedAnnotation(classBlock);
            if (wrapServiceClient) {
                classBlock.privateFinalMemberVariable(serviceClient.getClassName(), "serviceClient");
            } else {
                classBlock.privateFinalMemberVariable(methodGroupClient.getClassName(), "serviceClient");
            }

            // Service Client Constructor
            classBlock.javadocComment(comment -> {
                comment
                    .description(String.format("Initializes an instance of %1$s class.", asyncClient.getClassName()));
                comment.param("serviceClient", "the service client implementation.");
            });
            addGeneratedAnnotation(classBlock);
            if (wrapServiceClient) {
                classBlock.constructor(constructorVisibility,
                    String.format("%1$s(%2$s %3$s)", asyncClassName, serviceClient.getClassName(), "serviceClient"),
                    constructorBlock -> {
                        constructorBlock.line("this.serviceClient = serviceClient;");
                    });
            } else {
                classBlock.constructor(constructorVisibility,
                    String.format("%1$s(%2$s %3$s)", asyncClassName, methodGroupClient.getClassName(), "serviceClient"),
                    constructorBlock -> {
                        constructorBlock.line("this.serviceClient = serviceClient;");
                    });
            }

            if (wrapServiceClient) {
                serviceClient.getClientMethods()
                    .stream()
                    .filter(clientMethod -> clientMethod.getMethodVisibility() == JavaVisibility.Public)
                    .filter(clientMethod -> !clientMethod.isImplementationOnly())
                    .filter(clientMethod -> clientMethod.getType().name().contains("Async"))
                    .filter(clientMethod -> !clientMethod.getMethodParameters()
                        .stream()
                        .anyMatch(methodParam -> methodParam.getWireType().contains(ClassType.CONTEXT)))
                    .forEach(clientMethod -> {
                        Templates.getWrapperClientMethodTemplate().write(clientMethod, classBlock);
                    });
            } else {
                methodGroupClient.getClientMethods()
                    .stream()
                    .filter(clientMethod -> clientMethod.getMethodVisibility() == JavaVisibility.Public)
                    .filter(clientMethod -> !clientMethod.isImplementationOnly())
                    .filter(clientMethod -> clientMethod.getType().name().contains("Async"))
                    .filter(clientMethod -> !clientMethod.getMethodParameters()
                        .stream()
                        .anyMatch(methodParam -> methodParam.getWireType().contains(ClassType.CONTEXT)))
                    .forEach(clientMethod -> {
                        Templates.getWrapperClientMethodTemplate().write(clientMethod, classBlock);
                    });
            }

            writeSubClientAccessors(serviceClient, classBlock, true);

            writeConvenienceMethods(asyncClient.getConvenienceMethods(), classBlock);

            ServiceAsyncClientTemplate.addEndpointMethod(classBlock, asyncClient.getClientBuilder(), serviceClient,
                "this.serviceClient");
        });
    }

    protected void addServiceClientAnnotationImports(Set<String> imports) {
        Annotation.SERVICE_CLIENT.addImportsTo(imports);
        Annotation.GENERATED.addImportsTo(imports);
    }

    protected void addGeneratedAnnotation(JavaContext classBlock) {
        if (JavaSettings.getInstance().isBranded()) {
            classBlock.annotation(Annotation.GENERATED.getName());
        } else {
            classBlock.annotation(Annotation.METADATA.getName() + "(generated = true)");
        }
    }

    /**
     * Adds "getEndpoint" method, if necessary.
     * <p>
     * This method is companion to "sendRequest" method. Without endpoint, the URL in sendRequest is hard to compose.
     *
     * @param classBlock the class block for writing the method.
     * @param clientBuilder the client builder.
     * @param clientReference the code for client reference. E.g. "this.serviceClient" or "this.client".
     */
    static void addEndpointMethod(JavaClass classBlock, ClientBuilder clientBuilder, ServiceClient serviceClient,
        String clientReference) {
        // expose "getEndpoint" as public, as companion to "sendRequest" method
        if (JavaSettings.getInstance().isGenerateSendRequestMethod()) {
            ClientMethod referenceClientMethod = !CoreUtils.isNullOrEmpty(serviceClient.getClientMethods())
                ? serviceClient.getClientMethods().iterator().next()
                : serviceClient.getMethodGroupClients()
                    .stream()
                    .flatMap(mg -> mg.getClientMethods().stream())
                    .findFirst()
                    .orElse(null);

            if (referenceClientMethod != null) {
                final String baseUrl = serviceClient.getBaseUrl();
                final String endpointReplacementExpr = referenceClientMethod.getProxyMethod()
                    .getParameters()
                    .stream()
                    .filter(p -> p.isFromClient() && p.getRequestParameterLocation() == RequestParameterLocation.URI)
                    .filter(p -> baseUrl.contains(String.format("{%s}", p.getRequestParameterName())))
                    .map(p -> String.format(".replace(%1$s, %2$s)",
                        ClassType.STRING.defaultValueExpression(String.format("{%s}", p.getRequestParameterName())),
                        p.getParameterReference()))
                    .collect(Collectors.joining());
                final String endpointExpr = ClassType.STRING.defaultValueExpression(baseUrl) + endpointReplacementExpr;

                clientBuilder.getBuilderTraits()
                    .stream()
                    .filter(t -> EndpointTrait.class.getSimpleName().equals(t.getTraitInterfaceName()))
                    .map(t -> t.getTraitMethods().iterator().next().getProperty())
                    .findAny()
                    .ifPresent(serviceClientProperty -> {
                        classBlock.javadocComment(comment -> {
                            comment.description("Gets the service endpoint that the client is connected to.");
                            comment.methodReturns("the service endpoint that the client is connected to.");
                        });
                        String methodName = new ModelNamer().modelPropertyGetterName(serviceClientProperty);
                        classBlock.method(serviceClientProperty.getMethodVisibility(), null,
                            String.format("%1$s %2$s()", serviceClientProperty.getType(), methodName), function -> {
                                function.methodReturn(endpointExpr);
                            });
                    });
            }
        }
    }

    /**
     * Writes the wrapper method of the accessor method for sub client.
     * <p>
     * The method invokes method in ServiceClient class.
     *
     * @param serviceClient the ServiceClient
     * @param classBlock the class block
     * @param isAsync whether the wrapper is for sync client or async client
     */
    static void writeSubClientAccessors(ServiceClient serviceClient, JavaClass classBlock, boolean isAsync) {
        // Add accessors to sub clients
        for (ClientAccessorMethod clientAccessorMethod : serviceClient.getClientAccessorMethods()) {
            List<ClientMethodParameter> methodParameters = clientAccessorMethod.getMethodParameters();
            String subClientClassName = clientAccessorMethod.getAsyncSyncClientName(isAsync);

            String serviceClientMethodCall = "serviceClient." + clientAccessorMethod.getName() + "("
                + methodParameters.stream().map(ClientMethodParameter::getName).collect(Collectors.joining(", ")) + ")";

            // expect all properties are required, so no overload
            classBlock.javadocComment(comment -> {
                comment.description("Gets an instance of " + subClientClassName + " class.");
                for (ClientMethodParameter property : methodParameters) {
                    comment.param(property.getName(), property.getDescription());
                }
                comment.methodReturns("an instance of " + subClientClassName + "class");
            });
            classBlock.publicMethod(clientAccessorMethod.getAsyncSyncClientDeclaration(isAsync), method -> {
                method.methodReturn("new " + subClientClassName + "(" + serviceClientMethodCall + ")");
            });
        }
    }

    /**
     * Gets the client builder, or finds a client builder from parent clients. It could return {@code null}.
     *
     * @param client the AsyncSyncClient
     * @return the ClientBuilder
     */
    static ClientBuilder getClientBuilder(AsyncSyncClient client) {
        if (client.getClientBuilder() != null) {
            return client.getClientBuilder();
        }
        ServiceClient serviceClient = client.getServiceClient().getParentClient();
        while (serviceClient != null) {
            if (serviceClient.getSyncClient() != null && serviceClient.getSyncClient().getClientBuilder() != null) {
                return serviceClient.getSyncClient().getClientBuilder();
            } else if (serviceClient.getAsyncClient() != null
                && serviceClient.getAsyncClient().getClientBuilder() != null) {
                return serviceClient.getAsyncClient().getClientBuilder();
            }
            serviceClient = serviceClient.getParentClient();
        }
        return null;
    }

    private void writeConvenienceMethods(List<ConvenienceMethod> convenienceMethods, JavaClass classBlock) {
        Set<GenericType> typeReferenceStaticClasses = new HashSet<>();

        convenienceMethods.forEach(
            m -> Templates.getConvenienceAsyncMethodTemplate().write(m, classBlock, typeReferenceStaticClasses));

        // static variables for TypeReference<T>
        for (GenericType typeReferenceStaticClass : typeReferenceStaticClasses) {
            addGeneratedAnnotation(classBlock);
            TemplateUtil.writeTypeReferenceStaticVariable(classBlock, typeReferenceStaticClass);
        }
    }
}
