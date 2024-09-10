// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.microsoft.typespec.http.client.generator.core.Javagen;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ArraySchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ChoiceSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.DictionarySchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Header;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Language;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Languages;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ObjectSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.OperationGroup;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Parameter;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Property;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Request;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Response;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Schema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SchemaContext;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Scheme;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SealedChoiceSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.extensionmodel.XmsExtensions;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.AsyncSyncClient;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Client;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientBuilder;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientBuilderTrait;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientException;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodExample;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModels;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientResponse;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ConvenienceMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.EnumType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ExternalPackage;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ModuleInfo;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PackageInfo;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProtocolExample;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ServiceClient;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.XmlSequenceWrapper;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility;
import com.microsoft.typespec.http.client.generator.core.template.Templates;
import com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;
import com.microsoft.typespec.http.client.generator.core.util.SchemaUtil;
import com.azure.core.util.CoreUtils;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.BiConsumer;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * A mapper that maps a {@link CodeModel} to a {@link Client}.
 */
public class ClientMapper implements IMapper<CodeModel, Client> {
    private static final ClientMapper INSTANCE = new ClientMapper();

    protected ClientMapper() {
    }

    /**
     * Gets the global {@link ClientMapper} instance.
     *
     * @return The global {@link ClientMapper} instance.
     */
    public static ClientMapper getInstance() {
        return INSTANCE;
    }

