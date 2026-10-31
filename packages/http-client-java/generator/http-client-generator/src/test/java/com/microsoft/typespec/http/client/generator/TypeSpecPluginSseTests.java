// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ArraySchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ConvenienceApi;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Header;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Info;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Language;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Languages;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ObjectSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.OperationGroup;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Property;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Protocol;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Protocols;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Relations;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Request;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Response;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Schema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SchemaContext;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Schemas;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseEventMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseSchemaMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.StringSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.extensionmodel.XmsExtensions;
import com.microsoft.typespec.http.client.generator.core.extension.model.extensionmodel.XmsPageable;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.mapper.ClientMapper;
import com.microsoft.typespec.http.client.generator.core.mapper.ClientMethodMapper;
import com.microsoft.typespec.http.client.generator.core.mapper.Mappers;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Client;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModels;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientResponse;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.EnumType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ImplementationDetails;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ModuleInfo;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaPackage;
import com.microsoft.typespec.http.client.generator.core.util.SseUtil;
import com.microsoft.typespec.http.client.generator.mapper.TypeSpecClientMapper;
import com.microsoft.typespec.http.client.generator.mapper.TypeSpecMapperFactory;
import com.microsoft.typespec.http.client.generator.model.EmitterOptions;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Consumer;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.Isolated;

@Isolated
public class TypeSpecPluginSseTests extends JavaSettingsTestBase {
    @BeforeEach
    public void clearClientModels() {
        ClientModels.getInstance().clear();
    }

    @Test
    public void exportsEventPackagesOnceAlongsideOrdinaryModelPackages() {
        TypeSpecPlugin plugin = new TypeSpecPlugin(new EmitterOptions().setNamespace("com.azure.mock"), false);
        configureJavaSettings(sseSettings("all", false, true));
        CodeModel codeModel = codeModel(
            List.of(group("", operation("readFirst", metadata("first", "FirstEvents", "com.azure.events"), false, true),
                operation("readSecond", metadata("second", "SecondEvents", "com.azure.events"), false, true),
                operation("readShared", metadata("shared", "SharedEvents", "com.azure.shared"), false, true))));
        Client client = plugin.processClient(codeModel);
        ModuleInfo moduleInfo = client.getModuleInfo();
        JavaPackage javaPackage = plugin.processTemplates(codeModel, client, JavaSettings.getInstance());

        Assertions.assertEquals(List.of("com.azure.events.models", "com.azure.shared.models"),
            moduleInfo.getExportModules()
                .stream()
                .map(ModuleInfo.ExportModule::getModuleName)
                .filter(name -> name.endsWith(".models"))
                .collect(Collectors.toList()));
        String moduleSource = javaPackage.getJavaFiles()
            .stream()
            .filter(file -> file.getFilePath().endsWith("module-info.java"))
            .findFirst()
            .orElseThrow()
            .getContents()
            .toString();
        Assertions.assertTrue(moduleSource.contains("exports com.azure.events.models;"));
        Map<String, Long> generatedPaths = javaPackage.getJavaFiles()
            .stream()
            .collect(Collectors.groupingBy(file -> file.getFilePath(), Collectors.counting()));
        Assertions.assertEquals(1L, generatedPaths.get("src/main/java/com/azure/events/models/FirstEvent.java"));
        Assertions.assertEquals(1L, generatedPaths.get("src/main/java/com/azure/events/models/SecondEvent.java"));
        Assertions.assertEquals(1L, generatedPaths.get("src/main/java/com/azure/shared/models/SharedEvent.java"));
        Assertions.assertEquals(1L,
            generatedPaths.get("src/main/java/com/azure/mock/implementation/FirstEventSerializer.java"));
    }

    @Test
    public void unusedInlineOperationMetadataDoesNotEmitRuntimeOrModels() {
        TypeSpecPlugin plugin = new TypeSpecPlugin(new EmitterOptions().setNamespace("com.azure.mock"), false);
        configureJavaSettings(Map.of("namespace", "com.azure.mock", "flavor", "azure"));
        CodeModel model = codeModel(
            List.of(group("", operation("read", metadata("unused", "UnusedEvents", "com.azure.mock"), false, false))));
        JavaPackage javaPackage = new JavaPackage(plugin);
        Client client = plugin.processClient(model);
        Assertions.assertTrue(sseModels(client).isEmpty());
        plugin.writeHelperClasses(client, model, javaPackage, JavaSettings.getInstance());
        Assertions.assertTrue(javaPackage.getJavaFiles().isEmpty());
    }

    @Test
    public void processClientIgnoresUnusedRootOperationMetadata() {
        TypeSpecPlugin plugin = new TypeSpecPlugin(new EmitterOptions().setNamespace("com.azure.mock"), false);
        configureJavaSettings(Map.of("namespace", "com.azure.mock", "flavor", "azure"));
        CodeModel model
            = codeModel(List.of(group("", operation("rootMalformed", malformedMetadata("root-stream"), false, false))));

        Assertions.assertTrue(sseModels(plugin.processClient(model)).isEmpty());
    }

    @Test
    public void processClientIgnoresUnusedDirectClientOperationMetadata() {
        TypeSpecPlugin plugin = new TypeSpecPlugin(new EmitterOptions().setNamespace("com.azure.mock"), false);
        configureJavaSettings(Map.of("namespace", "com.azure.mock", "flavor", "azure"));
        CodeModel model = codeModel(List.of());
        model.setClients(List.of(codeModelClient("DirectClient",
            List.of(group("", operation("directMalformed", malformedMetadata("direct-stream"), false, false))),
            List.of())));

        Assertions.assertTrue(sseModels(plugin.processClient(model)).isEmpty());
    }

    @Test
    public void processClientIgnoresUnusedSharedNestedSubclientMetadata() {
        TypeSpecPlugin plugin = new TypeSpecPlugin(new EmitterOptions().setNamespace("com.azure.mock"), false);
        configureJavaSettings(Map.of("namespace", "com.azure.mock", "flavor", "azure"));
        com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Client shared
            = codeModelClient("SharedClient",
                List.of(group("", operation("nestedMalformed", malformedMetadata("nested-stream"), false, false))),
                List.of());
        com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Client first
            = codeModelClient("FirstClient", List.of(), List.of(shared));
        com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Client second
            = codeModelClient("SecondClient", List.of(), List.of(shared));
        CodeModel model = codeModel(List.of());
        model.setClients(List.of(first, second));

        Assertions.assertTrue(sseModels(plugin.processClient(model)).isEmpty());
    }

