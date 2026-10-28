// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ConvenienceApi;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Info;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Language;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Languages;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.OperationGroup;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Protocol;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Protocols;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Request;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Response;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Schema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Schemas;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseEventMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.StringSchema;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.mapper.ClientMapper;
import com.microsoft.typespec.http.client.generator.core.mapper.ClientMethodMapper;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Client;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ModuleInfo;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ServiceClient;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaPackage;
import com.microsoft.typespec.http.client.generator.model.EmitterOptions;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class TypeSpecPluginSseTests extends JavaSettingsTestBase {
    @Test
    public void exportsEventPackagesOnceAlongsideOrdinaryModelPackages() {
        TypeSpecPlugin plugin = new TypeSpecPlugin(new EmitterOptions().setNamespace("com.azure.mock"), false);
        configureJavaSettings(Map.of("namespace", "com.azure.mock", "flavor", "azure"));
        ModuleInfo moduleInfo = new ModuleInfo("com.azure.mock");
        moduleInfo.getExportModules().add(new ModuleInfo.ExportModule("com.azure.shared.models"));
        Client client = new Client.Builder().moduleInfo(moduleInfo)
            .models(List.of())
            .sseStreams(List.of(method("first", "FirstEvents", "com.azure.events").getSseMetadata(),
                method("second", "SecondEvents", "com.azure.events").getSseMetadata(),
                method("shared", "SharedEvents", "com.azure.shared").getSseMetadata()))
            .serviceClients(List.of(new ServiceClient.Builder().className("TestClientImpl")
                .methodGroupClients(List.of())
                .clientMethods(List.of(method("first", "FirstEvents", "com.azure.events"),
                    method("second", "SecondEvents", "com.azure.events"),
                    method("shared", "SharedEvents", "com.azure.shared")))
                .build()))
            .build();
        JavaPackage javaPackage = new JavaPackage(plugin);

        plugin.writeHelperClasses(client, new CodeModel(), javaPackage, JavaSettings.getInstance());
        javaPackage.addModuleInfo(moduleInfo);

        Assertions.assertEquals(List.of("com.azure.shared.models", "com.azure.events.models"),
            moduleInfo.getExportModules()
                .stream()
                .map(ModuleInfo.ExportModule::getModuleName)
                .collect(Collectors.toList()));
        String moduleSource
            = javaPackage.getJavaFiles().get(javaPackage.getJavaFiles().size() - 1).getContents().toString();
        Assertions.assertTrue(moduleSource.contains("exports com.azure.events.models;"));
    }

    @Test
    public void unusedInlineOperationMetadataDoesNotEmitRuntimeOrModels() {
        TypeSpecPlugin plugin = new TypeSpecPlugin(new EmitterOptions().setNamespace("com.azure.mock"), false);
        configureJavaSettings(Map.of("namespace", "com.azure.mock", "flavor", "azure"));
        CodeModel model = codeModel(
            List.of(group("", operation("read", metadata("unused", "UnusedEvents", "com.azure.mock"), false, false))));
        JavaPackage javaPackage = new JavaPackage(plugin);
        Client client = plugin.processClient(model);
        Assertions.assertTrue(client.getSseStreams().isEmpty());
        plugin.writeHelperClasses(client, model, javaPackage, JavaSettings.getInstance());
        Assertions.assertTrue(javaPackage.getJavaFiles().isEmpty());
    }

    @Test
    public void processClientValidatesUnusedRootOperationMetadata() {
        TypeSpecPlugin plugin = new TypeSpecPlugin(new EmitterOptions().setNamespace("com.azure.mock"), false);
        configureJavaSettings(Map.of("namespace", "com.azure.mock", "flavor", "azure"));
        CodeModel model
            = codeModel(List.of(group("", operation("rootMalformed", malformedMetadata("root-stream"), false, false))));

        assertInvalidMetadata(plugin, model, "rootMalformed", "root-stream");
    }

    @Test
    public void processClientValidatesUnusedDirectClientOperationMetadata() {
        TypeSpecPlugin plugin = new TypeSpecPlugin(new EmitterOptions().setNamespace("com.azure.mock"), false);
        configureJavaSettings(Map.of("namespace", "com.azure.mock", "flavor", "azure"));
        CodeModel model = codeModel(List.of());
        model.setClients(List.of(codeModelClient("DirectClient",
            List.of(group("", operation("directMalformed", malformedMetadata("direct-stream"), false, false))),
            List.of())));

        assertInvalidMetadata(plugin, model, "directMalformed", "direct-stream");
    }

    @Test
    public void processClientValidatesUnusedSharedNestedSubclientMetadata() {
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

        assertInvalidMetadata(plugin, model, "nestedMalformed", "nested-stream");
    }

    @Test
    public void mapsFinalConvenienceUsageBeforeHelperEmission() {
        TypeSpecPlugin plugin = new TypeSpecPlugin(new EmitterOptions().setNamespace("com.azure.mock"), false);
        configureJavaSettings(sseSettings("all", false, true));
        SseMetadata shared = metadata("shared", "SharedEvents", "com.azure.shared");
        SseMetadata repeatedShared = metadata("shared", "SharedEvents", "com.azure.shared");
        SseMetadata internal = metadata("internal", "InternalEvents", "com.azure.internal");
        SseMetadata unused = metadata("unused", "UnusedEvents", "com.azure.unused");
        Operation first = operation("readFirst", shared, false, true);
        Operation second = operation("readSecond", repeatedShared, false, true);
        Operation internalOperation = operation("readInternal", internal, true, true);
        CodeModel codeModel = codeModel(List.of(group("", first, second), group("Admin", internalOperation),
            group("Unused", operation("readUnused", unused, false, false))));

        ClientMethodMapper.getInstance().map(first, false);
        Client client = plugin.processClient(codeModel);

        Assertions.assertEquals(List.of(shared, internal), client.getSseStreams(), () -> describeClients(client));
        Assertions.assertNotSame(shared, repeatedShared);
        JavaPackage javaPackage = new JavaPackage(plugin);
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
        Client laterClient = ClientMapper.getInstance().map(later);
        Assertions.assertTrue(laterClient.getSseStreams().isEmpty());
        JavaPackage laterPackage = new JavaPackage(plugin);
        plugin.writeHelperClasses(laterClient, later, laterPackage, JavaSettings.getInstance());
        Assertions.assertTrue(laterPackage.getJavaFiles().isEmpty());
    }

    @Test
    public void collectsUsageAcrossSupportedSyncConfigurations() {
        for (Object[] configuration : List.of(new Object[] { "all", false }, new Object[] { "all", true },
            new Object[] { "sync-only", true }, new Object[] { "essential", false })) {
            String syncMethods = (String) configuration[0];
            boolean syncStack = (boolean) configuration[1];
            configureJavaSettings(sseSettings(syncMethods, syncStack, true));
            SseMetadata metadata = metadata("configured", "ConfiguredEvents", "com.azure.configured");
            CodeModel codeModel = codeModel(List.of(group("", operation("read", metadata, false, true))));

            Client client = ClientMapper.getInstance().map(codeModel);

            Assertions.assertEquals(List.of(metadata), client.getSseStreams(),
                () -> syncMethods + " syncStack=" + syncStack + " " + describeClients(client));
        }
    }

    @Test
    public void excludesUsageWhenWrapperOrConvenienceGenerationIsDisabled() {
        SseMetadata metadata = metadata("disabled", "DisabledEvents", "com.azure.disabled");
        for (boolean wrappersEnabled : List.of(false, true)) {
            configureJavaSettings(sseSettings("all", false, wrappersEnabled));
            CodeModel codeModel
                = codeModel(List.of(group("", operation("read", metadata, false, wrappersEnabled ? false : true))));

            Client client = ClientMapper.getInstance().map(codeModel);

            Assertions.assertTrue(client.getSseStreams().isEmpty(), "wrappersEnabled=" + wrappersEnabled);
        }
    }

    private static ClientMethod method(String id, String streamName, String namespace) {
        return new ClientMethod.Builder().name("read")
            .parameters(List.of())
            .sseMetadata(metadata(id, streamName, namespace))
            .build();
    }

    private static SseMetadata metadata(String id, String streamName, String namespace) {
        StringSchema payload = new StringSchema();
        payload.setType(Schema.AllSchemaTypes.STRING);
        SseEventMetadata event = new SseEventMetadata();
        event.setName("message");
        event.setPayload(payload);
        SseMetadata metadata = new SseMetadata();
        metadata.setSseStreamId(id);
        metadata.setStreamName(streamName);
        metadata.setModelNamespace(namespace);
        metadata.setEvents(List.of(event));
        return metadata;
    }

    private static SseMetadata malformedMetadata(String id) {
        SseMetadata metadata = metadata(id, "Events", "com.azure.mock");
        metadata.setStreamName("");
        return metadata;
    }

    private static Map<String, String> sseSettings(String syncMethods, boolean syncStack, boolean wrappersEnabled) {
        Map<String, String> settings = new LinkedHashMap<>();
        settings.put("namespace", "com.azure.mock");
        settings.put("flavor", "azure");
        settings.put("data-plane", "true");
        settings.put("generate-sync-async-clients", Boolean.toString(wrappersEnabled));
        settings.put("sync-methods", syncMethods);
        settings.put("enable-sync-stack", Boolean.toString(syncStack));
        return settings;
    }

    private static CodeModel codeModel(List<OperationGroup> groups) {
        CodeModel codeModel = new CodeModel();
        codeModel.setLanguage(languages("TestClient"));
        Info info = new Info();
        info.setTitle("Test");
        info.setDescription("Test service.");
        codeModel.setInfo(info);
        codeModel.setSchemas(new Schemas());
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
        String streamId) {
        IllegalStateException exception
            = Assertions.assertThrows(IllegalStateException.class, () -> plugin.processClient(model));
        Assertions.assertEquals("Invalid SSE metadata for operation '" + operationId + "' with stream ID '" + streamId
            + "': the stream name is missing or empty.", exception.getMessage());
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
        Language language = new Language();
        language.setName(name);
        language.setNamespace("com.azure.mock");
        language.setDescription(name + " description.");
        Languages languages = new Languages();
        languages.setDefault(language);
        languages.setJava(language);
        return languages;
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