    @Override
    public Client map(CodeModel codeModel) {
        JavaSettings settings = JavaSettings.getInstance();
        Client.Builder builder = new Client.Builder();

        // enum model
        final List<EnumType> enumTypes = new ArrayList<>();
        Set<String> enumNames = new HashSet<>();
        for (ChoiceSchema choiceSchema : codeModel.getSchemas().getChoices()) {
            IType iType = Mappers.getChoiceMapper().map(choiceSchema);
            if (iType != ClassType.STRING) {
                EnumType enumType = (EnumType) iType;
                if (!enumNames.contains(enumType.getName())) {
                    enumTypes.add(enumType);
                    enumNames.add(enumType.getName());
                }
            }
        }
        for (SealedChoiceSchema choiceSchema : codeModel.getSchemas().getSealedChoices()) {
            IType iType = Mappers.getSealedChoiceMapper().map(choiceSchema);
            if (iType != ClassType.STRING) {
                EnumType enumType = (EnumType) iType;
                if (!enumNames.contains(enumType.getName())) {
                    enumTypes.add(enumType);
                    enumNames.add(enumType.getName());
                }
            }
        }
        builder.enums(enumTypes);

        // exception
        List<ClientException> exceptions = codeModel.getOperationGroups().stream()
            .flatMap(og -> og.getOperations().stream())
            .flatMap(o -> o.getExceptions().stream())
            .map(Response::getSchema)
            .distinct()
            .filter(s -> s instanceof ObjectSchema)
            .map(s -> Mappers.getExceptionMapper().map((ObjectSchema) s))
            .filter(Objects::nonNull)
            .distinct()
            .collect(Collectors.toList());
        builder.exceptions(exceptions);

        builder.xmlSequenceWrappers(parseXmlSequenceWrappers(codeModel, settings));

        // class model
        Stream<ObjectSchema> autoRestModelTypes = Stream.concat(
            codeModel.getSchemas().getObjects().stream(),
            codeModel.getOperationGroups().stream().flatMap(og -> og.getOperations().stream())
                .map(o -> parseHeader(o, settings)).filter(Objects::nonNull));

        List<ClientModel> clientModelsFromCodeModel = autoRestModelTypes
            .distinct()
            .map(autoRestCompositeType -> Mappers.getModelMapper().map(autoRestCompositeType))
            .filter(Objects::nonNull)
            .distinct()
            .collect(Collectors.toList());
        // append some models not from CodeModel (currently, only for ##FileDetails models for multipart/form-data request)
        // TODO (weidxu): we can remove this code block, if ##FileDetails moves to azure-core
        final List<ClientModel> clientModels = Stream.concat(clientModelsFromCodeModel.stream(), ClientModels.getInstance().getModels().stream())
            .distinct()
            .collect(Collectors.toList());
        builder.models(clientModels);

        // union model (class)
        builder.unionModels(codeModel.getSchemas().getOrs().stream().distinct()
            .flatMap(schema -> Mappers.getUnionModelMapper().map(schema).stream())
            .filter(Objects::nonNull)
            .distinct()
            .collect(Collectors.toList()));

        // response model (subclass of Response with headers)
        final List<ClientResponse> responseModels = codeModel.getOperationGroups().stream()
            .flatMap(og -> og.getOperations().stream())
            .distinct()
            .map(m -> parseResponse(m, clientModels, settings))
            .filter(Objects::nonNull)
            .distinct()
            .collect(Collectors.toList());
        builder.responseModels(responseModels);

        String serviceClientName = codeModel.getLanguage().getJava().getName();
        String serviceClientDescription = codeModel.getInfo().getDescription();
        builder.clientName(serviceClientName).clientDescription(serviceClientDescription);

        Map<ServiceClient, com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Client> serviceClientsMap = new LinkedHashMap<>();

        boolean multipleClientsWithOperationsPresent = codeModel.getClients()
                .stream()
                .flatMap(client -> client.getOperationGroups().stream())
                .flatMap(og -> og.getOperations().stream())
                .findAny()
                .isPresent();

        boolean singleClientOperationsPresent = codeModel.getOperationGroups()
                .stream()
                .flatMap(og -> og.getOperations().stream())
                .findAny()
                .isPresent();

        if (multipleClientsWithOperationsPresent || singleClientOperationsPresent) {
            // set the service clients only if there are client operations present
            if (!CoreUtils.isNullOrEmpty(codeModel.getClients())) {
                serviceClientsMap = processClients(codeModel.getClients(), codeModel);
                builder.serviceClients(new ArrayList(serviceClientsMap.keySet()));
            } else {
                // service client
                ServiceClient serviceClient = Mappers.getServiceClientMapper().map(codeModel);
                if (serviceClient != null) {
                    builder.serviceClient(serviceClient);

                    serviceClientsMap.put(serviceClient, codeModel);
                }
            }
        }

        // package info
        // client
        Map<String, PackageInfo> packageInfos = new HashMap<>();
        if (settings.isGenerateClientInterfaces() || !settings.isGenerateClientAsImpl()
            || settings.getImplementationSubpackage() == null || settings.getImplementationSubpackage().isEmpty()
            || settings.isFluent() || settings.isGenerateSyncAsyncClients() || settings.isDataPlaneClient()) {
            packageInfos.put(settings.getPackage(), new PackageInfo(
                settings.getPackage(),
                String.format("Package containing the classes for %s.\n%s", serviceClientName,
                    serviceClientDescription)));
        }
        if (settings.isFluent()) {
            if (settings.isFluentLite() && !CoreUtils.isNullOrEmpty(settings.getImplementationSubpackage())) {
                String implementationPackage = settings.getPackage(settings.getImplementationSubpackage());
                if (!packageInfos.containsKey(implementationPackage)) {
                    packageInfos.put(implementationPackage, new PackageInfo(
                        implementationPackage,
                        String.format("Package containing the implementations for %s.\n%s",
                            serviceClientName, serviceClientDescription)));
                }
            }
            if (!CoreUtils.isNullOrEmpty(settings.getFluentSubpackage())) {
                String fluentPackage = settings.getPackage(settings.getFluentSubpackage());
                if (!packageInfos.containsKey(fluentPackage)) {
                    packageInfos.put(fluentPackage, new PackageInfo(
                        fluentPackage,
                        String.format("Package containing the service clients for %s.\n%s",
                            serviceClientName, serviceClientDescription)));
                }
                String fluentInnerPackage = settings.getPackage(settings.getFluentModelsSubpackage());
                if (!packageInfos.containsKey(fluentInnerPackage)) {
                    packageInfos.put(fluentInnerPackage, new PackageInfo(
                        fluentInnerPackage,
                        String.format("Package containing the inner data models for %s.\n%s",
                            serviceClientName, serviceClientDescription)));
                }
            }
        } else {
            if (settings.isGenerateClientAsImpl() && settings.getImplementationSubpackage() != null
                && !settings.getImplementationSubpackage().isEmpty()) {

                String implementationPackage = settings.getPackage(settings.getImplementationSubpackage());
                if (!packageInfos.containsKey(implementationPackage)) {
                    packageInfos.put(implementationPackage, new PackageInfo(
                        implementationPackage,
                        String.format("Package containing the implementations for %s.\n%s",
                            serviceClientName, serviceClientDescription)));
                }
            }
        }
        // client in different packages
        for (ServiceClient client : serviceClientsMap.keySet()) {
            if (client.getBuilderPackageName() != null && !packageInfos.containsKey(client.getBuilderPackageName())) {
                packageInfos.put(client.getBuilderPackageName(), new PackageInfo(
                        client.getBuilderPackageName(),
                        String.format("Package containing the classes for %s.\n%s", client.getInterfaceName(),
                                serviceClientDescription)));
            }
        }
        // model
        final List<String> modelsPackages = getModelsPackages(clientModels, enumTypes, responseModels);
        for (String modelsPackage : modelsPackages) {
            if (!packageInfos.containsKey(modelsPackage)) {
                packageInfos.put(modelsPackage, new PackageInfo(
                    modelsPackage,
                    String.format("Package containing the data models for %s.\n%s", serviceClientName,
                        serviceClientDescription)));
            }
        }
        if (settings.getCustomTypes() != null && !settings.getCustomTypes().isEmpty()
            && settings.getCustomTypesSubpackage() != null && !settings.getCustomTypesSubpackage().isEmpty()) {
            String customTypesPackage = settings.getPackage(settings.getCustomTypesSubpackage());
            if (!packageInfos.containsKey(customTypesPackage)) {
                packageInfos.put(customTypesPackage, new PackageInfo(
                    customTypesPackage,
                    String.format("Package containing the data models for %s.\n%s", serviceClientName,
                        serviceClientDescription)));
            }
        }
        builder.packageInfos(new ArrayList<>(packageInfos.values()));

        // module info
        builder.moduleInfo(getModuleInfo(modelsPackages, serviceClientsMap.keySet()));

        // async/sync service client (wrapper for the ServiceClient)
        List<AsyncSyncClient> syncClients = new ArrayList<>();
        List<AsyncSyncClient> asyncClients = new ArrayList<>();
        List<ClientBuilder> clientBuilders = new ArrayList<>();
        for (Map.Entry<ServiceClient, ? extends com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Client> entry : serviceClientsMap.entrySet()) {
            List<AsyncSyncClient> syncClientsLocal = new ArrayList<>();
            List<AsyncSyncClient> asyncClientsLocal = new ArrayList<>();

            ServiceClient serviceClient = entry.getKey();
            com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Client client = entry.getValue();
            if (settings.isGenerateSyncAsyncClients()) {
                ClientModelUtil.getAsyncSyncClients(client, serviceClient, asyncClientsLocal, syncClientsLocal);
            }
            builder.syncClients(syncClients);
            builder.asyncClients(asyncClients);

            // service client builder
            if (!serviceClient.isBuilderDisabled()) {
                String builderSuffix = ClientModelUtil.getBuilderSuffix();
                String builderName = serviceClient.getInterfaceName() + builderSuffix;
                String builderPackage = ClientModelUtil.getServiceClientBuilderPackageName(serviceClient);
                if (settings.isGenerateSyncAsyncClients() && settings.isGenerateBuilderPerClient()) {
                    // service client builder per service client
                    for (int i = 0; i < asyncClientsLocal.size(); ++i) {
                        AsyncSyncClient asyncClient = asyncClientsLocal.get(i);
                        AsyncSyncClient syncClient = (i >= syncClientsLocal.size()) ? null : syncClientsLocal.get(i);
                        String clientName = ((syncClient != null)
                            ? syncClient.getClassName()
                            : asyncClient.getClassName().replace("AsyncClient", "Client"));
                        String clientBuilderName = clientName + builderSuffix;
                        ClientBuilder clientBuilder = new ClientBuilder(
                            builderPackage, clientBuilderName, serviceClient,
                            (syncClient == null) ? Collections.emptyList() : Collections.singletonList(syncClient),
                            Collections.singletonList(asyncClient), serviceClient.getCrossLanguageDefinitionId());

                        addBuilderTraits(clientBuilder, serviceClient);
                        clientBuilders.add(clientBuilder);

                        // there is a cross-reference between service client and service client builder
                        asyncClient.setClientBuilder(clientBuilder);
                        if (syncClient != null) {
                            syncClient.setClientBuilder(clientBuilder);
                        }
                    }
                } else {
                    // service client builder
                    ClientBuilder clientBuilder = new ClientBuilder(builderPackage, builderName,
                        serviceClient, syncClientsLocal, asyncClientsLocal, serviceClient.getCrossLanguageDefinitionId());
                    addBuilderTraits(clientBuilder, serviceClient);
                    clientBuilders.add(clientBuilder);

                    // there is a cross-reference between service client and service client builder
                    asyncClientsLocal.forEach(c -> c.setClientBuilder(clientBuilder));
                    syncClientsLocal.forEach(c -> c.setClientBuilder(clientBuilder));
                }
            }

            syncClients.addAll(syncClientsLocal);
            asyncClients.addAll(asyncClientsLocal);
        }
        builder.clientBuilders(clientBuilders);
        builder.crossLanguageDefinitionId(codeModel.getLanguage().getJava().getName());

        // example/test
        if (settings.isDataPlaneClient() && (settings.isGenerateSamples() || settings.isGenerateTests())) {
            addProtocolExamples(builder, syncClients);
            addConvenienceExamples(builder, syncClients);
        }

        if (settings.isGenerateTests() && codeModel.getTestModel() != null) {
            builder.liveTests(LiveTestsMapper.getInstance().map(codeModel.getTestModel()));
        }

        builder.graalVmConfig(Mappers.getGraalVmConfigMapper()
                .map(new GraalVmConfigMapper.ServiceAndModel(
                        serviceClientsMap.keySet(),
                        exceptions,
                        clientModels,
                        enumTypes)));

        return builder.build();
    }