    @Test
    public void processClientRejectsAmbiguousImmediateSseParent() {
        TypeSpecPlugin plugin = new TypeSpecPlugin(new EmitterOptions().setNamespace("com.azure.mock"), false);
        configureJavaSettings(sseSettings("all", false, true));
        SseMetadata metadata = metadata("ambiguous-parent", "Events", "com.azure.mock");
        ObjectSchema expectedBase = sseObjectSchema("EventsEvent", "com.azure.mock");
        ObjectSchema otherBase = sseObjectSchema("OtherEvent", "com.azure.mock");
        Relations parents = new Relations();
        parents.setImmediate(List.of(otherBase, expectedBase));
        parents.setAll(List.of(otherBase, expectedBase));
        metadata.getEvents().get(0).getEventSchema().setParents(parents);
        CodeModel model = codeModel(List.of(group("", operation("ambiguousParent", metadata, false, true))));

        assertInvalidMetadata(plugin, model, "ambiguousParent", "ambiguous-parent",
            "event 'message' schema does not inherit from the operation's base schema");
    }

    @Test
    public void processClientRejectsMissingImmediateSseParent() {
        TypeSpecPlugin plugin = new TypeSpecPlugin(new EmitterOptions().setNamespace("com.azure.mock"), false);
        configureJavaSettings(sseSettings("all", false, true));
        SseMetadata metadata = metadata("missing-parent", "Events", "com.azure.mock");
        metadata.getEvents().get(0).getEventSchema().setParents(null);
        CodeModel model = codeModel(List.of(group("", operation("missingParent", metadata, false, true))));

        assertInvalidMetadata(plugin, model, "missingParent", "missing-parent",
            "event 'message' schema does not inherit from the operation's base schema");
    }

    @Test
    public void processClientRejectsMismatchedSseEventNamespace() {
        TypeSpecPlugin plugin = new TypeSpecPlugin(new EmitterOptions().setNamespace("com.azure.mock"), false);
        configureJavaSettings(sseSettings("all", false, true));
        SseMetadata metadata = metadata("mismatched-namespace", "Events", "com.azure.mock");
        metadata.getEvents()
            .get(0)
            .getEventSchema()
            .setLanguage(languages("EventsMessageStreamEvent", "com.azure.other"));
        CodeModel model = codeModel(List.of(group("", operation("mismatchedNamespace", metadata, false, true))));

        IllegalStateException exception
            = Assertions.assertThrows(IllegalStateException.class, () -> plugin.processClient(model));

        Assertions.assertTrue(exception.getMessage().contains("com.azure.other"), exception.getMessage());
        Assertions.assertTrue(exception.getMessage().contains("com.azure.mock"), exception.getMessage());
        Assertions.assertTrue(exception.getMessage().contains("package-private"), exception.getMessage());
        Assertions.assertTrue(ClientModels.getInstance()
            .getModels()
            .stream()
            .noneMatch(mapped -> mapped.hasUsage(ImplementationDetails.Usage.SSE)));
    }

    @Test
    public void mapsFinalConvenienceUsageBeforeHelperEmission() {
        TypeSpecPlugin plugin = new TypeSpecPlugin(new EmitterOptions().setNamespace("com.azure.mock"), false);
        configureJavaSettings(sseSettings("all", false, true));
        SseMetadata shared = metadata("shared", "SharedEvents", "com.azure.shared");
        SseMetadata repeatedShared = copyMetadataWithRegisteredSchemas(shared);
        SseMetadata internal = metadata("internal", "InternalEvents", "com.azure.internal");
        SseMetadata unused = metadata("unused", "UnusedEvents", "com.azure.unused");
        Operation first = operation("readFirst", shared, false, true);
        Operation second = operation("readSecond", repeatedShared, false, true);
        Operation internalOperation = operation("readInternal", internal, true, true);
        CodeModel codeModel = codeModel(List.of(group("", first, second), group("Admin", internalOperation),
            group("Unused", operation("readUnused", unused, false, false))));

        ClientMethodMapper.getInstance().map(first, false);
        Client client = plugin.processClient(codeModel);

        Assertions.assertEquals(List.of("SharedEvents", "InternalEvents"),
            sseBaseModels(client).stream()
                .map(model -> model.getSseMetadata().getStreamName())
                .collect(Collectors.toList()),
            () -> describeClients(client));
        Assertions.assertNotSame(shared, repeatedShared);
        JavaPackage javaPackage = new JavaPackage(plugin);
        client.getModels()
            .forEach(clientModel -> javaPackage.addModel(clientModel.getPackage(), clientModel.getName(), clientModel));
        plugin.writeHelperClasses(client, codeModel, javaPackage, JavaSettings.getInstance());
        String generatedPaths
            = javaPackage.getJavaFiles().stream().map(file -> file.getFilePath()).collect(Collectors.joining("\n"));
        Assertions.assertTrue(generatedPaths.contains("SharedEvent.java"), generatedPaths);
        Assertions.assertTrue(generatedPaths.contains("InternalEvent.java"), generatedPaths);
        Assertions.assertTrue(generatedPaths.contains("SharedEventSerializer.java"), generatedPaths);
        Assertions.assertTrue(generatedPaths.contains("ServerSentEventStreamHelper.java"), generatedPaths);
        Assertions.assertFalse(generatedPaths.contains("SharedEventConverter.java"), generatedPaths);
        Assertions.assertFalse(generatedPaths.contains("ServerSentEventStreams.java"), generatedPaths);
        Assertions.assertFalse(generatedPaths.contains("ServerSentEventStream.java"), generatedPaths);
        Assertions.assertFalse(generatedPaths.contains("UnusedEvent.java"), generatedPaths);

        CodeModel later = codeModel(List.of(group("", operation("readLater", unused, false, false))));
        ClientModels.getInstance().clear();
        Client laterClient = ClientMapper.getInstance().map(later);
        Assertions.assertTrue(sseModels(laterClient).isEmpty());
        JavaPackage laterPackage = new JavaPackage(plugin);
        plugin.writeHelperClasses(laterClient, later, laterPackage, JavaSettings.getInstance());
        Assertions.assertTrue(laterPackage.getJavaFiles().isEmpty());
    }

