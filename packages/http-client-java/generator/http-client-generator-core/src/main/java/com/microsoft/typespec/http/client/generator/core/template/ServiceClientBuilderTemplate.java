// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.Javagen;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.PluginLogger;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Annotation;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.AsyncSyncClient;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientBuilder;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientBuilderTrait;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientBuilderTraitMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PipelinePolicyDetails;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PrimitiveType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.SecurityInfo;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ServiceClient;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ServiceClientProperty;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaBlock;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaClass;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaContext;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility;
import com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;
import com.microsoft.typespec.http.client.generator.core.util.TemplateUtil;
import com.azure.core.http.HttpPipelinePosition;
import com.azure.core.http.policy.AddDatePolicy;
import com.azure.core.http.policy.AddHeadersFromContextPolicy;
import com.azure.core.http.policy.AddHeadersPolicy;
import com.azure.core.http.policy.AzureKeyCredentialPolicy;
import com.azure.core.http.policy.BearerTokenAuthenticationPolicy;
import com.azure.core.http.policy.HttpLoggingPolicy;
import com.azure.core.http.policy.HttpPolicyProviders;
import com.azure.core.http.policy.RequestIdPolicy;
import com.azure.core.util.CoreUtils;
import org.slf4j.Logger;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Writes a ServiceClient to a JavaFile.
 */
public class ServiceClientBuilderTemplate implements IJavaTemplate<ClientBuilder, JavaFile> {

    private final Logger logger = new PluginLogger(Javagen.getPluginInstance(), ServiceClientBuilderTemplate.class);

    private static final String LOCAL_VARIABLE_PREFIX = "local";
    private static final ServiceClientBuilderTemplate INSTANCE = new ServiceClientBuilderTemplate();

    private static final String JACKSON_SERIALIZER = "JacksonAdapter.createDefaultSerializerAdapter()";

    protected ServiceClientBuilderTemplate() {
    }

    public static ServiceClientBuilderTemplate getInstance() {
        return INSTANCE;
    }