    private void addConvenienceExamples(Client.Builder builder, List<AsyncSyncClient> syncClients) {
        // convenience examples
        List<ClientMethodExample> convenienceExamples = new ArrayList<>();
        Set<String> convenienceExampleNameSet = new HashSet<>();

        BiConsumer<AsyncSyncClient, ConvenienceMethod> handleConvenienceExample = (c, convenienceMethod) -> {
            ClientBuilder clientBuilder = c.getClientBuilder();
            if (clientBuilder != null && convenienceMethod.getProtocolMethod().getProxyMethod().getExamples() != null) {
                // only generate sample for convenience methods with max overload parameters
                convenienceMethod.getConvenienceMethods().stream()
                    .filter(clientMethod -> clientMethod.getMethodVisibility() == JavaVisibility.Public && clientMethod.getMethodVisibilityInWrapperClient() == JavaVisibility.Public)
                    .filter(clientMethod -> Templates.getClientMethodSampleTemplate()
                        .isExampleIncluded(clientMethod, convenienceMethod))
                    .max((clientMethod1, clientMethod2) -> {
                        int m1ParameterCount = clientMethod1.getMethodInputParameters().size();
                        int m2ParameterCount = clientMethod2.getMethodInputParameters().size();
                        return m1ParameterCount - m2ParameterCount;
                    })
                    .ifPresent(clientMethod ->
                        clientMethod.getProxyMethod().getExamples().forEach((name, example) -> {
                            String filename = CodeNamer.toPascalCase(CodeNamer.removeInvalidCharacters(name));
                            if (!convenienceExampleNameSet.contains(filename)) {
                                ClientMethodExample convenienceExample =
                                    new ClientMethodExample(clientMethod, c, clientBuilder, filename, example);
                                convenienceExamples.add(convenienceExample);
                                convenienceExampleNameSet.add(filename);
                            }
                        }));
            }
        };

        // convenience examples
        syncClients.stream().filter(c -> !CoreUtils.isNullOrEmpty(c.getConvenienceMethods()))
            .forEach(c -> c.getConvenienceMethods()
                .forEach(m -> handleConvenienceExample.accept(c, m)));
        builder.clientMethodExamples(convenienceExamples);
    }