    @Test
    public void collectsUsageAcrossSupportedSyncConfigurations() {
        for (Object[] configuration : List.of(new Object[] { "all", false }, new Object[] { "all", true },
            new Object[] { "sync-only", true }, new Object[] { "essential", false })) {
            ClientModels.getInstance().clear();
            String syncMethods = (String) configuration[0];
            boolean syncStack = (boolean) configuration[1];
            configureJavaSettings(sseSettings(syncMethods, syncStack, true));
            SseMetadata metadata = metadata("configured", "ConfiguredEvents", "com.azure.configured");
            CodeModel codeModel = codeModel(List.of(group("", operation("read", metadata, false, true))));

            Client client = ClientMapper.getInstance().map(codeModel);

            Assertions.assertEquals(List.of("ConfiguredEvents"),
                sseBaseModels(client).stream()
                    .map(model -> model.getSseMetadata().getStreamName())
                    .collect(Collectors.toList()),
                () -> syncMethods + " syncStack=" + syncStack + " " + describeClients(client));
        }
    }

    @Test
    public void sourceEligibilityMatchesRenderedUsageAcrossBackendSettings() {
        TypeSpecPlugin plugin = new TypeSpecPlugin(new EmitterOptions().setNamespace("com.azure.mock"), false);
        for (String syncMethods : List.of("all", "essential", "sync-only", "none")) {
            for (boolean syncStack : List.of(false, true)) {
                for (boolean wrappers : List.of(false, true)) {
                    for (boolean convenience : List.of(false, true)) {
                        ClientModels.getInstance().clear();
                        configureJavaSettings(sseSettings(syncMethods, syncStack, wrappers));
                        SseMetadata metadata = metadata("eligibility", "EligibilityEvents", "com.azure.mock");
                        Operation operation = operation("readEligibility", metadata, false, convenience);
                        CodeModel model = codeModel(List.of(group("", operation)));
                        boolean candidate = SseUtil.isSseModelConsumer(operation);

                        Client client = ClientMapper.getInstance().map(model);

                        Assertions.assertEquals(!sseBaseModels(client).isEmpty(), candidate, syncMethods + " syncStack="
                            + syncStack + " wrappers=" + wrappers + " convenience=" + convenience);
                        Assertions.assertEquals(candidate,
                            rendersSseConsumer(plugin, model, client, "EligibilityEvent"));
                    }
                }
            }
        }
    }

    @Test
    public void sourceEligibilityMatchesInternalAndHiddenProtocolConsumers() {
        TypeSpecPlugin plugin = new TypeSpecPlugin(new EmitterOptions().setNamespace("com.azure.mock"), false);
        for (boolean internal : List.of(false, true)) {
            for (boolean protocol : List.of(false, true)) {
                for (boolean emptyRequests : List.of(false, true)) {
                    ClientModels.getInstance().clear();
                    configureJavaSettings(sseSettings("all", false, true));
                    Operation operation = operation("read",
                        metadata("visibility", "VisibilityEvents", "com.azure.mock"), internal, true);
                    operation.setGenerateProtocolApi(protocol);
                    if (emptyRequests) {
                        operation.getConvenienceApi().setRequests(List.of());
                    }
                    boolean candidate = SseUtil.isSseModelConsumer(operation);

                    CodeModel model = codeModel(List.of(group("", operation)));
                    Client client = ClientMapper.getInstance().map(model);

                    Assertions.assertEquals(!sseBaseModels(client).isEmpty(), candidate,
                        "internal=" + internal + " protocol=" + protocol + " emptyRequests=" + emptyRequests);
                    Assertions.assertEquals(candidate, rendersSseConsumer(plugin, model, client, "VisibilityEvent"));
                }
            }
        }
    }

    private static boolean rendersSseConsumer(TypeSpecPlugin plugin, CodeModel model, Client client, String baseName) {
        return plugin.processTemplates(model, client, JavaSettings.getInstance())
            .getJavaFiles()
            .stream()
            .anyMatch(file -> file.getContents().toString().contains(baseName + "Serializer::deserialize"));
    }

    @Test
    public void sourceEligibilityPreservesEffectiveLroPrecedence() {
        TypeSpecPlugin plugin = new TypeSpecPlugin(new EmitterOptions().setNamespace("com.azure.mock"), false);
        for (boolean polling : List.of(false, true)) {
            ClientModels.getInstance().clear();
            Map<String, String> settings = sseSettings("all", false, true);
            if (polling) {
                settings.put("polling", "{}");
            }
            configureJavaSettings(settings);
            Operation operation = operation("read", metadata("lro", "LroEvents", "com.azure.mock"), false, true);
            XmsExtensions extensions = new XmsExtensions();
            extensions.setXmsLongRunningOperation(true);
            operation.setExtensions(extensions);
            CodeModel model = codeModel(List.of(group("", operation)));

            Client client = plugin.processClient(model);

            Assertions.assertEquals(!polling, SseUtil.isSseModelConsumer(operation));
            Assertions.assertEquals(!polling, !sseBaseModels(client).isEmpty());
            Assertions.assertEquals(!polling, rendersSseConsumer(plugin, model, client, "LroEvent"));
        }
    }

    @Test
    public void sourceEligibilityPreservesPagingPrecedence() {
        TypeSpecPlugin plugin = new TypeSpecPlugin(new EmitterOptions().setNamespace("com.azure.mock"), false);
        configureJavaSettings(sseSettings("all", false, true));
        Operation operation = operation("read", metadata("paged", "PagedEvents", "com.azure.mock"), false, true);
        ArraySchema items = new ArraySchema();
        items.setType(Schema.AllSchemaTypes.ARRAY);
        items.setElementType(stringSchema());
        items.getElementType().setLanguage(languages("String"));
        items.setLanguage(languages("Items"));
        ObjectSchema result = ordinarySchema("PagedResult", "com.azure.mock");
        result.setProperties(List.of(sseProperty("items", items), sseProperty("nextLink", stringSchema())));
        operation.getResponses().get(0).setSchema(result);
        XmsPageable pageable = new XmsPageable();
        pageable.setItemName("items");
        pageable.setNextLinkName("nextLink");
        XmsExtensions extensions = new XmsExtensions();
        extensions.setXmsPageable(pageable);
        operation.setExtensions(extensions);
        CodeModel model = codeModel(List.of(group("", operation)));
        model.getSchemas().getObjects().add(0, result);

        Client client = plugin.processClient(model);

        Assertions.assertFalse(SseUtil.isSseModelConsumer(operation));
        Assertions.assertTrue(sseBaseModels(client).isEmpty());
        Assertions.assertFalse(rendersSseConsumer(plugin, model, client, "PagedEvent"));
    }

