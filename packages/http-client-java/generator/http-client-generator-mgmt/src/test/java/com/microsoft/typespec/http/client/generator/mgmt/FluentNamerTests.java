// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.microsoft.typespec.http.client.generator.core.extension.model.Message;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
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
import com.microsoft.typespec.http.client.generator.core.extension.plugin.NewPlugin;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Client;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.utils.IOExceptionCheckedFunction;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.api.parallel.Isolated;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

@Isolated("Management preprocessing resets the shared Java settings")
public class FluentNamerTests {
    private String originalDumpProperty;
    private String originalTempProperty;

    @TempDir
    public Path tempDirectory;

    @BeforeEach
    public void configureDiagnostics() {
        originalDumpProperty = System.getProperty("codegen.java.dump-code-model");
        originalTempProperty = System.getProperty("codegen.java.temp.directory");
        System.setProperty("codegen.java.temp.directory", tempDirectory.toString());
    }

    @AfterEach
    public void restoreProperties() {
        restoreProperty("codegen.java.dump-code-model", originalDumpProperty);
        restoreProperty("codegen.java.temp.directory", originalTempProperty);
    }

    @ParameterizedTest
    @ValueSource(booleans = { false, true })
    public void inMemoryModelsAreOnlyDumpedWhenEnabled(boolean enabled) throws IOException {
        System.setProperty("codegen.java.dump-code-model", Boolean.toString(enabled));
        CodeModel model = new CodeModel();
        model.setSchemas(new Schemas());
        Language language = new Language();
        language.setName("Example");
        Languages languages = new Languages();
        languages.setJava(language);
        model.setLanguage(languages);
        TestNamer namer = new TestNamer(model);

        assertSame(model, namer.processCodeModel());
        List<Path> directories;
        try (Stream<Path> paths = Files.list(tempDirectory)) {
            directories = paths.collect(Collectors.toList());
        }
        assertEquals(enabled ? 1 : 0, directories.size());
        if (enabled) {
            assertTrue(Files.readString(directories.get(0).resolve("code-model-fluentnamer-no-tags.yaml"))
                .contains("Example"));
        }
    }

    @Test
    public void removesSseEnvelopesBeforeFluentPreprocessing() {
        ObjectSchema payload = new ObjectSchema();
        payload.setType(Schema.AllSchemaTypes.OBJECT);
        payload.setUsage(Set.of(SchemaContext.OUTPUT, SchemaContext.PUBLIC));
        ObjectSchema sseEnvelope = new ObjectSchema();
        sseEnvelope.setType(Schema.AllSchemaTypes.OBJECT);
        sseEnvelope.setUsage(Set.of(SchemaContext.OUTPUT, SchemaContext.PUBLIC, SchemaContext.SSE));
        Schemas schemas = new Schemas();
        schemas.setObjects(new java.util.ArrayList<>(List.of(payload, sseEnvelope)));
        CodeModel model = new CodeModel();
        model.setSchemas(schemas);

        FluentNamer.removeSseSchemas(model);

        assertEquals(List.of(payload), model.getSchemas().getObjects());
    }

    @ParameterizedTest
    @ValueSource(strings = { "lite", "premium" })
    public void mapsArmModelWithUnusedSseFamilyAfterFluentPreprocessing(String fluentMode) {
        TestUtils.MockFluentGen fluentGen = new TestUtils.MockFluentGen(fluentMode);
        CodeModel model = armCodeModel();

        CodeModel transformed = new MappingNamer(fluentGen).transform(model);
        assertTrue(transformed.getSchemas().getObjects().isEmpty());

        Client client = new FluentGenAccessor(fluentGen).handleMap(transformed);

        assertFalse(client.getModels().stream().anyMatch(clientModel -> clientModel.getSseMetadata() != null));
    }