    private void addProtocolExamples(Client.Builder builder, List<AsyncSyncClient> syncClients) {
        List<ProtocolExample> protocolExamples = new ArrayList<>();
        Set<String> protocolExampleNameSet = new HashSet<>();

        BiConsumer<AsyncSyncClient, ClientMethod> handleExample = (c, m) -> {
            if (m.getMethodVisibility() == JavaVisibility.Public
                && m.getMethodVisibilityInWrapperClient() == JavaVisibility.Public
                && !m.isImplementationOnly() &&
                (m.getType() == ClientMethodType.SimpleSyncRestResponse
                    || m.getType() == ClientMethodType.PagingSync
                    || m.getType() == ClientMethodType.LongRunningBeginSync)) {
                ClientBuilder clientBuilder = c.getClientBuilder();
                if (clientBuilder != null && m.getProxyMethod().getExamples() != null) {
                    m.getProxyMethod().getExamples().forEach((name, example) -> {
                        String filename = CodeNamer.toPascalCase(CodeNamer.removeInvalidCharacters(name));
                        if (!protocolExampleNameSet.contains(filename)) {
                            ProtocolExample protocolExample = new ProtocolExample(m, c, clientBuilder, filename, example);
                            protocolExamples.add(protocolExample);
                            protocolExampleNameSet.add(filename);
                        }
                    });
                }
            }
        };

        // protocol examples, exclude those that have convenience methods
        syncClients.stream().filter(c -> c.getServiceClient() != null)
            .forEach(c -> {
                Set<String> convenienceProxyMethodNames = new HashSet<>();
                if (c.getConvenienceMethods() != null) {
                    convenienceProxyMethodNames.addAll(c.getConvenienceMethods().stream()
                        .map(convenienceMethod -> convenienceMethod
                            .getProtocolMethod().getProxyMethod().getBaseName())
                        .collect(Collectors.toSet()));
                }
                c.getServiceClient().getClientMethods()
                    .stream()
                    .filter(m -> !convenienceProxyMethodNames.contains(m.getProxyMethod().getBaseName()))
                    .forEach(m -> handleExample.accept(c, m));
            });
        syncClients.stream().filter(c -> c.getMethodGroupClient() != null)
            .forEach(c -> {
                Set<String> convenienceProxyMethodNames = new HashSet<>();
                if (c.getConvenienceMethods() != null) {
                    convenienceProxyMethodNames.addAll(c.getConvenienceMethods().stream()
                        .map(convenienceMethod -> convenienceMethod
                            .getProtocolMethod().getProxyMethod().getBaseName())
                        .collect(Collectors.toSet()));
                }
                c.getMethodGroupClient().getClientMethods()
                    .stream()
                    .filter(m -> !convenienceProxyMethodNames.contains(m.getProxyMethod().getBaseName()))
                    .forEach(m -> handleExample.accept(c, m));
            });
        builder.protocolExamples(protocolExamples);
    }