    public final void write(ClientBuilder clientBuilder, JavaFile javaFile) {
        JavaSettings settings = JavaSettings.getInstance();
        ServiceClient serviceClient = clientBuilder.getServiceClient();
        String serviceClientBuilderName = clientBuilder.getClassName();

        ArrayList<ServiceClientProperty> commonProperties = addCommonClientProperties(settings, serviceClient.getSecurityInfo());

        String buildReturnType;
        if (!settings.isFluent() && settings.isGenerateClientInterfaces()) {
            buildReturnType = serviceClient.getInterfaceName();
        } else {
            buildReturnType = serviceClient.getClassName();
        }

        Set<String> imports = new HashSet<>();
        serviceClient.addImportsTo(imports, false, true, settings);
        commonProperties.forEach(p -> p.addImportsTo(imports, false));
        imports.add("java.util.List");
        imports.add("java.util.Map");
        imports.add("java.util.HashMap");
        imports.add("java.util.ArrayList");
        ClassType.HTTP_HEADERS.addImportsTo(imports, false);
        ClassType.HTTP_HEADER_NAME.addImportsTo(imports, false);
        imports.add("java.util.Objects");
        if (settings.isUseClientLogger()) {
            ClassType.CLIENT_LOGGER.addImportsTo(imports, false);
        }
        addServiceClientBuilderAnnotationImport(imports);
        addHttpPolicyImports(imports);
        addImportForCoreUtils(imports);
        addSerializerImport(imports, settings);
        addGeneratedImport(imports);
        addTraitsImports(clientBuilder, imports);

        List<AsyncSyncClient> asyncClients = clientBuilder.getAsyncClients();
        List<AsyncSyncClient> syncClients = clientBuilder.getSyncClients();

        StringBuilder builderTypes = new StringBuilder();
        builderTypes.append("{");
        if (JavaSettings.getInstance().isGenerateSyncAsyncClients()) {
            List<AsyncSyncClient> clients = new ArrayList<>(syncClients);
            if (!settings.isFluentLite()) {
                clients.addAll(asyncClients);
            }
            boolean first = true;
            for (AsyncSyncClient client : clients) {
                if (first) {
                    first = false;
                } else {
                    builderTypes.append(", ");
                }
                builderTypes.append(client.getClassName()).append(".class");

                client.addImportsTo(imports, false);
            }
        } else {
            builderTypes.append(serviceClient.getClassName()).append(".class");
        }
        builderTypes.append("}");
        javaFile.declareImport(imports);

        javaFile.javadocComment(comment -> {
            String clientTypeName = settings.isFluent() ? serviceClient.getClassName() : serviceClient.getInterfaceName();
            if (settings.isGenerateBuilderPerClient() && clientBuilder.getSyncClients().size() == 1) {
                clientTypeName = clientBuilder.getSyncClients().iterator().next().getClassName();
            }
            comment.description(String.format("A builder for creating a new instance of the %1$s type.", clientTypeName));
        });

        javaFile.annotation(String.format("ServiceClientBuilder(serviceClients = %1$s)", builderTypes));
        String classDefinition = serviceClientBuilderName;

        if (!settings.isAzureOrFluent() && !CoreUtils.isNullOrEmpty(clientBuilder.getBuilderTraits())) {
            String serviceClientBuilderGeneric = "<" + serviceClientBuilderName + ">";

            String interfaces = clientBuilder.getBuilderTraits().stream()
                    .map(trait -> trait.getTraitInterfaceName() + serviceClientBuilderGeneric)
                    .collect(Collectors.joining(", "));

            classDefinition = serviceClientBuilderName + " implements " + interfaces;
        }

        javaFile.publicFinalClass(classDefinition, classBlock ->
        {
            if (!settings.isAzureOrFluent()) {
                // sdk name
                addGeneratedAnnotation(classBlock);
                classBlock.privateStaticFinalVariable("String SDK_NAME = \"name\"");

                // sdk version
                addGeneratedAnnotation(classBlock);
                classBlock.privateStaticFinalVariable("String SDK_VERSION = \"version\"");

                // default scope
                Set<String> scopes = serviceClient.getSecurityInfo() != null ? serviceClient.getSecurityInfo().getScopes() : null;
                if (scopes != null && !scopes.isEmpty()) {
                    addGeneratedAnnotation(classBlock);
                    classBlock.privateStaticFinalVariable(String.format("String[] DEFAULT_SCOPES = new String[] {%s}",
                            String.join(", ", scopes)));
                }

                if (settings.isBranded()) {
                    // properties for sdk name and version
                    String propertiesValue = "new HashMap<>()";
                    String artifactId = ClientModelUtil.getArtifactId();
                    if (!CoreUtils.isNullOrEmpty(artifactId)) {
                        propertiesValue = "CoreUtils.getProperties" + "(\"" + artifactId + ".properties\")";
                    }
                    addGeneratedAnnotation(classBlock);
                    classBlock.privateStaticFinalVariable(String.format("Map<String, String> PROPERTIES = %s", propertiesValue));

                    addGeneratedAnnotation(classBlock);
                    classBlock.privateFinalMemberVariable("List<HttpPipelinePolicy>", "pipelinePolicies");

                    // constructor
                    classBlock.javadocComment(String.format("Create an instance of the %s.", serviceClientBuilderName));
                    addGeneratedAnnotation(classBlock);
                    classBlock.publicConstructor(String.format("%1$s()", serviceClientBuilderName), javaBlock -> {
                        javaBlock.line("this.pipelinePolicies = new ArrayList<>();");
                    });
                } else {
                    addGeneratedAnnotation(classBlock);
                    classBlock.privateFinalMemberVariable("List<HttpPipelinePolicy>", "pipelinePolicies");

                    classBlock.javadocComment(String.format("Create an instance of the %s.", serviceClientBuilderName));
                    addGeneratedAnnotation(classBlock);
                    classBlock.publicConstructor(String.format("%1$s()", serviceClientBuilderName), javaBlock -> {
                        javaBlock.line("this.pipelinePolicies = new ArrayList<>();");
                    });
                }
            }

            Stream<ServiceClientProperty> serviceClientPropertyStream = serviceClient.getProperties().stream()
                    .filter(p -> !p.isReadOnly());
            if (!settings.isAzureOrFluent()) {
                addTraitMethods(clientBuilder, settings, serviceClientBuilderName, classBlock);
                serviceClientPropertyStream = serviceClientPropertyStream
                        .filter(property -> !(clientBuilder.getBuilderTraits().stream()
                        .flatMap(trait -> trait.getTraitMethods().stream().filter(traitMethod -> traitMethod.getProperty() != null))
                        .anyMatch(traitMethod -> property.getName().equals(traitMethod.getProperty().getName()))));
            }

            // Add ServiceClient client property variables, getters, and setters
            List<ServiceClientProperty> clientProperties = Stream
                    .concat(serviceClientPropertyStream,
                            commonProperties.stream()).collect(Collectors.toList());

            for (ServiceClientProperty serviceClientProperty : clientProperties) {
                classBlock.blockComment(comment -> {
                    comment.line(serviceClientProperty.getDescription());
                });
                addGeneratedAnnotation(classBlock);
                String propertyVariableInit = String.format("%1$s%2$s %3$s",
                        serviceClientProperty.isReadOnly() ? "final " : "",
                        serviceClientProperty.getType(),
                        serviceClientProperty.getName());
                if (serviceClientProperty.getDefaultValueExpression() != null
                        && serviceClientProperty.getType() instanceof PrimitiveType) {
                    // init to default value
                    propertyVariableInit += String.format(" = %1$s", serviceClientProperty.getDefaultValueExpression());
                }
                classBlock.privateMemberVariable(propertyVariableInit);

                if (!serviceClientProperty.isReadOnly()) {
                    classBlock.javadocComment(comment ->
                    {
                        comment.description(String.format("Sets %1$s", serviceClientProperty.getDescription()));
                        comment.param(serviceClientProperty.getName(), String.format("the %1$s value.", serviceClientProperty.getName()));
                        comment.methodReturns(String.format("the %1$s", serviceClientBuilderName));
                    });
                    addGeneratedAnnotation(classBlock);
                    classBlock.publicMethod(String.format("%1$s %2$s(%3$s %4$s)", serviceClientBuilderName,
                            CodeNamer.toCamelCase(serviceClientProperty.getAccessorMethodSuffix()), serviceClientProperty.getType(),
                            serviceClientProperty.getName()), function ->
                    {
                        function.line(String.format("this.%1$s = %2$s;", serviceClientProperty.getName(), serviceClientProperty.getName()));
                        function.methodReturn("this");
                    });
                }
            }

            String buildMethodName = this.primaryBuildMethodName(settings);

            JavaVisibility visibility = settings.isGenerateSyncAsyncClients() ? JavaVisibility.Private : JavaVisibility.Public;

            // build method
            classBlock.javadocComment(comment -> {
                comment.description(String.format("Builds an instance of %1$s with the provided parameters", buildReturnType));
                comment.methodReturns(String.format("an instance of %1$s", buildReturnType));
            });
            addGeneratedAnnotation(classBlock);
            classBlock.method(visibility, null, String.format("%1$s %2$s()", buildReturnType, buildMethodName), function -> {
                if (!settings.isAzureOrFluent()) {
                    function.line("this.validateClient();");
                }

                List<ServiceClientProperty> allProperties = mergeClientPropertiesWithTraits(
                    clientProperties,
                    settings.isAzureOrFluent() ? null : clientBuilder.getBuilderTraits());

                for (ServiceClientProperty serviceClientProperty : allProperties) {
                    if (serviceClientProperty.getDefaultValueExpression() != null
                            && !(serviceClientProperty.getType() instanceof PrimitiveType)) {
                        function.line(String.format("%1$s %2$s = (%3$s != null) ? %4$s : %5$s;",
                                serviceClientProperty.getType(),
                                getLocalBuildVariableName(serviceClientProperty.getName()),
                                serviceClientProperty.getName(),
                                serviceClientProperty.getName(),
                                serviceClientProperty.getDefaultValueExpression()));
                    }
                }

                // additional service client properties in constructor arguments
                String constructorArgs = serviceClient.getProperties().stream()
                        .filter(p -> !p.isReadOnly())
                        .map(this::getClientConstructorArgName)
                        .collect(Collectors.joining(", "));
                if (!constructorArgs.isEmpty()) {
                    constructorArgs = ", " + constructorArgs;
                }

                final String serializerExpression;
                if (settings.isDataPlaneClient()) {
                    serializerExpression = JACKSON_SERIALIZER;
                } else {
                    serializerExpression = getLocalBuildVariableName(getSerializerMemberName());
                }

                if (!settings.isBranded()) {
                    if (constructorArgs != null && !constructorArgs.isEmpty()) {
                        function.line(String.format("%1$s client = new %2$s(%3$s%4$s);",
                                serviceClient.getClassName(), serviceClient.getClassName(),
                                getLocalBuildVariableName("pipeline"), constructorArgs));
                    } else {
                        function.line(String.format("%1$s client = new %1$s(%2$s);", serviceClient.getClassName(), getLocalBuildVariableName("pipeline")));
                    }
                } else if (settings.isFluent()) {
                    function.line(String.format("%1$s client = new %2$s(%3$s, %4$s, %5$s, %6$s%7$s);",
                            serviceClient.getClassName(),
                            serviceClient.getClassName(),
                            getLocalBuildVariableName("pipeline"),
                            serializerExpression,
                            getLocalBuildVariableName("defaultPollInterval"),
                            getLocalBuildVariableName("environment"),
                            constructorArgs));
                } else {
                    function.line(String.format("%1$s client = new %2$s(%3$s, %4$s%5$s);",
                            serviceClient.getClassName(), serviceClient.getClassName(),
                            getLocalBuildVariableName("pipeline"), serializerExpression, constructorArgs));
                }
                function.line("return client;");
            });

            if (!settings.isAzureOrFluent()) {
                List<ServiceClientProperty> allProperties = mergeClientPropertiesWithTraits(clientProperties, clientBuilder.getBuilderTraits());
                addValidateClientMethod(classBlock, allProperties);

                addCreateHttpPipelineMethod(settings, classBlock, serviceClient.getDefaultCredentialScopes(), serviceClient.getSecurityInfo(), serviceClient.getPipelinePolicyDetails());
            }

            if (JavaSettings.getInstance().isGenerateSyncAsyncClients()) {
                if (!settings.isFluentLite()) {
                    addBuildAsyncClientMethods(clientBuilder, asyncClients, classBlock, buildMethodName);
                }
                addBuildSyncClientMethods(clientBuilder, asyncClients, syncClients, classBlock, buildMethodName);
            }
            TemplateUtil.addClientLogger(classBlock, serviceClientBuilderName, javaFile.getContents());
        });
    }