    @Test
    public void responseOverridesDoNotSuppressTypedSseConsumers() {
        TypeSpecPlugin plugin = new TypeSpecPlugin(new EmitterOptions().setNamespace("com.azure.mock"), false);
        for (boolean binary : List.of(false, true)) {
            ClientModels.getInstance().clear();
            configureJavaSettings(sseSettings("all", false, true));
            Operation operation
                = operation("read", metadata("override", "OverrideEvents", "com.azure.mock"), false, true);
            Response override = new Response();
            override.setBinary(binary);
            operation.getConvenienceApi().setResponse(override);
            CodeModel model = codeModel(List.of(group("", operation)));

            Client client = plugin.processClient(model);

            Assertions.assertTrue(SseUtil.isSseModelConsumer(operation));
            Assertions.assertTrue(rendersSseConsumer(plugin, model, client, "OverrideEvent"));
        }
    }

    @Test
    public void finalizesModelsBeforeConvenienceMethods() {
        TypeSpecPlugin plugin = new TypeSpecPlugin(new EmitterOptions().setNamespace("com.azure.mock"), false);
        Map<String, String> settings = sseSettings("all", false, true);
        settings.put("generic-response-type", "false");
        configureJavaSettings(settings);
        int[] finalizations = { 0 };
        int[] convenienceMappings = { 0 };
        List<ClientModel> finalizedModels = new ArrayList<>();
        Mappers.setFactory(new TypeSpecMapperFactory() {
            private final ClientMethodMapper methodMapper = new ClientMethodMapper() {
                @Override
                public List<ClientMethod> map(Operation operation, boolean protocol) {
                    if (!protocol && operation.getSseMetadata() != null) {
                        Assertions.assertEquals(1, finalizations[0],
                            "Models and packages must be finalized before convenience methods");
                        Assertions.assertEquals(finalizedModels, ClientModels.getInstance().getModels(),
                            "Convenience methods must consume the finalized model registry");
                        Assertions.assertEquals(2,
                            ClientModels.getInstance()
                                .getModels()
                                .stream()
                                .filter(model -> model.getSseMetadata() != null)
                                .count(),
                            "SSE models must be mapped before convenience methods");
                        convenienceMappings[0]++;
                    }
                    return super.map(operation, protocol);
                }
            };

            @Override
            public ClientMethodMapper getClientMethodMapper() {
                return methodMapper;
            }

            @Override
            public ClientMapper getClientMapper() {
                return new TypeSpecClientMapper() {
                    @Override
                    protected List<String> getModelsPackages(List<ClientModel> models, List<EnumType> enums,
                        List<ClientResponse> responses) {
                        Assertions.assertEquals(0, convenienceMappings[0],
                            "Model package finalization must precede convenience methods");
                        finalizations[0]++;
                        finalizedModels.addAll(models);
                        return super.getModelsPackages(models, enums, responses);
                    }
                };
            }
        });

        Operation operation = operation("read", metadata("sequence", "SequenceEvents", "com.azure.mock"), false, true);
        Header header = new Header();
        header.setHeader("x-sequence");
        header.setSchema(stringSchema());
        header.setLanguage(languages("sequence"));
        operation.getResponses().get(0).getProtocol().getHttp().setHeaders(List.of(header));
        CodeModel model = codeModel(List.of(group("", operation)));
        model.getSchemas().getObjects().add(0, ordinarySchema("ReadResponse", "com.azure.mock"));
        model.getSchemas().getObjects().add(0, ordinarySchema("Auxiliary", "com.azure.aux"));
        Client client = plugin.processClient(model);

        Assertions.assertEquals(1, finalizations[0]);
        Assertions.assertTrue(convenienceMappings[0] > 0);
        Assertions.assertEquals(finalizedModels, client.getModels());
        Assertions.assertEquals(finalizedModels, ClientModels.getInstance().getModels());
        Assertions.assertTrue(client.getModels().stream().anyMatch(mapped -> mapped.getName().equals("Auxiliary")));
        Assertions.assertTrue(
            client.getPackageInfos().stream().anyMatch(info -> info.getPackage().equals("com.azure.aux.models")));
        Assertions.assertTrue(client.getModuleInfo()
            .getExportModules()
            .stream()
            .anyMatch(module -> module.getModuleName().equals("com.azure.aux.models")));
        Assertions.assertEquals("ReadResponseResponse",
            ClientMapper.getClientResponseClassType(operation, client.getModels(), JavaSettings.getInstance())
                .getName());
        Assertions.assertEquals("ReadResponseResponse", client.getResponseModels().get(0).getName());
    }

    @Test
    public void excludesUsageWhenWrapperOrConvenienceGenerationIsDisabled() {
        SseMetadata metadata = metadata("disabled", "DisabledEvents", "com.azure.disabled");
        for (boolean wrappersEnabled : List.of(false, true)) {
            ClientModels.getInstance().clear();
            configureJavaSettings(sseSettings("all", false, wrappersEnabled));
            CodeModel codeModel
                = codeModel(List.of(group("", operation("read", metadata, false, wrappersEnabled ? false : true))));

            Client client = ClientMapper.getInstance().map(codeModel);

            Assertions.assertTrue(sseModels(client).isEmpty(), "wrappersEnabled=" + wrappersEnabled);
        }
    }

    @Test
    public void doesNotWriteSseOnlyModelsOrHelpers() {
        TypeSpecPlugin plugin = new TypeSpecPlugin(new EmitterOptions().setNamespace("com.azure.mock"), false);
        configureJavaSettings(sseSettings("all", false, true));
        SseMetadata metadata = metadata("unused", "UnusedEvents", "com.azure.unused");
        metadata.getBaseSchema().setUsage(Set.of(SchemaContext.SSE));
        metadata.getEvents().forEach(event -> event.getEventSchema().setUsage(Set.of(SchemaContext.SSE)));
        CodeModel model = codeModel(List.of(group("", operation("read", metadata, false, false))));
        Client client = plugin.processClient(model);
        Assertions.assertTrue(sseModels(client).isEmpty());
        Assertions.assertTrue(client.getModuleInfo()
            .getExportModules()
            .stream()
            .noneMatch(module -> module.getModuleName().equals("com.azure.unused.models")));

        client.getModels().add(Mappers.getModelMapper().map(metadata.getBaseSchema()));
        metadata.getEvents()
            .forEach(event -> client.getModels().add(Mappers.getModelMapper().map(event.getEventSchema())));
        JavaPackage javaPackage = plugin.processTemplates(model, client, JavaSettings.getInstance());
        Assertions.assertTrue(javaPackage.getJavaFiles()
            .stream()
            .noneMatch(file -> file.getFilePath().contains("Unused")
                || file.getFilePath().contains("ServerSentEvent")
                || file.getFilePath().contains("com/azure/unused/")));
    }