    /**
     * Extension for processing multi-client. Supported in Cadl.
     *
     * @param clients List of clients.
     * @return List of service clients.
     */
    protected Map<ServiceClient, com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Client> processClients(List<com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Client> clients, CodeModel codeModel) {
        return Collections.emptyMap();
    }

    private void addBuilderTraits(ClientBuilder clientBuilder, ServiceClient serviceClient) {
        clientBuilder.addBuilderTrait(ClientBuilderTrait.HTTP_TRAIT);
        if (!JavaSettings.getInstance().isBranded()) {
            clientBuilder.addBuilderTrait(ClientBuilderTrait.PROXY_TRAIT);
        }

        clientBuilder.addBuilderTrait(ClientBuilderTrait.CONFIGURATION_TRAIT);
        if (serviceClient.getSecurityInfo().getSecurityTypes().contains(Scheme.SecuritySchemeType.OAUTH2)) {
            clientBuilder.addBuilderTrait(ClientBuilderTrait.TOKEN_CREDENTIAL_TRAIT);
        }
        if (serviceClient.getSecurityInfo().getSecurityTypes().contains(Scheme.SecuritySchemeType.KEY)) {
            if (!JavaSettings.getInstance().isBranded() || JavaSettings.getInstance().isUseKeyCredential()) {
                clientBuilder.addBuilderTrait(ClientBuilderTrait.KEY_CREDENTIAL_TRAIT);
            } else {
                clientBuilder.addBuilderTrait(ClientBuilderTrait.AZURE_KEY_CREDENTIAL_TRAIT);
            }
        }
        serviceClient.getProperties().stream()
                .map(property -> {
                    Javagen.getPluginInstance().getLogger().info("Client property name " + property.getName());
                    return property;
                })
            .filter(property -> property.getName().equals("endpoint"))
            .findFirst()
            .ifPresent(property -> clientBuilder.addBuilderTrait(ClientBuilderTrait.getEndpointTrait(property)));
    }

