// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.util;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ArraySchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Client;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModelCustomConstructor;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.DictionarySchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.OperationGroup;
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
    private static final String FIRST_PAYLOAD = "payload:\n" + "                type: dictionary\n"
        + "                elementType:\n" + "                  type: integer\n" + "                  precision: 64";
    private static final String YAML = "operationGroups:\n" + "  - operations:\n" + "      - operationId: first\n"
        + "        sseMetadata:\n" + "          sseStreamId: Test.Events\n" + "          streamName: Events\n"
        + "          modelNamespace: test\n" + "          events:\n" + "            - name: update\n"
        + "              payload:\n" + "                type: dictionary\n" + "                elementType:\n"
        + "                  type: integer\n" + "                  precision: 64\n" + "              terminal: false\n"
        + "      - operationId: second\n" + "        sseMetadata:\n" + "          sseStreamId: Test.Events\n"
        + "          streamName: Events\n" + "          modelNamespace: test\n" + "          events:\n"
        + "            - name: nested\n" + "              payload:\n" + "                type: array\n"
        + "                elementType:\n" + "                  type: string\n" + "              terminal: true\n";

    @Test
    public void loadsDistinctInlineMetadataWithPolymorphicPayloads() {
        CodeModel model = load(YAML);
        model.validateSseMetadata();
        var operations = model.getOperationGroups().get(0).getOperations();
        Assertions.assertNotSame(operations.get(0).getSseMetadata(), operations.get(1).getSseMetadata());
        Assertions.assertEquals("Test.Events", operations.get(0).getSseMetadata().getSseStreamId());
        Assertions.assertEquals("Test.Events", operations.get(1).getSseMetadata().getSseStreamId());
        Assertions.assertInstanceOf(DictionarySchema.class,
            operations.get(0).getSseMetadata().getEvents().get(0).getPayload());
        Assertions.assertInstanceOf(ArraySchema.class,
            operations.get(1).getSseMetadata().getEvents().get(0).getPayload());
    }

    @Test
    public void rejectsMalformedInlineMetadata() {
        for (String malformed : List.of(YAML.replaceFirst("sseStreamId: Test.Events\\n", ""),
            YAML.replaceFirst("sseStreamId: Test.Events", "sseStreamId: ''"),
            YAML.replaceFirst("streamName: Events\\n", ""), YAML.replaceFirst("streamName: Events", "streamName: ''"),
            YAML.replaceFirst("modelNamespace: test\\n", ""),
            YAML.replaceFirst("modelNamespace: test", "modelNamespace: ''"),
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
        String nullPayload = YAML.replace(FIRST_PAYLOAD, "payload: null");

        IllegalStateException exception
            = Assertions.assertThrows(IllegalStateException.class, () -> loadAndValidate(nullPayload));

        Assertions.assertEquals("Invalid SSE metadata for operation 'first' with stream ID 'Test.Events': "
            + "event 'update' has no payload schema.", exception.getMessage());
    }

    @Test
    public void rejectsMalformedNonNullPayloadDuringTypedLoad() {
        String scalarPayload = YAML.replace(FIRST_PAYLOAD, "payload: not-a-schema");

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
        StringSchema payload = new StringSchema();
        SseEventMetadata event = new SseEventMetadata();
        event.setName("message");
        event.setPayload(payload);
        SseMetadata metadata = new SseMetadata();
        metadata.setSseStreamId(id);
        metadata.setStreamName("Events");
        metadata.setModelNamespace("test");
        metadata.setEvents(List.of(event));
        Operation operation = new Operation();
        operation.setOperationId(id);
        operation.setSseMetadata(metadata);
        return operation;
    }
}