    @Test
    public void preservesCustomPackageInfoWhenNoModelPackagesAreGenerated() {
        TypeSpecPlugin plugin = new TypeSpecPlugin(new EmitterOptions().setNamespace("com.azure.mock"), false);
        Map<String, String> settings = sseSettings("all", false, true);
        settings.put("custom-types", "CustomType");
        settings.put("custom-types-subpackage", "custom");
        configureJavaSettings(settings);

        Client client = plugin.processClient(codeModel(List.of()));

        Assertions.assertTrue(client.getModels().isEmpty());
        Assertions.assertTrue(
            client.getPackageInfos().stream().anyMatch(info -> info.getPackage().equals("com.azure.mock.custom")));
    }

    @Test
    public void admitsSharedConsumersOnlyFromMappedClientsInEitherOrder() {
        TypeSpecPlugin plugin = new TypeSpecPlugin(new EmitterOptions().setNamespace("com.azure.mock"), false);
        for (boolean protocolFirst : List.of(false, true)) {
            ClientModels.getInstance().clear();
            configureJavaSettings(sseSettings("all", false, true));
            SseMetadata shared = metadata("shared", "SharedEvents", "com.azure.shared");
            SseMetadata unmapped = metadata("root", "RootEvents", "com.azure.root");
            OperationGroup root = group("", operation("readRoot", unmapped, false, true));
            OperationGroup first = group("", operation("readFirst", shared, false, !protocolFirst));
            OperationGroup second
                = group("", operation("readSecond", copyMetadataWithRegisteredSchemas(shared), true, protocolFirst));
            CodeModel model = codeModel(List.of(root, first, second));
            model.setOperationGroups(List.of(root));
            var secondClient = codeModelClient("SecondClient", List.of(second), List.of());
            model.setClients(
                List.of(codeModelClient("FirstClient", List.of(first), List.of(secondClient)), secondClient));

            Client client = plugin.processClient(model);

            Assertions.assertEquals(List.of("SharedEvents"),
                sseBaseModels(client).stream()
                    .map(base -> base.getSseMetadata().getStreamName())
                    .collect(Collectors.toList()));
            Assertions.assertTrue(rendersSseConsumer(plugin, model, client, "SharedEvent"));
            Assertions.assertFalse(rendersSseConsumer(plugin, model, client, "RootEvent"));
        }
    }

    @Test
    public void processClientNormalizesRawSseNamesBeforeRendering() {
        TypeSpecPlugin plugin = new TypeSpecPlugin(new EmitterOptions().setNamespace("com.azure.mock"), false);
        configureJavaSettings(sseSettings("all", false, true));
        SseMetadata digitEvent = rawMetadata("digit-event", "StreamEvents", "com.azure.mock", "StreamEvent", "123.done",
            "123DoneStreamEvent");
        SseMetadata digitStream
            = rawMetadata("digit-stream", "123Events", "com.azure.mock", "123Event", "done", "123EventDoneStreamEvent");
        SseMetadata punctuation = rawMetadata("punctuation", "Retry.Events", "com.azure.mock", "Retry.Event", "done",
            "Retry.EventDoneStreamEvent");
        CodeModel model = codeModel(List.of(group("", operation("readDigitEvent", digitEvent, false, true),
            operation("readDigitStream", digitStream, false, true),
            operation("readPunctuation", punctuation, false, true))));

        Assertions.assertNull(digitEvent.getBaseSchema().getLanguage().getJava().getName());
        Assertions.assertNull(digitEvent.getEvents().get(0).getEventSchema().getLanguage().getJava().getName());

        Client client = plugin.processClient(model);

        Assertions.assertEquals("StreamEvent", digitEvent.getBaseSchema().getLanguage().getDefault().getName());
        Assertions.assertEquals("123DoneStreamEvent",
            digitEvent.getEvents().get(0).getEventSchema().getLanguage().getDefault().getName());
        Assertions.assertEquals("OneTwoThreeDoneStreamEvent",
            digitEvent.getEvents().get(0).getEventSchema().getLanguage().getJava().getName());
        Assertions.assertEquals("OneTwoThreeEvent", digitStream.getBaseSchema().getLanguage().getJava().getName());
        Assertions.assertEquals("RetryEvent", punctuation.getBaseSchema().getLanguage().getJava().getName());
        Assertions.assertSame(digitEvent.getBaseSchema(),
            digitEvent.getEvents().get(0).getEventSchema().getParents().getImmediate().get(0));
        Assertions.assertSame(digitEvent.getBaseSchema(),
            digitEvent.getEvents().get(0).getEventSchema().getParents().getAll().get(0));

        JavaPackage javaPackage = new JavaPackage(plugin);
        client.getModels()
            .forEach(clientModel -> javaPackage.addModel(clientModel.getPackage(), clientModel.getName(), clientModel));
        plugin.writeHelperClasses(client, model, javaPackage, JavaSettings.getInstance());
        Map<String, String> sources = javaPackage.getJavaFiles()
            .stream()
            .collect(Collectors.toMap(file -> file.getFilePath(), file -> file.getContents().toString()));
        Assertions.assertTrue(
            sources.containsKey("src/main/java/com/azure/mock/models/OneTwoThreeDoneStreamEvent.java"),
            sources.keySet().toString());
        Assertions.assertTrue(sources.containsKey("src/main/java/com/azure/mock/models/OneTwoThreeEvent.java"),
            sources.keySet().toString());
        Assertions.assertTrue(sources.containsKey("src/main/java/com/azure/mock/models/RetryEvent.java"),
            sources.keySet().toString());
        Assertions.assertTrue(sources.get("src/main/java/com/azure/mock/models/OneTwoThreeDoneStreamEvent.java")
            .contains("public final class OneTwoThreeDoneStreamEvent extends StreamEvent"));
        Assertions.assertTrue(sources.get("src/main/java/com/azure/mock/models/OneTwoThreeEvent.java")
            .contains("public abstract class OneTwoThreeEvent"));
    }

