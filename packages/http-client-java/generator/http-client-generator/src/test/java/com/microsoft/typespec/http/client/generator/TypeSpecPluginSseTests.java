// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ConvenienceApi;
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
import java.util.Set;
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
    public void processClientRejectsAmbiguousImmediateSseParent() {
        TypeSpecPlugin plugin = new TypeSpecPlugin(new EmitterOptions().setNamespace("com.azure.mock"), false);
        configureJavaSettings(Map.of("namespace", "com.azure.mock", "flavor", "azure"));
        SseMetadata metadata = metadata("ambiguous-parent", "Events", "com.azure.mock");
        ObjectSchema expectedBase = sseObjectSchema("EventsEvent", "com.azure.mock");
        ObjectSchema otherBase = sseObjectSchema("OtherEvent", "com.azure.mock");
        Relations parents = new Relations();
        parents.setImmediate(List.of(otherBase, expectedBase));
        parents.setAll(List.of(otherBase, expectedBase));
        metadata.getEvents().get(0).getEventSchema().setParents(parents);
        CodeModel model = codeModel(List.of(group("", operation("ambiguousParent", metadata, false, false))));

        assertInvalidMetadata(plugin, model, "ambiguousParent", "ambiguous-parent",
            "event 'message' schema must have exactly one immediate parent matching the stream base schema");
    }

    @Test
    public void processClientRejectsMissingImmediateSseParent() {
        TypeSpecPlugin plugin = new TypeSpecPlugin(new EmitterOptions().setNamespace("com.azure.mock"), false);
        configureJavaSettings(Map.of("namespace", "com.azure.mock", "flavor", "azure"));
        SseMetadata metadata = metadata("missing-parent", "Events", "com.azure.mock");
        metadata.getEvents().get(0).getEventSchema().setParents(null);
        CodeModel model = codeModel(List.of(group("", operation("missingParent", metadata, false, false))));

        assertInvalidMetadata(plugin, model, "missingParent", "missing-parent",
            "event 'message' schema must have exactly one immediate parent matching the stream base schema");
    }

    @Test
    public void processClientRejectsMissingAllSseParent() {
        TypeSpecPlugin plugin = new TypeSpecPlugin(new EmitterOptions().setNamespace("com.azure.mock"), false);
        configureJavaSettings(Map.of("namespace", "com.azure.mock", "flavor", "azure"));
        SseMetadata metadata = metadata("missing-all-parent", "Events", "com.azure.mock");
        metadata.getEvents().get(0).getEventSchema().getParents().setAll(null);
        CodeModel model = codeModel(List.of(group("", operation("missingAllParent", metadata, false, false))));

        assertInvalidMetadata(plugin, model, "missingAllParent", "missing-all-parent",
            "event 'message' schema all-parent list does not contain the stream base schema");
    }

    @Test
    public void processClientRejectsMismatchedSseEventNamespace() {
        TypeSpecPlugin plugin = new TypeSpecPlugin(new EmitterOptions().setNamespace("com.azure.mock"), false);
        configureJavaSettings(Map.of("namespace", "com.azure.mock", "flavor", "azure"));
        SseMetadata metadata = metadata("mismatched-namespace", "Events", "com.azure.mock");
        metadata.getEvents()
            .get(0)
            .getEventSchema()
            .setLanguage(languages("EventsMessageStreamEvent", "com.azure.other"));
        CodeModel model = codeModel(List.of(group("", operation("mismatchedNamespace", metadata, false, false))));

        assertInvalidMetadata(plugin, model, "mismatchedNamespace", "mismatched-namespace",
            "event 'message' schema namespace 'com.azure.other' does not match the stream base schema namespace "
                + "'com.azure.mock'");
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
        Client client = plugin.processClient(model);
        JavaPackage javaPackage = new JavaPackage(plugin);

        IllegalStateException exception = Assertions.assertThrows(IllegalStateException.class,
            () -> plugin.writeHelperClasses(client, model, javaPackage, JavaSettings.getInstance()));

        Assertions.assertTrue(exception.getMessage().contains("OneTwoThreeEvent.java"), exception.getMessage());
    }

    @Test
    public void renderingRejectsOrdinaryModelAndRawSseNamesWithTheSameFinalPath() {
        TypeSpecPlugin plugin = new TypeSpecPlugin(new EmitterOptions().setNamespace("com.azure.mock"), false);
        configureJavaSettings(sseSettings("all", false, true));
        SseMetadata numeric
            = rawMetadata("numeric", "123Events", "com.azure.mock", "123Event", "done", "123EventDoneStreamEvent");
        CodeModel model = codeModel(List.of(group("", operation("readNumeric", numeric, false, true))));
        model.getSchemas().setObjects(new ArrayList<>(List.of(ordinarySchema("OneTwoThreeEvent", "com.azure.mock"))));
        Client client = plugin.processClient(model);
        JavaPackage javaPackage = new JavaPackage(plugin);
        client.getModels()
            .forEach(clientModel -> javaPackage.addModel(clientModel.getPackage(), clientModel.getName(), clientModel));

        IllegalStateException exception = Assertions.assertThrows(IllegalStateException.class,
            () -> plugin.writeHelperClasses(client, model, javaPackage, JavaSettings.getInstance()));

        Assertions.assertTrue(exception.getMessage().contains("OneTwoThreeEvent.java"), exception.getMessage());
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
        String baseName
            = streamName.endsWith("Events") ? streamName.substring(0, streamName.length() - 1) : streamName + "Event";
        ObjectSchema baseSchema = sseObjectSchema(baseName, namespace);
        baseSchema.setProperties(List.of(sseProperty("eventName", stringSchema())));
        ObjectSchema eventSchema
            = sseObjectSchema(baseName.replaceFirst("Event$", "") + "MessageStreamEvent", namespace);
        Relations parents = new Relations();
        parents.setImmediate(List.of(sseObjectSchema(baseName, namespace)));
        parents.setAll(List.of(sseObjectSchema(baseName, namespace)));
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
        return metadata;
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
        assertInvalidMetadata(plugin, model, operationId, streamId, "the stream name is missing or empty");
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