    private List<XmlSequenceWrapper> parseXmlSequenceWrappers(CodeModel codeModel, JavaSettings settings) {
        Map<String, XmlSequenceWrapper> xmlSequenceWrappers = new LinkedHashMap<>();
        for (OperationGroup operationGroup : codeModel.getOperationGroups()) {
            for (Operation operation : operationGroup.getOperations()) {
                Schema responseBodySchema = SchemaUtil.getLowestCommonParent(operation.getResponses().stream()
                    .map(Response::getSchema)
                    .filter(Objects::nonNull)
                    .iterator());

                if (responseBodySchema instanceof ArraySchema) {
                    parseXmlSequenceWrappers((ArraySchema) responseBodySchema, xmlSequenceWrappers, settings);
                }

                for (Parameter parameter : operation.getParameters()) {
                    if (!(parameter.getSchema() instanceof ArraySchema)) {
                        continue;
                    }
                    parseXmlSequenceWrappers((ArraySchema) parameter.getSchema(), xmlSequenceWrappers, settings);
                }

                for (Request request : operation.getRequests()) {
                    for (Parameter parameter : request.getParameters()) {
                        if (!(parameter.getSchema() instanceof ArraySchema)) {
                            continue;
                        }
                        parseXmlSequenceWrappers((ArraySchema) parameter.getSchema(), xmlSequenceWrappers, settings);
                    }
                }
            }
        }

        return new ArrayList<>(xmlSequenceWrappers.values());
    }

    private static void parseXmlSequenceWrappers(ArraySchema arraySchema,
        Map<String, XmlSequenceWrapper> xmlSequenceWrappers, JavaSettings settings) {
        if (!SchemaUtil.treatAsXml(arraySchema)) {
            return;
        }

        String modelTypeName = arraySchema.getElementType().getLanguage().getJava() != null
            ? arraySchema.getElementType().getLanguage().getJava().getName()
            : arraySchema.getElementType().getLanguage().getDefault().getName();

        xmlSequenceWrappers.computeIfAbsent(modelTypeName, name -> new XmlSequenceWrapper(name, arraySchema, settings));
    }

