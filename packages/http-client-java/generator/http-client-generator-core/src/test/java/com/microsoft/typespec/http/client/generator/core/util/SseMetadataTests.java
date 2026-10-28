// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.util;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ArraySchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Client;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModelCustomConstructor;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.DictionarySchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ObjectSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.OperationGroup;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Property;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Relations;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Schema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseEventMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.StringSchema;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.yaml.snakeyaml.LoaderOptions;
import org.yaml.snakeyaml.Yaml;
import org.yaml.snakeyaml.constructor.ConstructorException;

public class SseMetadataTests {
    private static final String BASE_SCHEMA = "          baseSchema:\n" + "            type: object\n"
        + "            language:\n" + "              default:\n" + "                name: EventsEvent\n"
        + "                namespace: test\n" + "                description: Base event.\n"
        + "            properties:\n" + "              - language:\n" + "                  default:\n"
        + "                    name: eventName\n" + "                    description: Event name.\n"
        + "                serializedName: eventName\n" + "                required: true\n"
        + "                readOnly: true\n" + "                schema:\n" + "                  type: string\n";
    private static final String EVENT_PARENT = "                parents:\n" + "                  immediate:\n"
        + "                    - type: object\n" + "                      language:\n"
        + "                        default:\n" + "                          name: EventsEvent\n"
        + "                          namespace: test\n" + "                          description: Base event.\n"
        + "                  all:\n" + "                    - type: object\n" + "                      language:\n"
        + "                        default:\n" + "                          name: EventsEvent\n"
        + "                          namespace: test\n" + "                          description: Base event.\n";
    private static final String FIRST_PAYLOAD
        = "schema:\n" + "                      type: dictionary\n" + "                      elementType:\n"
            + "                        type: integer\n" + "                        precision: 64";
    private static final String YAML = "operationGroups:\n" + "  - operations:\n" + "      - operationId: first\n"
        + "        sseMetadata:\n" + "          sseStreamId: Test.Events\n" + "          streamName: Events\n"
        + BASE_SCHEMA + "          events:\n" + "            - name: update\n" + "              eventSchema:\n"
        + "                type: object\n" + "                language:\n" + "                  default:\n"
        + "                    name: UpdateStreamEvent\n" + "                    namespace: test\n"
        + "                    description: Update event.\n" + EVENT_PARENT + "                properties:\n"
        + "                  - language:\n" + "                      default:\n"
        + "                        name: value\n" + "                        description: Event payload.\n"
        + "                    serializedName: value\n" + "                    required: true\n"
        + "                    readOnly: true\n" + "                    " + FIRST_PAYLOAD + "\n"
        + "              terminal: false\n" + "      - operationId: second\n" + "        sseMetadata:\n"
        + "          sseStreamId: Test.Events\n" + "          streamName: Events\n" + BASE_SCHEMA
        + "          events:\n" + "            - name: nested\n" + "              eventSchema:\n"
        + "                type: object\n" + "                language:\n" + "                  default:\n"
        + "                    name: NestedStreamEvent\n" + "                    namespace: test\n"
        + "                    description: Nested event.\n" + EVENT_PARENT + "                properties:\n"
        + "                  - language:\n" + "                      default:\n"
        + "                        name: value\n" + "                        description: Event payload.\n"
        + "                    serializedName: value\n" + "                    required: true\n"
        + "                    readOnly: true\n" + "                    schema:\n"
        + "                      type: array\n" + "                      elementType:\n"
        + "                        type: string\n" + "              terminal: true\n";

    @Test
    public void loadsDistinctInlineMetadataWithPolymorphicPayloads() {
        CodeModel model = load(YAML);
        model.validateSseMetadata();
        var operations = model.getOperationGroups().get(0).getOperations();
        Assertions.assertNotSame(operations.get(0).getSseMetadata(), operations.get(1).getSseMetadata());
        Assertions.assertEquals("Test.Events", operations.get(0).getSseMetadata().getSseStreamId());
        Assertions.assertEquals("Test.Events", operations.get(1).getSseMetadata().getSseStreamId());
        Assertions.assertNotSame(operations.get(0).getSseMetadata().getBaseSchema(),
            operations.get(1).getSseMetadata().getBaseSchema());
        Assertions.assertInstanceOf(DictionarySchema.class,
            operations.get(0).getSseMetadata().getEvents().get(0).getEventSchema().getProperties().get(0).getSchema());
        Assertions.assertInstanceOf(ArraySchema.class,
            operations.get(1).getSseMetadata().getEvents().get(0).getEventSchema().getProperties().get(0).getSchema());
    }

    @Test
    public void rejectsMalformedInlineMetadata() {
        for (String malformed : List.of(YAML.replaceFirst("sseStreamId: Test.Events\\n", ""),
            YAML.replaceFirst("sseStreamId: Test.Events", "sseStreamId: ''"),
            YAML.replaceFirst("streamName: Events\\n", ""), YAML.replaceFirst("streamName: Events", "streamName: ''"),
            YAML.replaceFirst("baseSchema:\\n", "baseSchema: null\\n"),
            YAML.replaceFirst("name: EventsEvent", "name: ''"), YAML.replaceFirst("namespace: test", "namespace: ''"),
            YAML.replaceFirst("events:\\n            - name: update", "events: []"),
            YAML.replaceFirst("name: update\\n", ""), YAML.replaceFirst("name: update", "name: ''"))) {
            Assertions.assertThrows(RuntimeException.class, () -> loadAndValidate(malformed));
        }

        CodeModel nullEvents = load(YAML);
        nullEvents.getOperationGroups().get(0).getOperations().get(0).getSseMetadata().setEvents(null);
        Assertions.assertThrows(IllegalStateException.class, nullEvents::validateSseMetadata);

        CodeModel nullEvent = load(YAML);
        List<SseEventMetadata> events = new ArrayList<>();
        events.add(null);
        nullEvent.getOperationGroups().get(0).getOperations().get(0).getSseMetadata().setEvents(events);
        Assertions.assertThrows(IllegalStateException.class, nullEvent::validateSseMetadata);
    }