    @Test
    public void renderingRejectsDistinctRawSseNamesWithTheSameFinalPath() {
        TypeSpecPlugin plugin = new TypeSpecPlugin(new EmitterOptions().setNamespace("com.azure.mock"), false);
        configureJavaSettings(sseSettings("all", false, true));
        SseMetadata numeric
            = rawMetadata("numeric", "123Events", "com.azure.mock", "123Event", "done", "123EventDoneStreamEvent");
        SseMetadata words = rawMetadata("words", "OneTwoThreeEvents", "com.azure.mock", "OneTwoThreeEvent", "done",
            "OneTwoThreeEventDoneStreamEvent");
        CodeModel model = codeModel(List
            .of(group("", operation("readNumeric", numeric, false, true), operation("readWords", words, false, true))));

        IllegalStateException exception
            = Assertions.assertThrows(IllegalStateException.class, () -> plugin.processClient(model));

        Assertions.assertTrue(exception.getMessage().contains("OneTwoThreeEvent"), exception.getMessage());
        Assertions.assertTrue(ClientModels.getInstance()
            .getModels()
            .stream()
            .noneMatch(mapped -> mapped.hasUsage(ImplementationDetails.Usage.SSE)));
    }

    @Test
    public void renderingRejectsOrdinaryModelAndRawSseNamesWithTheSameFinalPath() {
        TypeSpecPlugin plugin = new TypeSpecPlugin(new EmitterOptions().setNamespace("com.azure.mock"), false);
        configureJavaSettings(sseSettings("all", false, true));
        SseMetadata numeric
            = rawMetadata("numeric", "123Events", "com.azure.mock", "123Event", "done", "123EventDoneStreamEvent");
        CodeModel model = codeModel(List.of(group("", operation("readNumeric", numeric, false, true))));
        model.getSchemas().getObjects().add(0, ordinarySchema("OneTwoThreeEvent", "com.azure.mock"));

        IllegalStateException exception
            = Assertions.assertThrows(IllegalStateException.class, () -> plugin.processClient(model));

        Assertions.assertTrue(exception.getMessage().contains("OneTwoThreeEvent"), exception.getMessage());
        Assertions.assertTrue(ClientModels.getInstance()
            .getModels()
            .stream()
            .noneMatch(mapped -> mapped.hasUsage(ImplementationDetails.Usage.SSE)));
    }

    @Test
    public void unusedRegisteredSseSchemasDoNotBlockGeneration() {
        TypeSpecPlugin plugin = new TypeSpecPlugin(new EmitterOptions().setNamespace("com.azure.mock"), false);
        configureJavaSettings(sseSettings("all", false, true));
        SseMetadata used = metadata("used", "UsedEvents", "com.azure.used");
        CodeModel model = codeModel(List.of(group("", operation("read", used, false, true))));
        ObjectSchema unused = metadata("unused", "UnusedEvents", "com.azure.unused").getBaseSchema();
        unused.setSseMetadata(null);
        model.getSchemas().getObjects().add(unused);

        Client client = plugin.processClient(model);

        Assertions.assertEquals(2, sseModels(client).size());
        Assertions.assertTrue(sseModels(client).stream()
            .allMatch(mapped -> mapped.getSseMetadata().getStreamName().equals("UsedEvents")));
    }

    @Test
    public void disabledConsumersDoNotValidateUnusedRenderingData() {
        TypeSpecPlugin plugin = new TypeSpecPlugin(new EmitterOptions().setNamespace("com.azure.mock"), false);
        configureJavaSettings(sseSettings("all", false, false));
        SseMetadata metadata = metadata("disabled", "DisabledEvents", "com.azure.disabled");
        CodeModel model = codeModel(List.of(group("", operation("read", metadata, false, true))));
        metadata.getEvents().get(0).getEventSchema().getSseMetadata().setTerminal(true);

        Client client = plugin.processClient(model);

        Assertions.assertTrue(sseModels(client).isEmpty());
    }

    @Test
    public void admissionRejectsMissingOrConflictingRenderingDataBeforeMappingModels() {
        configureJavaSettings(sseSettings("all", false, true));
        List<Consumer<SseMetadata>> mutations
            = List.of(metadata -> metadata.setBaseSchema(null), metadata -> metadata.setStreamName(""),
                metadata -> metadata.setEvents(null), metadata -> metadata.setEvents(List.of()),
                metadata -> metadata.setEvents(java.util.Collections.singletonList(null)),
                metadata -> metadata.getBaseSchema().setSseMetadata(null),
                metadata -> metadata.getBaseSchema().getSseMetadata().setStreamName("OtherEvents"),
                metadata -> metadata.getBaseSchema().getSseMetadata().setEventName("message"),
                metadata -> metadata.getBaseSchema().getSseMetadata().setTerminal(true),
                metadata -> metadata.getEvents().get(0).setName(""),
                metadata -> metadata.getEvents().get(0).setEventSchema(null),
                metadata -> metadata.getEvents().get(0).getEventSchema().setSseMetadata(null),
                metadata -> metadata.getEvents().get(0).getEventSchema().getSseMetadata().setStreamName("OtherEvents"),
                metadata -> metadata.getEvents().get(0).getEventSchema().getSseMetadata().setEventName("other"),
                metadata -> metadata.getEvents().get(0).getEventSchema().getSseMetadata().setTerminal(true),
                metadata -> metadata.getEvents().get(0).getEventSchema().setParents(emptyRelations()));
        for (Consumer<SseMetadata> mutate : mutations) {
            ClientModels.getInstance().clear();
            SseMetadata metadata = metadata("admission", "AdmissionEvents", "com.azure.mock");
            CodeModel model = codeModel(List.of(group("", operation("read", metadata, false, true))));
            mutate.accept(metadata);

            IllegalStateException exception
                = Assertions.assertThrows(IllegalStateException.class, () -> ClientMapper.getInstance().map(model));

            Assertions.assertTrue(exception.getMessage().contains("operation 'read'"), exception.getMessage());
            Assertions.assertTrue(exception.getMessage().contains("stream ID 'admission'"), exception.getMessage());
            Assertions.assertTrue(ClientModels.getInstance()
                .getModels()
                .stream()
                .noneMatch(mapped -> mapped.hasUsage(ImplementationDetails.Usage.SSE)));
        }
    }

    @Test
    public void rejectsConflictingRenderingDescriptorsBeforeMappingModels() {
        TypeSpecPlugin plugin = new TypeSpecPlugin(new EmitterOptions().setNamespace("com.azure.mock"), false);
        configureJavaSettings(sseSettings("all", false, true));
        SseMetadata first = metadata("shared", "SharedEvents", "com.azure.mock");
        SseMetadata second = copyMetadataWithRegisteredSchemas(first);
        second.getEvents().get(0).setTerminal(true);
        CodeModel model = codeModel(List
            .of(group("", operation("readFirst", first, false, true), operation("readSecond", second, false, true))));

        IllegalStateException exception
            = Assertions.assertThrows(IllegalStateException.class, () -> plugin.processClient(model));

        Assertions.assertTrue(exception.getMessage().contains("schema rendering metadata"), exception.getMessage());
        Assertions.assertTrue(exception.getMessage().contains("readSecond"), exception.getMessage());
        Assertions.assertTrue(ClientModels.getInstance()
            .getModels()
            .stream()
            .noneMatch(mapped -> mapped.hasUsage(ImplementationDetails.Usage.SSE)));
    }