    static ObjectSchema parseHeader(Operation operation, JavaSettings settings) {
        if (!SchemaUtil.responseContainsHeaderSchemas(operation, settings)) {
            return null;
        }

        String name = CodeNamer.getPlural(operation.getOperationGroup().getLanguage().getJava().getName())
            + CodeNamer.toPascalCase(operation.getLanguage().getJava().getName()) + "Headers";
        Map<String, Schema> headerMap = new HashMap<>();
        Map<String, XmsExtensions> headerExtensions = new HashMap<>();
        for (Response response : operation.getResponses()) {
            if (response.getProtocol().getHttp().getHeaders() != null) {
                for (Header header : response.getProtocol().getHttp().getHeaders()) {
                    headerExtensions.put(header.getHeader(), header.getExtensions());
                    headerMap.put(header.getHeader(), header.getSchema());
                }
            }
        }
        if (headerMap.isEmpty()) {
            return null;
        }
        ObjectSchema headerSchema = new ObjectSchema();
        headerSchema.setLanguage(new Languages());
        headerSchema.getLanguage().setJava(new Language());
        headerSchema.getLanguage().getJava().setName(name);
        headerSchema.setProperties(new ArrayList<>());
        headerSchema.setStronglyTypedHeader(true);
        headerSchema.setUsage(new HashSet<>(Collections.singletonList(SchemaContext.OUTPUT)));

        // TODO (weidxu): at present we do not generate convenience API with Header model
//        if (operation.getConvenienceApi() != null) {
//            headerSchema.getUsage().add(SchemaContext.CONVENIENCE_API);
//        }

        for (Map.Entry<String, Schema> header : headerMap.entrySet()) {
            Property property = new Property();
            property.setSerializedName(header.getKey());
            property.setLanguage(new Languages());
            property.getLanguage().setJava(new Language());
            property.getLanguage().getJava().setName(CodeNamer.getPropertyName(header.getKey()));
            property.getLanguage().getJava().setDescription(header.getValue().getDescription());
            property.setSchema(header.getValue());
            property.setDescription(header.getValue().getDescription());
            if (headerExtensions.get(header.getKey()) != null) {
                property.setExtensions(headerExtensions.get(header.getKey()));
                if (property.getExtensions().getXmsHeaderCollectionPrefix() != null) {
                    property.setSerializedName(property.getExtensions().getXmsHeaderCollectionPrefix());
                    DictionarySchema dictionarySchema = new DictionarySchema();
                    dictionarySchema.setElementType(header.getValue());
                    property.setSchema(header.getValue());
                }
            }
            headerSchema.getProperties().add(property);
        }
        return headerSchema;
    }

    private ClientResponse parseResponse(Operation method, List<ClientModel> models, JavaSettings settings) {
        ClientResponse.Builder builder = new ClientResponse.Builder();
        ObjectSchema headerSchema = parseHeader(method, settings);
        if (headerSchema == null || settings.isGenericResponseTypes() || settings.isDisableTypedHeadersMethods()) {
            return null;
        }

        ClassType classType = ClientMapper.getClientResponseClassType(method, models, settings);
        return builder.name(classType.getName())
            .packageName(classType.getPackage())
            .description(String.format("Contains all response data for the %s operation.", method.getLanguage().getJava().getName()))
            .headersType(Mappers.getSchemaMapper().map(headerSchema))
            .bodyType(SchemaUtil.getOperationResponseType(method, settings))
            .build();
    }