    @Test
    public void validatesNullPayloadWithOperationAndStreamContext() {
        String nullPayload = YAML.replace(FIRST_PAYLOAD, "schema: null");

        IllegalStateException exception
            = Assertions.assertThrows(IllegalStateException.class, () -> loadAndValidate(nullPayload));

        Assertions.assertEquals("Invalid SSE metadata for operation 'first' with stream ID 'Test.Events': "
            + "event 'update' value property has no payload schema.", exception.getMessage());
    }

    @Test
    public void rejectsMalformedNonNullPayloadDuringTypedLoad() {
        String scalarPayload = YAML.replace(FIRST_PAYLOAD, "schema: not-a-schema");

        Assertions.assertThrows(ConstructorException.class, () -> load(scalarPayload));
    }

    @Test
    public void acceptsAbsentAndNullMetadata() {
        loadAndValidate("operationGroups: []");
        CodeModel model = loadAndValidate(
            "operationGroups:\n  - operations:\n      - operationId: absent\n      - operationId: null\n"
                + "        sseMetadata: null\n");
        Assertions.assertNull(model.getOperationGroups().get(0).getOperations().get(0).getSseMetadata());
        Assertions.assertNull(model.getOperationGroups().get(0).getOperations().get(1).getSseMetadata());
    }

    @Test
    public void visitsRootClientsAndSharedNestedSubclientsOnce() {
        CodeModel model = new CodeModel();
        model.setOperationGroups(List.of(group(operation("root"))));
        Client shared = new Client();
        shared.setOperationGroups(List.of(group(operation("shared"))));
        Client first = new Client();
        first.setOperationGroups(List.of(group(operation("first"))));
        first.setSubClients(List.of(shared));
        Client second = new Client();
        second.setOperationGroups(List.of(group(operation("second"))));
        second.setSubClients(List.of(shared));
        shared.setSubClients(List.of(first));
        model.setClients(List.of(first, second));

        model.validateSseMetadata();
    }

    @Test
    public void doesNotCoerceUnrelatedSseMetadataMappings() {
        Object loaded
            = new Yaml(new CodeModelCustomConstructor(new LoaderOptions())).load("sseMetadata:\n  arbitrary: value\n");

        Assertions.assertInstanceOf(LinkedHashMap.class, loaded);
        Assertions.assertInstanceOf(Map.class, ((Map<?, ?>) loaded).get("sseMetadata"));
    }

    private static CodeModel load(String yaml) {
        return new Yaml(new CodeModelCustomConstructor(new LoaderOptions())).loadAs(yaml, CodeModel.class);
    }

    private static CodeModel loadAndValidate(String yaml) {
        CodeModel model = load(yaml);
        model.validateSseMetadata();
        return model;
    }

    private static OperationGroup group(Operation operation) {
        OperationGroup group = new OperationGroup();
        group.setOperations(new ArrayList<>(List.of(operation)));
        return group;
    }

    private static Operation operation(String id) {
        ObjectSchema baseSchema = objectSchema("EventsEvent");
        StringSchema eventNameSchema = new StringSchema();
        eventNameSchema.setType(Schema.AllSchemaTypes.STRING);
        Property eventName = property("eventName", eventNameSchema);
        baseSchema.setProperties(List.of(eventName));
        ObjectSchema eventSchema = objectSchema("MessageStreamEvent");
        Relations parents = new Relations();
        parents.setImmediate(List.of(baseSchema));
        parents.setAll(List.of(baseSchema));
        eventSchema.setParents(parents);
        StringSchema payload = new StringSchema();
        payload.setType(Schema.AllSchemaTypes.STRING);
        eventSchema.setProperties(List.of(property("value", payload)));
        SseEventMetadata event = new SseEventMetadata();
        event.setName("message");
        event.setEventSchema(eventSchema);
        SseMetadata metadata = new SseMetadata();
        metadata.setSseStreamId(id);
        metadata.setStreamName("Events");
        metadata.setBaseSchema(baseSchema);
        metadata.setEvents(List.of(event));
        Operation operation = new Operation();
        operation.setOperationId(id);
        operation.setSseMetadata(metadata);
        return operation;
    }

    private static ObjectSchema objectSchema(String name) {
        com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Language language
            = new com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Language();
        language.setName(name);
        language.setNamespace("test");
        language.setDescription(name);
        com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Languages languages
            = new com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Languages();
        languages.setDefault(language);
        ObjectSchema schema = new ObjectSchema();
        schema.setType(Schema.AllSchemaTypes.OBJECT);
        schema.setLanguage(languages);
        return schema;
    }

    private static Property property(String name, Schema schema) {
        com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Language language
            = new com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Language();
        language.setName(name);
        language.setDescription(name);
        com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Languages languages
            = new com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Languages();
        languages.setDefault(language);
        Property property = new Property();
        property.setLanguage(languages);
        property.setSerializedName(name);
        property.setRequired(true);
        property.setReadOnly(true);
        property.setSchema(schema);
        return property;
    }
}