    private static SseMetadata metadata(String id, String streamName, String namespace) {
        StringSchema payload = new StringSchema();
        payload.setType(Schema.AllSchemaTypes.STRING);
        String baseName
            = streamName.endsWith("Events") ? streamName.substring(0, streamName.length() - 1) : streamName + "Event";
        ObjectSchema baseSchema = sseObjectSchema(baseName, namespace);
        baseSchema.setProperties(List.of(sseProperty("eventName", stringSchema())));
        ObjectSchema eventSchema
            = sseObjectSchema(baseName.replaceFirst("Event$", "") + "MessageStreamEvent", namespace);
        Relations parents = new Relations();
        parents.setImmediate(List.of(baseSchema));
        parents.setAll(List.of(baseSchema));
        eventSchema.setParents(parents);
        eventSchema.setProperties(List.of(sseProperty("value", payload)));
        SseEventMetadata event = new SseEventMetadata();
        event.setName("message");
        event.setEventSchema(eventSchema);
        SseMetadata metadata = new SseMetadata();
        metadata.setSseStreamId(id);
        metadata.setStreamName(streamName);
        metadata.setBaseSchema(baseSchema);
        metadata.setEvents(List.of(event));
        prepareSseFamily(metadata);
        return metadata;
    }

    private static SseMetadata rawMetadata(String id, String streamName, String namespace, String baseName,
        String eventName, String eventSchemaName) {
        StringSchema payload = new StringSchema();
        payload.setType(Schema.AllSchemaTypes.STRING);
        ObjectSchema baseSchema = rawSseObjectSchema(baseName, namespace);
        baseSchema.setProperties(List.of(rawSseProperty("eventName", stringSchema(), namespace)));
        ObjectSchema eventSchema = rawSseObjectSchema(eventSchemaName, namespace);
        Relations parents = new Relations();
        parents.setImmediate(List.of(baseSchema));
        parents.setAll(List.of(baseSchema));
        eventSchema.setParents(parents);
        eventSchema.setProperties(List.of(rawSseProperty("value", payload, namespace)));
        SseEventMetadata event = new SseEventMetadata();
        event.setName(eventName);
        event.setEventSchema(eventSchema);
        SseMetadata metadata = new SseMetadata();
        metadata.setSseStreamId(id);
        metadata.setStreamName(streamName);
        metadata.setBaseSchema(baseSchema);
        metadata.setEvents(List.of(event));
        prepareSseFamily(metadata);
        return metadata;
    }

    private static void prepareSseFamily(SseMetadata metadata) {
        SseSchemaMetadata baseMetadata = new SseSchemaMetadata();
        baseMetadata.setStreamName(metadata.getStreamName());
        metadata.getBaseSchema().setSseMetadata(baseMetadata);
        metadata.getBaseSchema().setUsage(Set.of(SchemaContext.OUTPUT, SchemaContext.PUBLIC, SchemaContext.SSE));
        List<Schema> eventSchemas
            = metadata.getEvents().stream().map(SseEventMetadata::getEventSchema).collect(Collectors.toList());
        Relations children = new Relations();
        children.setImmediate(eventSchemas);
        children.setAll(eventSchemas);
        metadata.getBaseSchema().setChildren(children);
        for (SseEventMetadata event : metadata.getEvents()) {
            event.getEventSchema().setUsage(Set.of(SchemaContext.OUTPUT, SchemaContext.PUBLIC, SchemaContext.SSE));
            SseSchemaMetadata eventMetadata = new SseSchemaMetadata();
            eventMetadata.setStreamName(metadata.getStreamName());
            eventMetadata.setEventName(event.getName());
            eventMetadata.setTerminal(event.isTerminal());
            event.getEventSchema().setSseMetadata(eventMetadata);
        }
    }

    private static SseMetadata copyMetadataWithRegisteredSchemas(SseMetadata source) {
        SseMetadata copy = new SseMetadata();
        copy.setSseStreamId(source.getSseStreamId());
        copy.setStreamName(source.getStreamName());
        copy.setBaseSchema(source.getBaseSchema());
        copy.setEvents(source.getEvents().stream().map(sourceEvent -> {
            SseEventMetadata event = new SseEventMetadata();
            event.setName(sourceEvent.getName());
            event.setEventSchema(sourceEvent.getEventSchema());
            event.setTerminal(sourceEvent.isTerminal());
            return event;
        }).collect(Collectors.toList()));
        return copy;
    }

    private static ObjectSchema rawSseObjectSchema(String name, String namespace) {
        ObjectSchema schema = new ObjectSchema();
        schema.setType(Schema.AllSchemaTypes.OBJECT);
        schema.setLanguage(rawLanguages(name, namespace));
        return schema;
    }

    private static Property rawSseProperty(String name, Schema schema, String namespace) {
        Property property = new Property();
        property.setLanguage(rawLanguages(name, namespace));
        property.setSerializedName(name);
        property.setRequired(true);
        property.setReadOnly(true);
        property.setSchema(schema);
        return property;
    }

    private static ObjectSchema ordinarySchema(String name, String namespace) {
        ObjectSchema schema = rawSseObjectSchema(name, namespace);
        schema.setUsage(Set.of(SchemaContext.INPUT, SchemaContext.OUTPUT, SchemaContext.PUBLIC));
        schema.setProperties(List.of());
        schema.setChildren(emptyRelations());
        schema.setParents(emptyRelations());
        return schema;
    }

    private static Relations emptyRelations() {
        Relations relations = new Relations();
        relations.setImmediate(new ArrayList<>());
        relations.setAll(new ArrayList<>());
        return relations;
    }

    private static ObjectSchema sseObjectSchema(String name, String namespace) {
        ObjectSchema schema = new ObjectSchema();
        schema.setType(Schema.AllSchemaTypes.OBJECT);
        schema.setLanguage(languages(name, namespace));
        return schema;
    }

    private static Property sseProperty(String name, Schema schema) {
        Property property = new Property();
        property.setLanguage(languages(name));
        property.setSerializedName(name);
        property.setRequired(true);
        property.setReadOnly(true);
        property.setSchema(schema);
        return property;
    }