    private static ModuleInfo getModuleInfo(List<String> modelsPackages, Collection<ServiceClient> clients) {
        // WARNING: Only tested for low level clients
        JavaSettings settings = JavaSettings.getInstance();
        ModuleInfo moduleInfo = new ModuleInfo(settings.getPackage());

        List<ModuleInfo.RequireModule> requireModules = moduleInfo.getRequireModules();
        requireModules.add(new ModuleInfo.RequireModule(ExternalPackage.CORE.getPackageName(), true));

        // export packages that contain Client, ClientBuilder, ServiceVersion
        List<ModuleInfo.ExportModule> exportModules = moduleInfo.getExportModules();
        exportModules.add(new ModuleInfo.ExportModule(settings.getPackage()));
        for (ServiceClient client : clients) {
            String builderPackageName = client.getBuilderPackageName();
            if (builderPackageName != null
                    && exportModules.stream().noneMatch(exportModule -> exportModule.getModuleName().equals(builderPackageName))) {
                exportModules.add(new ModuleInfo.ExportModule(builderPackageName));
            }
        }

        final String implementationSubpackagePrefix = settings.getPackage(settings.getImplementationSubpackage()) + ".";
        for (String modelsPackage : modelsPackages) {
            // export if models is not in implementation
            if (!modelsPackage.startsWith(implementationSubpackagePrefix)) {
                exportModules.add(new ModuleInfo.ExportModule(modelsPackage));
            }

            // open models package to azure-core and jackson
            List<String> openToModules = new ArrayList<>();
            openToModules.add(ExternalPackage.CORE.getPackageName());
            if (!settings.isStreamStyleSerialization()) {
                openToModules.add("com.fasterxml.jackson.databind");
            }
            List<ModuleInfo.OpenModule> openModules = moduleInfo.getOpenModules();
            openModules.add(new ModuleInfo.OpenModule(modelsPackage, openToModules));
        }

        return moduleInfo;
    }

    /**
     * Extension for the list of "models" package (it could contain "implementation.models" and that of
     * custom-types-subpackage), that need to have "exports" or "opens" in "module-info.java", and have
     * "package-info.java"
     *
     * @param clientModels the list of client models (ObjectSchema).
     * @param enumTypes the list of enum models (ChoiceSchema and SealedChoiceSchema).
     * @param responseModels the list of client response models (for responses that contains headers).
     * @return whether SDK contains "models" package,
     */
    protected List<String> getModelsPackages(List<ClientModel> clientModels, List<EnumType> enumTypes, List<ClientResponse> responseModels) {

        List<String> ret = Collections.emptyList();

        JavaSettings settings = JavaSettings.getInstance();
        boolean hasModels = !settings.isDataPlaneClient()   // not DPG
            // defined models package (it is defined by default)
            && (settings.getModelsSubpackage() != null && !settings.getModelsSubpackage().isEmpty())
            // models package is not same as implementation package
            && !settings.getModelsSubpackage().equals(settings.getImplementationSubpackage());

        if (hasModels) {
            Set<String> packages = clientModels.stream()
                .map(ClientModel::getPackage)
                .collect(Collectors.toSet());

            packages.addAll(enumTypes.stream()
                .map(EnumType::getPackage)
                .collect(Collectors.toSet()));
            packages.addAll(responseModels.stream()
                .map(ClientResponse::getPackage)
                .collect(Collectors.toSet()));

            ret = new ArrayList<>(packages);
        }

        return ret;
    }

    static ClassType getClientResponseClassType(Operation method, List<ClientModel> models, JavaSettings settings) {
        String name = CodeNamer.getPlural(method.getOperationGroup().getLanguage().getJava().getName())
            + CodeNamer.toPascalCase(method.getLanguage().getJava().getName()) + "Response";
        String packageName = settings.getPackage(settings.getModelsSubpackage());
        if (settings.isCustomType(name)) {
            packageName = settings.getPackage(settings.getCustomTypesSubpackage());
        }

        // deduplicate from model name
        for (ClientModel model : models) {
            if (model.getName().equalsIgnoreCase(name) && model.getPackage().equals(packageName)) {
                name = name + "Response";
            }
        }

        return new ClassType.Builder().packageName(packageName).name(name).build();
    }
}
