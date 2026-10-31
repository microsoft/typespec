// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.util;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ArraySchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModelCustomConstructor;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.DictionarySchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseMetadata;
import java.util.LinkedHashMap;
import java.util.Map;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.yaml.snakeyaml.LoaderOptions;
import org.yaml.snakeyaml.Yaml;
import org.yaml.snakeyaml.constructor.ConstructorException;

public class SseMetadataTests {
    private static final String FIRST_PAYLOAD
        = "schema:\n" + "                  type: dictionary\n" + "                  elementType:\n"
            + "                    type: integer\n" + "                    precision: 64";
    private static final String YAML = "schemas:\n" + "  objects:\n" + "    - &base\n" + "      type: object\n"
        + "      sseMetadata:\n        streamName: Events\n" + "      usage: [output, public, sse]\n"
        + "      language:\n" + "        default:\n" + "          name: EventsEvent\n" + "          namespace: test\n"
        + "          description: Base event.\n" + "      properties:\n" + "        - language:\n"
        + "            default:\n" + "              name: eventName\n" + "              description: Event name.\n"
        + "          serializedName: eventName\n" + "          required: true\n" + "          readOnly: true\n"
        + "          schema:\n" + "            type: string\n" + "      children:\n" + "        immediate:\n"
        + "          - &update\n" + "            type: object\n"
        + "            sseMetadata:\n              streamName: Events\n              eventName: update\n"
        + "              terminal: false\n" + "            usage: [output, public, sse]\n" + "            language:\n"
        + "              default:\n" + "                name: UpdateStreamEvent\n" + "                namespace: test\n"
        + "                description: Update event.\n" + "            parents:\n"
        + "              immediate: [*base]\n" + "              all: [*base]\n" + "            properties:\n"
        + "              - language:\n" + "                  default:\n" + "                    name: value\n"
        + "                    description: Event payload.\n" + "                serializedName: value\n"
        + "                required: true\n" + "                readOnly: true\n" + "                " + FIRST_PAYLOAD
        + "\n" + "          - &nested\n" + "            type: object\n"
        + "            sseMetadata:\n              streamName: Events\n              eventName: nested\n"
        + "              terminal: true\n" + "            usage: [output, public, sse]\n" + "            language:\n"
        + "              default:\n" + "                name: NestedStreamEvent\n" + "                namespace: test\n"
        + "                description: Nested event.\n" + "            parents:\n"
        + "              immediate: [*base]\n" + "              all: [*base]\n" + "            properties:\n"
        + "              - language:\n" + "                  default:\n" + "                    name: value\n"
        + "                    description: Event payload.\n" + "                serializedName: value\n"
        + "                required: true\n" + "                readOnly: true\n" + "                schema:\n"
        + "                  type: array\n" + "                  elementType:\n" + "                    type: string\n"
        + "        all: [*update, *nested]\n" + "    - *update\n" + "    - *nested\n" + "operationGroups:\n"
        + "  - operations:\n" + "      - operationId: first\n" + "        sseMetadata:\n"
        + "          sseStreamId: Test.Events\n" + "          streamName: Events\n" + "          baseSchema: *base\n"
        + "          events:\n" + "            - name: update\n" + "              eventSchema: *update\n"
        + "              terminal: false\n" + "            - name: nested\n" + "              eventSchema: *nested\n"
        + "              terminal: true\n" + "      - operationId: second\n" + "        sseMetadata:\n"
        + "          sseStreamId: Test.Events\n" + "          streamName: Events\n" + "          baseSchema: *base\n"
        + "          events:\n" + "            - name: update\n" + "              eventSchema: *update\n"
        + "              terminal: false\n" + "            - name: nested\n" + "              eventSchema: *nested\n"
        + "              terminal: true\n";

    @Test
    public void loadsDistinctMetadataWithRegisteredSchemaAliasesAndPolymorphicPayloads() {
        CodeModel model = load(YAML);
        var operations = model.getOperationGroups().get(0).getOperations();
        Assertions.assertNotSame(operations.get(0).getSseMetadata(), operations.get(1).getSseMetadata());
        Assertions.assertEquals("Test.Events", operations.get(0).getSseMetadata().getSseStreamId());
        Assertions.assertEquals("Test.Events", operations.get(1).getSseMetadata().getSseStreamId());
        Assertions.assertSame(operations.get(0).getSseMetadata().getBaseSchema(),
            operations.get(1).getSseMetadata().getBaseSchema());
        Assertions.assertInstanceOf(DictionarySchema.class,
            operations.get(0).getSseMetadata().getEvents().get(0).getEventSchema().getProperties().get(0).getSchema());
        Assertions.assertInstanceOf(ArraySchema.class,
            operations.get(1).getSseMetadata().getEvents().get(1).getEventSchema().getProperties().get(0).getSchema());
    }

    @Test
    public void loadsSchemaLocalRenderingDataAlongsideOperationMetadata() {
        CodeModel model = load(YAML);

        SseMetadata metadata = model.getOperationGroups().get(0).getOperations().get(0).getSseMetadata();
        Assertions.assertEquals("Test.Events", metadata.getSseStreamId());
        Assertions.assertSame(model.getSchemas().getObjects().get(0), metadata.getBaseSchema());
        Assertions.assertSame(model.getSchemas().getObjects().get(1), metadata.getEvents().get(0).getEventSchema());
        Assertions.assertSame(model.getSchemas().getObjects().get(2), metadata.getEvents().get(1).getEventSchema());
        Assertions.assertEquals("Events", metadata.getBaseSchema().getSseMetadata().getStreamName());
        Assertions.assertNull(metadata.getBaseSchema().getSseMetadata().getEventName());
        Assertions.assertFalse(metadata.getBaseSchema().getSseMetadata().isTerminal());
        Assertions.assertEquals("update", metadata.getEvents().get(0).getEventSchema().getSseMetadata().getEventName());
        Assertions.assertFalse(metadata.getEvents().get(0).getEventSchema().getSseMetadata().isTerminal());
        Assertions.assertEquals("nested", metadata.getEvents().get(1).getEventSchema().getSseMetadata().getEventName());
        Assertions.assertTrue(metadata.getEvents().get(1).getEventSchema().getSseMetadata().isTerminal());
    }

    @Test
    public void loadsNullPayloadAsData() {
        String nullPayload = YAML.replace(FIRST_PAYLOAD, "schema: null");

        CodeModel model = load(nullPayload);

        Assertions.assertNull(model.getOperationGroups()
            .get(0)
            .getOperations()
            .get(0)
            .getSseMetadata()
            .getEvents()
            .get(0)
            .getEventSchema()
            .getProperties()
            .get(0)
            .getSchema());
    }

    @Test
    public void rejectsMalformedNonNullPayloadDuringTypedLoad() {
        String scalarPayload = YAML.replace(FIRST_PAYLOAD, "schema: not-a-schema");

        Assertions.assertThrows(ConstructorException.class, () -> load(scalarPayload));
    }

    @Test
    public void acceptsAbsentAndNullMetadata() {
        load("operationGroups: []");
        CodeModel model
            = load("operationGroups:\n  - operations:\n      - operationId: absent\n      - operationId: null\n"
                + "        sseMetadata: null\n");
        Assertions.assertNull(model.getOperationGroups().get(0).getOperations().get(0).getSseMetadata());
        Assertions.assertNull(model.getOperationGroups().get(0).getOperations().get(1).getSseMetadata());
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

}