    private static StringSchema stringSchema() {
        StringSchema schema = new StringSchema();
        schema.setType(Schema.AllSchemaTypes.STRING);
        return schema;
    }

    private static SseMetadata malformedMetadata(String id) {
        SseMetadata metadata = metadata(id, "Events", "com.azure.mock");
        metadata.setStreamName("");
        return metadata;
    }

    protected static void configureJavaSettings(Map<String, String> settings) {
        JavaSettingsTestBase.configureJavaSettings(settings);
        Mappers.setFactory(new TypeSpecMapperFactory());
    }

    private static Map<String, String> sseSettings(String syncMethods, boolean syncStack, boolean wrappersEnabled) {
        Map<String, String> settings = new LinkedHashMap<>();
        settings.put("namespace", "com.azure.mock");
        settings.put("flavor", "azure");
        settings.put("data-plane", "true");
        settings.put("generate-sync-async-clients", Boolean.toString(wrappersEnabled));
        settings.put("sync-methods", syncMethods);
        settings.put("enable-sync-stack", Boolean.toString(syncStack));
        settings.put("service-versions", "[\"2025-01-01\"]");
        return settings;
    }

    private static CodeModel codeModel(List<OperationGroup> groups) {
        CodeModel codeModel = new CodeModel();
        codeModel.setLanguage(languages("TestClient"));
        Info info = new Info();
        info.setTitle("Test");
        info.setDescription("Test service.");
        codeModel.setInfo(info);
        Schemas schemas = new Schemas();
        List<ObjectSchema> objects = new ArrayList<>();
        Set<ObjectSchema> seen = java.util.Collections.newSetFromMap(new java.util.IdentityHashMap<>());
        groups.stream()
            .flatMap(group -> group.getOperations().stream())
            .map(Operation::getSseMetadata)
            .filter(java.util.Objects::nonNull)
            .forEach(metadata -> {
                if (seen.add(metadata.getBaseSchema())) {
                    objects.add(metadata.getBaseSchema());
                }
                metadata.getEvents().forEach(event -> {
                    if (seen.add(event.getEventSchema())) {
                        objects.add(event.getEventSchema());
                    }
                });
            });
        schemas.setObjects(objects);
        codeModel.setSchemas(schemas);
        codeModel.setOperationGroups(groups);
        groups.forEach(group -> group.setCodeModel(codeModel));
        return codeModel;
    }

    private static com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Client codeModelClient(
        String name, List<OperationGroup> groups,
        List<com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Client> subClients) {
        com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Client client
            = new com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Client();
        client.setLanguage(languages(name));
        client.setOperationGroups(groups);
        client.setSubClients(subClients);
        return client;
    }

    private static void assertInvalidMetadata(TypeSpecPlugin plugin, CodeModel model, String operationId,
        String streamId, String reason) {
        IllegalStateException exception
            = Assertions.assertThrows(IllegalStateException.class, () -> plugin.processClient(model));
        Assertions.assertEquals("Invalid SSE metadata for operation '" + operationId + "' with stream ID '" + streamId
            + "': " + reason + ".", exception.getMessage());
    }

    private static OperationGroup group(String name, Operation... operations) {
        OperationGroup group = new OperationGroup();
        group.set$key(name);
        group.setLanguage(languages(name));
        group.setOperations(new ArrayList<>(List.of(operations)));
        for (Operation operation : operations) {
            operation.setOperationGroup(group);
        }
        return group;
    }

    private static Operation operation(String name, SseMetadata metadata, boolean internal, boolean convenience) {
        Operation operation = new Operation();
        operation.setOperationId(name);
        operation.setLanguage(languages(name));
        operation.setInternalApi(internal);
        operation.setSseMetadata(metadata);
        if (convenience) {
            ConvenienceApi convenienceApi = new ConvenienceApi();
            convenienceApi.setLanguage(languages(name));
            operation.setConvenienceApi(convenienceApi);
        }

        Request request = new Request();
        request.setLanguage(operation.getLanguage());
        request.setParameters(List.of());
        request.setSignatureParameters(List.of());
        Protocol requestHttp = new Protocol();
        requestHttp.setMethod("GET");
        requestHttp.setUri("https://example.org");
        requestHttp.setPath("/" + name);
        Protocols requestProtocols = new Protocols();
        requestProtocols.setHttp(requestHttp);
        request.setProtocol(requestProtocols);
        operation.setRequests(List.of(request));

        StringSchema responseSchema = new StringSchema();
        responseSchema.setType(Schema.AllSchemaTypes.STRING);
        Response response = new Response();
        response.setSchema(responseSchema);
        Protocol responseHttp = new Protocol();
        responseHttp.setStatusCodes(List.of("200"));
        Protocols responseProtocols = new Protocols();
        responseProtocols.setHttp(responseHttp);
        response.setProtocol(responseProtocols);
        operation.setResponses(List.of(response));
        return operation;
    }

    private static Languages languages(String name) {
        return languages(name, "com.azure.mock");
    }

    private static Languages languages(String name, String namespace) {
        Language language = new Language();
        language.setName(name);
        language.setNamespace(namespace);
        language.setDescription(name + " description.");
        Languages languages = new Languages();
        languages.setDefault(language);
        languages.setJava(language);
        return languages;
    }

    private static Languages rawLanguages(String name, String namespace) {
        Language defaultLanguage = new Language();
        defaultLanguage.setName(name);
        defaultLanguage.setNamespace(namespace);
        defaultLanguage.setDescription(name + " description.");
        Language javaLanguage = new Language();
        javaLanguage.setNamespace(namespace);
        Languages languages = new Languages();
        languages.setDefault(defaultLanguage);
        languages.setJava(javaLanguage);
        return languages;
    }

    private static List<ClientModel> sseModels(Client client) {
        return client.getModels().stream().filter(model -> model.getSseMetadata() != null).collect(Collectors.toList());
    }

    private static List<ClientModel> sseBaseModels(Client client) {
        return sseModels(client).stream()
            .filter(model -> model.getSseMetadata().isBaseModel())
            .collect(Collectors.toList());
    }

    private static String describeClients(Client client) {
        return "sync="
            + client.getSyncClients()
                .stream()
                .map(value -> value.getClassName() + ":" + value.getConvenienceMethods().size())
                .collect(Collectors.joining(","))
            + " async="
            + client.getAsyncClients()
                .stream()
                .map(value -> value.getClassName() + ":" + value.getConvenienceMethods().size())
                .collect(Collectors.joining(","));
    }
}