    private static CodeModel armCodeModel() {
        ObjectSchema baseSchema = sseSchema("PipelineValidationEvent");
        ObjectSchema eventSchema = sseSchema("PipelineValidationMessageStreamEvent");
        StringSchema stringSchema = new StringSchema();
        stringSchema.setType(Schema.AllSchemaTypes.STRING);
        baseSchema.setProperties(List.of(property("eventName", stringSchema)));
        eventSchema.setProperties(List.of(property("value", stringSchema)));

        Relations children = new Relations();
        children.setImmediate(List.of(eventSchema));
        children.setAll(List.of(eventSchema));
        baseSchema.setChildren(children);
        Relations parents = new Relations();
        parents.setImmediate(List.of(baseSchema));
        parents.setAll(List.of(baseSchema));
        eventSchema.setParents(parents);

        SseEventMetadata event = new SseEventMetadata();
        event.setName("message");
        event.setEventSchema(eventSchema);
        SseMetadata metadata = new SseMetadata();
        metadata.setSseStreamId("Arm.PipelineValidationEvents");
        metadata.setStreamName("PipelineValidationEvents");
        metadata.setBaseSchema(baseSchema);
        metadata.setEvents(List.of(event));
        SseSchemaMetadata baseMetadata = new SseSchemaMetadata();
        baseMetadata.setStreamName(metadata.getStreamName());
        baseSchema.setSseMetadata(baseMetadata);
        SseSchemaMetadata eventMetadata = new SseSchemaMetadata();
        eventMetadata.setStreamName(metadata.getStreamName());
        eventMetadata.setEventName(event.getName());
        eventSchema.setSseMetadata(eventMetadata);

        Operation operation = named(new Operation(), "stream");
        operation.setOperationId("stream");
        operation.setSseMetadata(metadata);
        operation.setGenerateProtocolApi(true);
        Request request = named(new Request(), "stream");
        request.setParameters(List.of());
        request.setSignatureParameters(List.of());
        Protocol requestHttp = new Protocol();
        requestHttp.setMethod("GET");
        requestHttp.setUri("https://example.org");
        requestHttp.setPath("/stream");
        Protocols requestProtocols = new Protocols();
        requestProtocols.setHttp(requestHttp);
        request.setProtocol(requestProtocols);
        operation.setRequests(List.of(request));
        Response response = new Response();
        response.setSchema(stringSchema);
        Protocol responseHttp = new Protocol();
        responseHttp.setStatusCodes(List.of("200"));
        Protocols responseProtocols = new Protocols();
        responseProtocols.setHttp(responseHttp);
        response.setProtocol(responseProtocols);
        operation.setResponses(List.of(response));

        OperationGroup group = named(new OperationGroup(), "Streams");
        group.set$key("Streams");
        group.setOperations(new ArrayList<>(List.of(operation)));
        operation.setOperationGroup(group);

        CodeModel model = named(new CodeModel(), "ArmClient");
        Info info = new Info();
        info.setTitle("ARM test");
        info.setDescription("ARM test service.");
        model.setInfo(info);
        Schemas schemas = new Schemas();
        schemas.setObjects(new ArrayList<>(List.of(baseSchema, eventSchema)));
        model.setSchemas(schemas);
        model.setOperationGroups(new ArrayList<>(List.of(group)));
        group.setCodeModel(model);
        return model;
    }

    private static ObjectSchema sseSchema(String name) {
        ObjectSchema schema = new ObjectSchema();
        schema.setType(Schema.AllSchemaTypes.OBJECT);
        schema.setLanguage(rawLanguages(name));
        schema.setUsage(Set.of(SchemaContext.OUTPUT, SchemaContext.PUBLIC, SchemaContext.SSE));
        return schema;
    }

    private static Property property(String name, Schema schema) {
        Property property = named(new Property(), name);
        property.setSerializedName(name);
        property.setRequired(true);
        property.setReadOnly(true);
        property.setSchema(schema);
        return property;
    }

    private static <T extends com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Metadata> T
        named(T metadata, String name) {
        metadata.setLanguage(languages(name));
        return metadata;
    }

    private static Languages languages(String name) {
        Language language = new Language();
        language.setName(name);
        language.setNamespace("com.azure.resourcemanager.mock");
        language.setDescription(name + " description.");
        Languages languages = new Languages();
        languages.setDefault(language);
        languages.setJava(language);
        return languages;
    }

    private static Languages rawLanguages(String name) {
        Language defaultLanguage = new Language();
        defaultLanguage.setName(name);
        defaultLanguage.setNamespace("com.azure.resourcemanager.mock");
        defaultLanguage.setDescription(name + " description.");
        Language javaLanguage = new Language();
        javaLanguage.setNamespace("com.azure.resourcemanager.mock");
        Languages languages = new Languages();
        languages.setDefault(defaultLanguage);
        languages.setJava(javaLanguage);
        return languages;
    }

    private static void restoreProperty(String key, String value) {
        if (value == null) {
            System.clearProperty(key);
        } else {
            System.setProperty(key, value);
        }
    }

    private static final class TestNamer extends FluentNamer {
        private final CodeModel model;

        private TestNamer(CodeModel model) {
            super(new TestHost(), null, "test", "test");
            this.model = model;
        }

        @Override
        protected CodeModel getCodeModelAndWriteToTargetFolder(Path directory) {
            return model;
        }

        @Override
        public CodeModel transform(CodeModel model) {
            return model;
        }
    }

    private static final class MappingNamer extends FluentNamer {
        private TestUtils.MockFluentGen host;

        private MappingNamer(TestUtils.MockFluentGen host) {
            super(host, new TestUtils.MockConnection(), "test", "test");
            this.host = host;
        }

        @Override
        public <T> T getValue(String key, IOExceptionCheckedFunction<String, T> converter) {
            return host == null ? null : host.getValue(key, converter);
        }

        @Override
        public <T> T getValueWithJsonReader(String key, IOExceptionCheckedFunction<JsonReader, T> converter) {
            return host == null ? null : host.getValueWithJsonReader(key, converter);
        }
    }

    private static final class TestHost extends NewPlugin {
        private TestHost() {
            super(null, "test", "test");
        }

        @Override
        public boolean getBooleanValue(String key, boolean defaultValue) {
            return false;
        }

        @Override
        public void message(Message message) {
        }

        @Override
        public boolean processInternal() {
            throw new UnsupportedOperationException();
        }
    }
}