    private static List<ServiceClientProperty> mergeClientPropertiesWithTraits(
        List<ServiceClientProperty> clientProperties, List<ClientBuilderTrait> builderTraits) {

        List<ServiceClientProperty> allProperties = new ArrayList<>();
        if (builderTraits != null) {
            allProperties.addAll(builderTraits
                    .stream()
                    .flatMap(trait -> trait.getTraitMethods().stream())
                    .map(ClientBuilderTraitMethod::getProperty)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList()));
        }
        allProperties.addAll(clientProperties);
        return allProperties;
    }

    private void addBuildAsyncClientMethods(ClientBuilder clientBuilder, List<AsyncSyncClient> asyncClients, JavaClass classBlock, String buildMethodName) {
        for (AsyncSyncClient asyncClient : asyncClients) {
            final boolean wrapServiceClient = asyncClient.getMethodGroupClient() == null;

            classBlock.javadocComment(comment ->
            {
                comment.description(String
                        .format("Builds an instance of %1$s class", asyncClient.getClassName()));
                comment.methodReturns(String.format("an instance of %1$s", asyncClient.getClassName()));
            });
            addGeneratedAnnotation(classBlock);
            classBlock.publicMethod(String.format("%1$s %2$s()", asyncClient.getClassName(), clientBuilder.getBuilderMethodNameForAsyncClient(asyncClient)),
                    function -> {
                        if (wrapServiceClient) {
                            function.line("return new %1$s(%2$s());", asyncClient.getClassName(), buildMethodName);
                        } else {
                            function.line("return new %1$s(%2$s().get%3$s());", asyncClient.getClassName(), buildMethodName,
                                    CodeNamer.toPascalCase(asyncClient.getMethodGroupClient().getVariableName()));
                        }
                    });
        }
    }

    private void addBuildSyncClientMethods(ClientBuilder clientBuilder, List<AsyncSyncClient> asyncClients, List<AsyncSyncClient> syncClients, JavaClass classBlock, String buildMethodName) {
        int syncClientIndex = 0;
        for (AsyncSyncClient syncClient : syncClients) {
            final boolean wrapServiceClient = syncClient.getMethodGroupClient() == null;

            AsyncSyncClient asyncClient = (asyncClients.size() == syncClients.size()) ? asyncClients.get(syncClientIndex) : null;

            classBlock.javadocComment(comment ->
            {
                comment.description(String
                        .format("Builds an instance of %1$s class", syncClient.getClassName()));
                comment.methodReturns(String.format("an instance of %1$s", syncClient.getClassName()));
            });
            addGeneratedAnnotation(classBlock);
            classBlock.publicMethod(String.format("%1$s %2$s()", syncClient.getClassName(), clientBuilder.getBuilderMethodNameForSyncClient(syncClient)),
                    function -> {
                        writeSyncClientBuildMethod(syncClient, asyncClient, function, buildMethodName, wrapServiceClient);
                    });

            ++syncClientIndex;
        }
    }

    /**
     * Renames the provided variable name to localize it to the method
     * @param baseName The base variable name.
     * @return The name of the local variable.
     */
    private String getLocalBuildVariableName(String baseName) {
        return LOCAL_VARIABLE_PREFIX + CodeNamer.toPascalCase(baseName);
    }

    private String getClientConstructorArgName(ServiceClientProperty property) {
        if (property.getDefaultValueExpression() != null
                && !(property.getType() instanceof PrimitiveType)) {
            return getLocalBuildVariableName((property.getName()));
        }
        return "this." + property.getName();
    }

    private void addTraitMethods(ClientBuilder clientBuilder, JavaSettings settings, String serviceClientBuilderName, JavaClass classBlock) {
        clientBuilder.getBuilderTraits().stream().flatMap(trait -> trait.getTraitMethods().stream())
                .forEach(traitMethod -> {
                    ServiceClientProperty serviceClientProperty = traitMethod.getProperty();
                    if (serviceClientProperty != null) {
                        classBlock.blockComment(comment -> {
                            comment.line(serviceClientProperty.getDescription());
                        });
                        addGeneratedAnnotation(classBlock);
                        classBlock.privateMemberVariable(String.format("%1$s%2$s %3$s",
                                serviceClientProperty.isReadOnly() ? "final " : "",
                                serviceClientProperty.getType(),
                                serviceClientProperty.getName()));
                    }
                    classBlock.javadocComment(comment -> comment.description(traitMethod.getDocumentation()));
                    addGeneratedAnnotation(classBlock);
                    addOverrideAnnotation(classBlock);
                    classBlock.publicMethod(String.format("%1$s %2$s(%3$s %4$s)", serviceClientBuilderName,
                            traitMethod.getMethodName(), traitMethod.getMethodParamType(),
                            traitMethod.getMethodParamName()), traitMethod.getMethodImpl());
                });
    }

    /**
     * Extension to write sync client build method invocation
     *
     * @param syncClient the sync client
     * @param asyncClient the async client
     * @param function the method block to write method invocation
     * @param buildMethodName the name of build method
     * @param wrapServiceClient whether the sync client wraps a service client implementation or method group implementation
     */
    protected void writeSyncClientBuildMethod(AsyncSyncClient syncClient, AsyncSyncClient asyncClient, JavaBlock function,
                                              String buildMethodName, boolean wrapServiceClient) {
        JavaSettings settings = JavaSettings.getInstance();
        boolean syncClientWrapAsync = settings.isSyncClientWrapAsyncClient()
                && settings.isDataPlaneClient()
                && asyncClient != null;
        if (syncClientWrapAsync) {
            writeSyncClientBuildMethodFromAsyncClient(syncClient, asyncClient, function, buildMethodName, wrapServiceClient);
        } else {
            writeSyncClientBuildMethodFromInnerClient(syncClient, function, buildMethodName, wrapServiceClient);
        }
    }

    protected void writeSyncClientBuildMethodFromInnerClient(AsyncSyncClient syncClient, JavaBlock function,
                                                             String buildMethodName, boolean wrapServiceClient) {
        if (wrapServiceClient) {
            function.line("return new %1$s(%2$s());", syncClient.getClassName(), buildMethodName);
        } else {
            function.line("return new %1$s(%2$s().get%3$s());", syncClient.getClassName(), buildMethodName,
                    CodeNamer.toPascalCase(syncClient.getMethodGroupClient().getVariableName()));
        }
    }

    protected void writeSyncClientBuildMethodFromAsyncClient(AsyncSyncClient syncClient, AsyncSyncClient asyncClient, JavaBlock function,
                                                             String buildMethodName, boolean wrapServiceClient) {
        if (wrapServiceClient) {
            function.line("return new %1$s(new %2$s(%3$s()));", syncClient.getClassName(), asyncClient.getClassName(),
                    buildMethodName);
        } else {
            function.line("return new %1$s(new %2$s(%3$s().get%4$s()));", syncClient.getClassName(), asyncClient.getClassName(),
                    buildMethodName, CodeNamer.toPascalCase(syncClient.getMethodGroupClient().getVariableName()));
        }
    }

    protected String getSerializerMemberName() {
        return "serializerAdapter";
    }

    protected void addSerializerImport(Set<String> imports, JavaSettings settings) {
        imports.add(settings.isFluent() ? "com.azure.core.management.serializer.SerializerFactory" : "com.azure.core.util.serializer.JacksonAdapter");
    }

    protected void addImportForCoreUtils(Set<String> imports) {
        ClassType.CORE_UTILS.addImportsTo(imports, false);
        imports.add("com.azure.core.util.builder.ClientBuilderUtil");
    }

    protected void addHttpPolicyImports(Set<String> imports) {
        imports.add(BearerTokenAuthenticationPolicy.class.getName());

        // one of the key credential policy imports will be removed by the formatter depending
        // on which one is used
        imports.add(AzureKeyCredentialPolicy.class.getName());
        ClassType.KEY_CREDENTIAL_POLICY.addImportsTo(imports, false);

        imports.add(HttpPolicyProviders.class.getName());
        ClassType.HTTP_PIPELINE_POLICY.addImportsTo(imports, false);
        imports.add(HttpLoggingPolicy.class.getName());
        imports.add(AddHeadersPolicy.class.getName());
        imports.add(RequestIdPolicy.class.getName());
        imports.add(AddHeadersFromContextPolicy.class.getName());
        imports.add(AddDatePolicy.class.getName());
        imports.add(HttpPipelinePosition.class.getName());
        imports.add(Collectors.class.getName());
        ClassType.RETRY_POLICY.addImportsTo(imports, false);
        ClassType.REDIRECT_POLICY.addImportsTo(imports, false);
    }

    protected void addTraitsImports(ClientBuilder clientBuilder, Set<String> imports) {
        clientBuilder.getBuilderTraits().stream().forEach(trait -> imports.addAll(trait.getImportPackages()));
    }

    protected void addServiceClientBuilderAnnotationImport(Set<String> imports) {
        Annotation.SERVICE_CLIENT_BUILDER.addImportsTo(imports);
    }

    protected void addCreateHttpPipelineMethod(JavaSettings settings, JavaClass classBlock,
                                               String defaultCredentialScopes, SecurityInfo securityInfo,
                                               PipelinePolicyDetails pipelinePolicyDetails) {
        addGeneratedAnnotation(classBlock);
        classBlock.privateMethod("HttpPipeline createHttpPipeline()", function -> {
            TemplateHelper.createHttpPipelineMethod(settings, defaultCredentialScopes, securityInfo, pipelinePolicyDetails, function);
        });
    }

    private void addValidateClientMethod(JavaClass classBlock, List<ServiceClientProperty> properties) {
        addGeneratedAnnotation(classBlock);
        classBlock.privateMethod("void validateClient()", methodBlock -> {
            methodBlock.line("// This method is invoked from 'buildInnerClient'/'buildClient' method.");
            methodBlock.line("// Developer can customize this method, to validate that the necessary conditions are met for the new client.");
            for (ServiceClientProperty property : properties) {
                // property have a default value would have a "local<PropertyName>" for the initialization of client
                if (property.isRequired() && property.getDefaultValueExpression() == null) {
                    methodBlock.line("Objects.requireNonNull(" + property.getName() + ", \"'" + property.getName() + "' cannot be null.\");");
                }
            }
        });
    }

    protected ArrayList<ServiceClientProperty> addCommonClientProperties(JavaSettings settings, SecurityInfo securityInfo) {
        ArrayList<ServiceClientProperty> commonProperties = new ArrayList<ServiceClientProperty>();
        if (settings.isAzureOrFluent()) {
            commonProperties.add(new ServiceClientProperty("The environment to connect to", ClassType.AZURE_ENVIRONMENT, "environment", false, "AzureEnvironment.AZURE"));
            commonProperties.add(new ServiceClientProperty("The HTTP pipeline to send requests through", ClassType.HTTP_PIPELINE, "pipeline", false,
                            "new HttpPipelineBuilder().policies(new UserAgentPolicy(), new RetryPolicy()).build()"));
        }
        if (settings.isFluent()) {
            commonProperties.add(new ServiceClientProperty("The default poll interval for long-running operation", ClassType.DURATION, "defaultPollInterval", false, "Duration.ofSeconds(30)"));
        }

        // Low-level client does not need serializer. It returns BinaryData.
        if (!settings.isDataPlaneClient()) {
            commonProperties.add(new ServiceClientProperty("The serializer to serialize an object into a string",
                    ClassType.SERIALIZER_ADAPTER, getSerializerMemberName(), false,
                    settings.isFluent() ? "SerializerFactory.createDefaultManagementSerializerAdapter()" : JACKSON_SERIALIZER));
        }

        if (!settings.isAzureOrFluent() && settings.isBranded()) {
            commonProperties.add(new ServiceClientProperty("The retry policy that will attempt to retry failed "
                    + "requests, if applicable.", ClassType.RETRY_POLICY, "retryPolicy", false, null));
        }
        return commonProperties;
    }

    /**
     * Extension for the name of build method.
     *
     * @return The name of build method.
     */
    protected String primaryBuildMethodName(JavaSettings settings) {
        return settings.isGenerateSyncAsyncClients()
                ? "buildInnerClient"
                : "buildClient";
    }

    protected void addGeneratedImport(Set<String> imports) {
        if (JavaSettings.getInstance().isBranded()) {
            Annotation.GENERATED.addImportsTo(imports);
        } else {
            Annotation.METADATA.addImportsTo(imports);
        }
    }

    protected void addGeneratedAnnotation(JavaContext classBlock) {
        if (JavaSettings.getInstance().isBranded()) {
            classBlock.annotation(Annotation.GENERATED.getName());
        } else {
            classBlock.annotation(Annotation.METADATA.getName() + "(generated = true)");
        }
    }

    protected void addOverrideAnnotation(JavaContext classBlock) {
        classBlock.annotation("Override");
    }
}
